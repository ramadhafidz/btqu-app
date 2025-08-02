<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DashboardMetricsService;
use Illuminate\Support\Facades\Cache;

class ClearDashboardCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dashboard:clear-cache 
                           {--pattern= : Specific cache pattern to clear}
                           {--force : Force clearing without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear dashboard cache data';

    protected $dashboardService;

    /**
     * Create a new command instance.
     */
    public function __construct(DashboardMetricsService $dashboardService)
    {
        parent::__construct();
        $this->dashboardService = $dashboardService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $pattern = $this->option('pattern');
        $force = $this->option('force');

        if (!$force) {
            $confirmMessage = $pattern 
                ? "Clear dashboard cache with pattern: {$pattern}?"
                : "Clear ALL dashboard cache?";
                
            if (!$this->confirm($confirmMessage)) {
                $this->info('Cache clearing cancelled.');
                return 0;
            }
        }

        try {
            $this->info('Clearing dashboard cache...');
            
            if ($pattern) {
                $this->dashboardService->clearCache($pattern);
                $this->info("Dashboard cache cleared for pattern: {$pattern}");
            } else {
                $this->dashboardService->clearCache();
                $this->info('All dashboard cache cleared successfully.');
            }

            // Also clear general cache if no pattern specified
            if (!$pattern) {
                Cache::forget('dashboard_overall_stats');
                Cache::forget('dashboard_business_days');
                $this->info('Additional dashboard caches cleared.');
            }

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to clear dashboard cache: ' . $e->getMessage());
            return 1;
        }
    }
}
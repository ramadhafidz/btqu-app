<?php

namespace App\Services;

use App\Models\BtqGroup;
use App\Models\Student;
use App\Models\StudentProgress;
use App\Models\StudentProgressLog;
use App\Models\Employee;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardMetricsService
{
    protected $cachePrefix = 'dashboard_metrics';
    protected $defaultCacheTime = 300; // 5 minutes

    /**
     * Get comprehensive teacher dashboard metrics
     */
    public function getTeacherMetrics($teacherId, array $filters = [])
    {
        $cacheKey = "{$this->cachePrefix}_teacher_{$teacherId}_" . md5(serialize($filters));
        
        return Cache::remember($cacheKey, $this->defaultCacheTime, function () use ($teacherId, $filters) {
            $group = BtqGroup::where('teacher_id', $teacherId)->first();
            
            if (!$group) {
                return ['error' => 'Guru tidak memiliki grup'];
            }

            $studentIds = $group->students()->pluck('id');
            if ($studentIds->isEmpty()) {
                return ['error' => 'Tidak ada siswa dalam grup'];
            }

            return [
                'daily_progress_per_student' => $this->getDailyProgressPerStudent($studentIds, $filters),
                'jilid_distribution' => $this->getJilidDistribution($studentIds, $filters),
                'hafalan_count_per_student' => $this->getHafalanCountPerStudent($studentIds, $filters),
                'promotion_stats' => $this->getPromotionStats($studentIds, $filters),
                'pages_read_today' => $this->getPagesReadToday($studentIds, $filters),
                'daily_activity' => $this->getDailyActivity($studentIds, $filters),
                'students_ready_for_promotion' => $this->getStudentsReadyForPromotion($studentIds, $filters),
                'group_info' => [
                    'id' => $group->id,
                    'level' => $group->level,
                    'student_count' => $studentIds->count(),
                    'teacher_name' => $group->teacher->user->name ?? 'Unknown'
                ]
            ];
        });
    }

    /**
     * Get comprehensive coordinator dashboard metrics
     */
    public function getCoordinatorMetrics(array $filters = [])
    {
        $cacheKey = "{$this->cachePrefix}_coordinator_" . md5(serialize($filters));
        
        return Cache::remember($cacheKey, $this->defaultCacheTime, function () use ($filters) {
            return [
                'daily_teacher_activity' => $this->getDailyTeacherActivity($filters),
                'monthly_promotions' => $this->getMonthlyPromotions($filters),
                'teacher_ranking' => $this->getTeacherRanking($filters),
                'jilid_distribution_by_class_level' => $this->getJilidDistributionByClassLevel($filters),
                'hafalan_statistics' => $this->getHafalanStatistics($filters),
                'overall_stats' => $this->getOverallStats($filters)
            ];
        });
    }

    /**
     * Get daily progress per student in group
     */
    protected function getDailyProgressPerStudent($studentIds, array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);
        
        return DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->whereIn('student_progress.student_id', $studentIds)
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->where(function ($query) {
                $query->whereIn('student_progress_logs.created_at', function ($subQuery) {
                    $subQuery->select(DB::raw('DATE(created_at)'))
                        ->from('student_progress_logs')
                        ->whereRaw('WEEKDAY(created_at) < 5'); // Monday-Friday (0-4)
                });
            })
            ->select(
                'students.nama_lengkap as student_name',
                'students.id as student_id',
                DB::raw('DATE(student_progress_logs.created_at) as date'),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages_count"),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'hafalan' THEN 1 ELSE 0 END) as hafalan_count")
            )
            ->groupBy('students.id', 'students.nama_lengkap', DB::raw('DATE(student_progress_logs.created_at)'))
            ->orderBy('date', 'desc')
            ->orderBy('students.nama_lengkap')
            ->get()
            ->groupBy('student_name');
    }

    /**
     * Get jilid distribution for students
     */
    protected function getJilidDistribution($studentIds, array $filters = [])
    {
        return StudentProgress::whereIn('student_id', $studentIds)
            ->select('jilid', DB::raw('COUNT(*) as student_count'))
            ->groupBy('jilid')
            ->orderBy('jilid', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'label' => "Jilid {$item->jilid}",
                    'value' => $item->student_count,
                    'jilid' => $item->jilid
                ];
            });
    }

    /**
     * Get hafalan count per student
     */
    protected function getHafalanCountPerStudent($studentIds, array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);

        return DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->whereIn('student_progress.student_id', $studentIds)
            ->where('student_progress_logs.type', 'hafalan')
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->select(
                'students.nama_lengkap as student_name',
                'students.id as student_id',
                DB::raw('COUNT(*) as hafalan_count')
            )
            ->groupBy('students.id', 'students.nama_lengkap')
            ->orderBy('hafalan_count', 'desc')
            ->get();
    }

    /**
     * Get promotion statistics (proposed vs accepted)
     */
    protected function getPromotionStats($studentIds, array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 90); // 3 months default
        $dateTo = $this->getDateToFilter($filters);

        $stats = StudentProgress::whereIn('student_id', $studentIds)
            ->whereBetween('updated_at', [$dateFrom, $dateTo])
            ->whereIn('status_kenaikan', ['Diajukan', 'Diterima', 'Ditolak'])
            ->select('status_kenaikan', DB::raw('COUNT(*) as count'))
            ->groupBy('status_kenaikan')
            ->get()
            ->keyBy('status_kenaikan');

        return [
            'proposed' => $stats->get('Diajukan')->count ?? 0,
            'accepted' => $stats->get('Diterima')->count ?? 0,
            'rejected' => $stats->get('Ditolak')->count ?? 0,
            'chart_data' => [
                'labels' => ['Diajukan', 'Diterima', 'Ditolak'],
                'datasets' => [[
                    'data' => [
                        $stats->get('Diajukan')->count ?? 0,
                        $stats->get('Diterima')->count ?? 0,
                        $stats->get('Ditolak')->count ?? 0
                    ],
                    'backgroundColor' => ['#fbbf24', '#10b981', '#ef4444']
                ]]
            ]
        ];
    }

    /**
     * Get total pages read today
     */
    protected function getPagesReadToday($studentIds, array $filters = [])
    {
        $today = Carbon::today();
        
        // Skip weekends
        if ($today->isWeekend()) {
            $today = $today->previous(Carbon::FRIDAY);
        }

        return DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->whereIn('student_progress.student_id', $studentIds)
            ->where('student_progress_logs.type', 'halaman')
            ->whereDate('student_progress_logs.created_at', $today)
            ->count();
    }

    /**
     * Get daily activity data for charts
     */
    protected function getDailyActivity($studentIds, array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);

        $activities = DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->whereIn('student_progress.student_id', $studentIds)
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->whereRaw('WEEKDAY(student_progress_logs.created_at) < 5') // Monday-Friday only
            ->select(
                DB::raw('DATE(student_progress_logs.created_at) as date'),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages"),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'hafalan' THEN 1 ELSE 0 END) as hafalan")
            )
            ->groupBy(DB::raw('DATE(student_progress_logs.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return [
            'chart_data' => [
                'labels' => $activities->pluck('date')->map(function ($date) {
                    return Carbon::parse($date)->format('M d');
                }),
                'datasets' => [
                    [
                        'label' => 'Halaman',
                        'data' => $activities->pluck('pages'),
                        'backgroundColor' => '#3b82f6',
                        'borderColor' => '#3b82f6'
                    ],
                    [
                        'label' => 'Hafalan',
                        'data' => $activities->pluck('hafalan'),
                        'backgroundColor' => '#10b981',
                        'borderColor' => '#10b981'
                    ]
                ]
            ],
            'raw_data' => $activities
        ];
    }

    /**
     * Get students ready for promotion
     */
    protected function getStudentsReadyForPromotion($studentIds, array $filters = [])
    {
        // Students who have completed significant progress but haven't been promoted
        return DB::table('students')
            ->join('student_progress', 'students.id', '=', 'student_progress.student_id')
            ->leftJoin('student_progress_logs', 'student_progress.id', '=', 'student_progress_logs.student_progress_id')
            ->whereIn('students.id', $studentIds)
            ->where('student_progress.status_kenaikan', '!=', 'Diajukan')
            ->select(
                'students.id',
                'students.nama_lengkap',
                'student_progress.jilid',
                'student_progress.halaman',
                DB::raw('COUNT(student_progress_logs.id) as activity_count'),
                DB::raw('MAX(student_progress_logs.created_at) as last_activity')
            )
            ->groupBy('students.id', 'students.nama_lengkap', 'student_progress.jilid', 'student_progress.halaman')
            ->having('activity_count', '>=', 10) // Minimum 10 activities
            ->having('last_activity', '>=', Carbon::now()->subDays(7)) // Active in last week
            ->orderBy('activity_count', 'desc')
            ->get();
    }

    /**
     * Get daily teacher activity for coordinator dashboard
     */
    protected function getDailyTeacherActivity(array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);

        return DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->join('btq_groups', 'students.btq_group_id', '=', 'btq_groups.id')
            ->join('employees', 'btq_groups.teacher_id', '=', 'employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->whereRaw('WEEKDAY(student_progress_logs.created_at) < 5')
            ->select(
                'users.name as teacher_name',
                'employees.id as teacher_id',
                DB::raw('DATE(student_progress_logs.created_at) as date'),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages_count"),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'hafalan' THEN 1 ELSE 0 END) as hafalan_count"),
                DB::raw('COUNT(DISTINCT student_progress.student_id) as active_students')
            )
            ->groupBy('employees.id', 'users.name', DB::raw('DATE(student_progress_logs.created_at)'))
            ->orderBy('date', 'desc')
            ->orderBy('teacher_name')
            ->get()
            ->groupBy('teacher_name');
    }

    /**
     * Get monthly promotion statistics
     */
    protected function getMonthlyPromotions(array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 365); // 1 year default
        $dateTo = $this->getDateToFilter($filters);

        return StudentProgress::whereBetween('updated_at', [$dateFrom, $dateTo])
            ->where('status_kenaikan', 'Diterima')
            ->select(
                DB::raw('YEAR(updated_at) as year'),
                DB::raw('MONTH(updated_at) as month'),
                DB::raw('COUNT(*) as promotion_count')
            )
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'label' => Carbon::createFromDate($item->year, $item->month)->format('M Y'),
                    'year' => $item->year,
                    'month' => $item->month,
                    'count' => $item->promotion_count
                ];
            });
    }

    /**
     * Get teacher ranking by activity
     */
    protected function getTeacherRanking(array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);

        return DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->join('btq_groups', 'students.btq_group_id', '=', 'btq_groups.id')
            ->join('employees', 'btq_groups.teacher_id', '=', 'employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->whereRaw('WEEKDAY(student_progress_logs.created_at) < 5')
            ->select(
                'users.name as teacher_name',
                'employees.id as teacher_id',
                'btq_groups.level as group_level',
                DB::raw('COUNT(*) as total_activities'),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages_count"),
                DB::raw("SUM(CASE WHEN student_progress_logs.type = 'hafalan' THEN 1 ELSE 0 END) as hafalan_count"),
                DB::raw('COUNT(DISTINCT student_progress.student_id) as active_students'),
                DB::raw('COUNT(DISTINCT DATE(student_progress_logs.created_at)) as active_days')
            )
            ->groupBy('employees.id', 'users.name', 'btq_groups.level')
            ->orderBy('total_activities', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Get jilid distribution by class level
     */
    protected function getJilidDistributionByClassLevel(array $filters = [])
    {
        $query = DB::table('student_progress')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->join('school_classes', 'students.school_class_id', '=', 'school_classes.id')
            ->select(
                'school_classes.level as class_level',
                'student_progress.jilid',
                DB::raw('COUNT(*) as student_count')
            )
            ->groupBy('school_classes.level', 'student_progress.jilid')
            ->orderBy('school_classes.level')
            ->orderBy('student_progress.jilid');

        if (isset($filters['class_level'])) {
            $query->where('school_classes.level', $filters['class_level']);
        }

        return $query->get()->groupBy('class_level');
    }

    /**
     * Get hafalan statistics
     */
    protected function getHafalanStatistics(array $filters = [])
    {
        $dateFrom = $this->getDateFromFilter($filters, 30);
        $dateTo = $this->getDateToFilter($filters);

        $stats = DB::table('student_progress_logs')
            ->join('student_progress', 'student_progress_logs.student_progress_id', '=', 'student_progress.id')
            ->join('students', 'student_progress.student_id', '=', 'students.id')
            ->join('school_classes', 'students.school_class_id', '=', 'school_classes.id')
            ->where('student_progress_logs.type', 'hafalan')
            ->whereBetween('student_progress_logs.created_at', [$dateFrom, $dateTo])
            ->select(
                'school_classes.level as class_level',
                DB::raw('COUNT(*) as hafalan_count'),
                DB::raw('COUNT(DISTINCT students.id) as students_with_hafalan')
            )
            ->groupBy('school_classes.level')
            ->orderBy('school_classes.level')
            ->get();

        $totalHafalan = $stats->sum('hafalan_count');
        $totalStudentsWithHafalan = $stats->sum('students_with_hafalan');

        return [
            'total_hafalan' => $totalHafalan,
            'total_students_with_hafalan' => $totalStudentsWithHafalan,
            'average_hafalan_per_student' => $totalStudentsWithHafalan > 0 ? round($totalHafalan / $totalStudentsWithHafalan, 2) : 0,
            'by_class_level' => $stats,
            'chart_data' => [
                'labels' => $stats->pluck('class_level'),
                'datasets' => [[
                    'label' => 'Jumlah Hafalan',
                    'data' => $stats->pluck('hafalan_count'),
                    'backgroundColor' => '#10b981'
                ]]
            ]
        ];
    }

    /**
     * Get overall statistics for coordinator
     */
    protected function getOverallStats(array $filters = [])
    {
        return [
            'total_students' => Student::count(),
            'total_teachers' => Employee::whereHas('btqGroup')->count(),
            'total_groups' => BtqGroup::count(),
            'total_classes' => SchoolClass::count(),
            'active_promotions' => StudentProgress::where('status_kenaikan', 'Diajukan')->count(),
        ];
    }

    /**
     * Helper method to get date from filter
     */
    protected function getDateFromFilter(array $filters, int $defaultDays = 30)
    {
        if (isset($filters['date_from'])) {
            return Carbon::parse($filters['date_from'])->startOfDay();
        }
        
        return Carbon::now()->subDays($defaultDays)->startOfDay();
    }

    /**
     * Helper method to get date to filter
     */
    protected function getDateToFilter(array $filters)
    {
        if (isset($filters['date_to'])) {
            return Carbon::parse($filters['date_to'])->endOfDay();
        }
        
        return Carbon::now()->endOfDay();
    }

    /**
     * Clear dashboard cache
     */
    public function clearCache($pattern = null)
    {
        if ($pattern) {
            Cache::forget("{$this->cachePrefix}_{$pattern}");
        } else {
            // Clear all dashboard cache (implementation would depend on cache driver)
            $tags = ['dashboard_metrics'];
            if (method_exists(Cache::store(), 'tags')) {
                Cache::tags($tags)->flush();
            }
        }
    }

    /**
     * Check if current day is a business day (Monday-Friday, excluding holidays)
     */
    public function isBusinessDay(Carbon $date = null)
    {
        $date = $date ?? Carbon::now();
        
        // Check if it's weekend
        if ($date->isWeekend()) {
            return false;
        }

        // Add Indonesian holidays check here if needed
        $holidays = $this->getIndonesianHolidays($date->year);
        
        return !in_array($date->format('Y-m-d'), $holidays);
    }

    /**
     * Get Indonesian holidays for a given year
     * This is a simplified version - in production you might want to use a holidays API or library
     */
    protected function getIndonesianHolidays(int $year)
    {
        // This is a basic implementation - extend as needed
        $holidays = [
            // New Year
            "{$year}-01-01",
            // Independence Day
            "{$year}-08-17",
            // Add more holidays as needed
        ];

        return $holidays;
    }
}
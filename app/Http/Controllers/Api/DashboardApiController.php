<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardMetricsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DashboardApiController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardMetricsService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get teacher dashboard data
     */
    public function teacherDashboard(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak memiliki akses guru'
            ], 403);
        }

        $validator = $this->validateFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filters = $this->buildFilters($request);
            $metrics = $this->dashboardService->getTeacherMetrics($user->teacher->id, $filters);

            if (isset($metrics['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $metrics['error']
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'meta' => [
                    'filters_applied' => $filters,
                    'generated_at' => now()->toISOString(),
                    'cache_enabled' => true
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data dashboard',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get coordinator dashboard data
     */
    public function coordinatorDashboard(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'koordinator') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak memiliki akses koordinator'
            ], 403);
        }

        $validator = $this->validateFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filters = $this->buildFilters($request);
            $metrics = $this->dashboardService->getCoordinatorMetrics($filters);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'meta' => [
                    'filters_applied' => $filters,
                    'generated_at' => now()->toISOString(),
                    'cache_enabled' => true
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data dashboard',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get specific teacher metrics (for coordinator)
     */
    public function teacherMetrics(Request $request, $teacherId)
    {
        $user = Auth::user();
        
        if ($user->role !== 'koordinator') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak memiliki akses koordinator'
            ], 403);
        }

        $validator = $this->validateFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filters = $this->buildFilters($request);
            $metrics = $this->dashboardService->getTeacherMetrics($teacherId, $filters);

            if (isset($metrics['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $metrics['error']
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'meta' => [
                    'teacher_id' => $teacherId,
                    'filters_applied' => $filters,
                    'generated_at' => now()->toISOString(),
                    'cache_enabled' => true
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data metrics guru',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get dashboard statistics summary
     */
    public function dashboardSummary(Request $request)
    {
        $user = Auth::user();
        
        try {
            $filters = $this->buildFilters($request);
            
            if ($user->role === 'guru' && $user->teacher) {
                $metrics = $this->dashboardService->getTeacherMetrics($user->teacher->id, $filters);
                
                if (isset($metrics['error'])) {
                    return response()->json([
                        'success' => false,
                        'message' => $metrics['error']
                    ], 404);
                }

                // Return simplified summary for teacher
                $summary = [
                    'role' => 'guru',
                    'group_info' => $metrics['group_info'],
                    'pages_read_today' => $metrics['pages_read_today'],
                    'total_students' => $metrics['group_info']['student_count'],
                    'students_ready_for_promotion' => count($metrics['students_ready_for_promotion']),
                    'promotion_stats' => $metrics['promotion_stats']
                ];

            } elseif ($user->role === 'koordinator') {
                $metrics = $this->dashboardService->getCoordinatorMetrics($filters);
                
                // Return simplified summary for coordinator
                $summary = [
                    'role' => 'koordinator',
                    'overall_stats' => $metrics['overall_stats'],
                    'top_teachers' => $metrics['teacher_ranking']->take(5),
                    'monthly_promotions' => $metrics['monthly_promotions']->take(6)
                ];

            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Role tidak didukung untuk dashboard'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $summary,
                'meta' => [
                    'filters_applied' => $filters,
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil ringkasan dashboard',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Clear dashboard cache
     */
    public function clearCache(Request $request)
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['koordinator', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak memiliki akses untuk membersihkan cache'
            ], 403);
        }

        try {
            $pattern = $request->input('pattern');
            $this->dashboardService->clearCache($pattern);

            return response()->json([
                'success' => true,
                'message' => 'Cache dashboard berhasil dibersihkan',
                'pattern' => $pattern ?: 'all'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membersihkan cache',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Check if current time is business hours
     */
    public function businessDayStatus()
    {
        try {
            $isBusinessDay = $this->dashboardService->isBusinessDay();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'is_business_day' => $isBusinessDay,
                    'current_time' => now()->toISOString(),
                    'timezone' => config('app.timezone')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memeriksa hari kerja',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Validate request filters
     */
    protected function validateFilters(Request $request)
    {
        return Validator::make($request->all(), [
            'date_from' => 'sometimes|date|before_or_equal:date_to',
            'date_to' => 'sometimes|date|after_or_equal:date_from',
            'class_level' => 'sometimes|integer|min:1|max:12',
            'group_id' => 'sometimes|integer|exists:btq_groups,id'
        ]);
    }

    /**
     * Build filters array from request
     */
    protected function buildFilters(Request $request)
    {
        $filters = [];

        if ($request->has('date_from')) {
            $filters['date_from'] = $request->input('date_from');
        }

        if ($request->has('date_to')) {
            $filters['date_to'] = $request->input('date_to');
        }

        if ($request->has('class_level')) {
            $filters['class_level'] = $request->input('class_level');
        }

        if ($request->has('group_id')) {
            $filters['group_id'] = $request->input('group_id');
        }

        return $filters;
    }
}
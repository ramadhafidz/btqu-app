<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\SchoolClassController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\ChartController;

Route::get('/user', function (Request $request) {
  return $request->user();
})->middleware('auth:sanctum');

// Dashboard API Routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Enhanced dashboard endpoints
    Route::prefix('dashboard')->group(function () {
        Route::get('/teacher', [DashboardApiController::class, 'teacherDashboard']);
        Route::get('/coordinator', [DashboardApiController::class, 'coordinatorDashboard']);
        Route::get('/teacher/{teacherId}/metrics', [DashboardApiController::class, 'teacherMetrics']);
        Route::get('/summary', [DashboardApiController::class, 'dashboardSummary']);
        Route::get('/business-day-status', [DashboardApiController::class, 'businessDayStatus']);
        Route::delete('/cache', [DashboardApiController::class, 'clearCache']);
    });

    // Legacy chart endpoints (enhanced)
    Route::prefix('charts')->group(function () {
        Route::get('/teacher-dashboard', [ChartController::class, 'enhancedTeacherDashboard']);
        Route::get('/coordinator-dashboard', [ChartController::class, 'enhancedCoordinatorDashboard']);
        Route::get('/teacher/{teacherId}/metrics', [ChartController::class, 'getTeacherMetrics']);
        Route::delete('/cache', [ChartController::class, 'clearDashboardCache']);
        
        // Existing routes
        Route::get('/teacher', [ChartController::class, 'teacherDashboard']);
        Route::get('/coordinator', [ChartController::class, 'coordinatorDashboard']);
        Route::get('/group/{group}/detail', [ChartController::class, 'groupDetailDashboard']);
        Route::get('/student-distribution-by-jilid', [ChartController::class, 'studentDistributionByJilid']);
    });
});

// Route::middleware(['auth:sanctum'])->group(function () {
//     Route::apiResource('school-classes', SchoolClassController::class);
// });

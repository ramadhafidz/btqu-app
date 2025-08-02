<?php

use App\Services\DashboardMetricsService;
use App\Models\BtqGroup;
use App\Models\Employee;
use App\Models\User;
use App\Models\Student;
use App\Models\StudentProgress;
use App\Models\StudentProgressLog;
use App\Models\SchoolClass;

beforeEach(function () {
    $this->service = new DashboardMetricsService();
});

it('can instantiate dashboard metrics service', function () {
    expect($this->service)->toBeInstanceOf(DashboardMetricsService::class);
});

it('checks if current day is business day', function () {
    $isBusinessDay = $this->service->isBusinessDay();
    expect($isBusinessDay)->toBeBoolean();
});

it('returns error when teacher has no group', function () {
    $result = $this->service->getTeacherMetrics(999, []); // Non-existent teacher
    expect($result)->toHaveKey('error');
    expect($result['error'])->toBe('Guru tidak memiliki grup');
});

it('can get coordinator metrics structure', function () {
    $result = $this->service->getCoordinatorMetrics([]);
    
    expect($result)->toHaveKeys([
        'daily_teacher_activity',
        'monthly_promotions', 
        'teacher_ranking',
        'jilid_distribution_by_class_level',
        'hafalan_statistics',
        'overall_stats'
    ]);
});

it('validates filter date formats', function () {
    // Test that service can handle date filters without errors
    $filters = [
        'date_from' => '2024-01-01',
        'date_to' => '2024-12-31'
    ];
    
    $result = $this->service->getCoordinatorMetrics($filters);
    expect($result)->toBeArray();
    expect($result)->toHaveKey('overall_stats');
});
<?php

use App\Models\User;
use App\Models\Employee;
use App\Models\BtqGroup;

beforeEach(function () {
    // Clear cache before each test
    \Illuminate\Support\Facades\Cache::flush();
});

it('requires authentication for dashboard endpoints', function () {
    $response = $this->getJson('/api/dashboard/teacher');
    $response->assertStatus(401);
    
    $response = $this->getJson('/api/dashboard/coordinator');
    $response->assertStatus(401);
});

it('teacher can access teacher dashboard endpoint', function () {
    // Create a teacher user
    $user = User::factory()->create(['role' => 'guru']);
    $employee = Employee::factory()->create(['user_id' => $user->id]);
    $group = BtqGroup::factory()->create(['teacher_id' => $employee->id]);
    
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/teacher');
    
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'data' => [
            'group_info',
            'daily_progress_per_student',
            'jilid_distribution',
            'hafalan_count_per_student',
            'promotion_stats',
            'pages_read_today',
            'daily_activity',
            'students_ready_for_promotion'
        ],
        'meta'
    ]);
});

it('coordinator can access coordinator dashboard endpoint', function () {
    $user = User::factory()->create(['role' => 'koordinator']);
    
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/coordinator');
    
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'data' => [
            'daily_teacher_activity',
            'monthly_promotions',
            'teacher_ranking',
            'jilid_distribution_by_class_level',
            'hafalan_statistics',
            'overall_stats'
        ],
        'meta'
    ]);
});

it('validates date filters properly', function () {
    $user = User::factory()->create(['role' => 'koordinator']);
    
    // Invalid date format
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/coordinator?date_from=invalid-date');
    
    $response->assertStatus(422);
    $response->assertJsonStructure([
        'success',
        'message',
        'errors'
    ]);
});

it('returns business day status', function () {
    $user = User::factory()->create(['role' => 'guru']);
    
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/business-day-status');
    
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'data' => [
            'is_business_day',
            'current_time',
            'timezone'
        ]
    ]);
});

it('only allows coordinator to clear cache', function () {
    $teacher = User::factory()->create(['role' => 'guru']);
    $coordinator = User::factory()->create(['role' => 'koordinator']);
    
    // Teacher should be forbidden
    $response = $this->actingAs($teacher, 'sanctum')
        ->deleteJson('/api/dashboard/cache');
    $response->assertStatus(403);
    
    // Coordinator should be allowed
    $response = $this->actingAs($coordinator, 'sanctum')
        ->deleteJson('/api/dashboard/cache');
    $response->assertStatus(200);
});
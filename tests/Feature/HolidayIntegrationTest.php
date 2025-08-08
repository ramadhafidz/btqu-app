<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Holiday;
use App\Models\User;
use App\Models\BtqGroup;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class HolidayIntegrationTest extends TestCase
{
  use RefreshDatabase;

  /** @test */
  public function holiday_affects_active_days_calculation()
  {
    // Arrange: Create test data
    /** @var User $user */
    $user = User::factory()->create(['role' => 'koordinator']);

    // Create a holiday for yesterday
    $yesterday = Carbon::yesterday()->format('Y-m-d');
    Holiday::create([
      'tanggal' => $yesterday,
      'keterangan' => 'Test Holiday',
    ]);

    // Act: Call coordinator dashboard API
    $response = $this->actingAs($user)->getJson(
      '/api/charts/coordinator-dashboard',
    );

    // Assert: Holiday should be counted in calculation
    $response->assertStatus(200);

    $data = $response->json();

    // Verify that activeDaysInfo includes holiday count
    foreach ($data as $groupData) {
      if (isset($groupData['activeDaysInfo'])) {
        $this->assertArrayHasKey('holidays', $groupData['activeDaysInfo']);
        $this->assertGreaterThanOrEqual(
          1,
          $groupData['activeDaysInfo']['holidays'],
        );
      }
    }
  }

  public function adding_holiday_immediately_affects_dashboard()
  {
    // Arrange
    /** @var User $user */
    $user = User::factory()->create(['role' => 'koordinator']);

    // Get initial dashboard data
    $initialResponse = $this->actingAs($user)->getJson(
      '/api/charts/coordinator-dashboard',
    );

    $initialData = $initialResponse->json();
    $initialHolidayCount = 0;

    if (!empty($initialData)) {
      $firstGroup = reset($initialData);
      $initialHolidayCount = $firstGroup['activeDaysInfo']['holidays'] ?? 0;
    }

    // Act: Add a holiday within the analysis period (last 30 days)
    $testDate = Carbon::now()->subDays(15)->format('Y-m-d');
    Holiday::create([
      'tanggal' => $testDate,
      'keterangan' => 'Dynamic Test Holiday',
    ]);

    // Get updated dashboard data
    $updatedResponse = $this->actingAs($user)->getJson(
      '/api/charts/coordinator-dashboard',
    );

    // Assert: Holiday count should increase
    $updatedData = $updatedResponse->json();

    if (!empty($updatedData)) {
      $firstGroup = reset($updatedData);
      $updatedHolidayCount = $firstGroup['activeDaysInfo']['holidays'] ?? 0;

      $this->assertGreaterThan(
        $initialHolidayCount,
        $updatedHolidayCount,
        'Holiday count should increase after adding a holiday',
      );
    }
  }
  public function holiday_import_affects_calculations()
  {
    // Arrange
    /** @var User $user */
    $user = User::factory()->create(['role' => 'koordinator']);
    // Arrange
    $user = User::factory()->create(['role' => 'koordinator']);

    // Act: Import national holidays
    $response = $this->actingAs($user)->postJson(
      '/admin/holidays/import-national',
      [
        'year' => now()->year,
      ],
    );

    // Assert: Import should be successful
    $response->assertRedirect();

    // Verify holidays were created
    $holidayCount = Holiday::whereYear('tanggal', now()->year)->count();
    $this->assertGreaterThan(0, $holidayCount);

    // Verify dashboard reflects the holidays
    $dashboardResponse = $this->actingAs($user)->getJson(
      '/api/charts/coordinator-dashboard',
    );

    $dashboardData = $dashboardResponse->json();

    if (!empty($dashboardData)) {
      $firstGroup = reset($dashboardData);
      $this->assertGreaterThan(
        0,
        $firstGroup['activeDaysInfo']['holidays'] ?? 0,
        'Dashboard should reflect imported holidays',
      );
    }
  }

  /** @test */
  public function weekend_and_holiday_filtering_works_correctly()
  {
    // Arrange
    $user = User::factory()->create(['role' => 'koordinator']);

    // Add multiple holidays
    $holidays = [
      Carbon::now()->subDays(5)->format('Y-m-d'),
      Carbon::now()->subDays(10)->format('Y-m-d'),
      Carbon::now()->subDays(20)->format('Y-m-d'),
    ];

    foreach ($holidays as $date) {
      Holiday::create([
        'tanggal' => $date,
        'keterangan' => 'Test Holiday ' . $date,
      ]);
    }

    // Act
    $response = $this->actingAs($user)->getJson(
      '/api/charts/coordinator-dashboard',
    );

    // Assert
    $data = $response->json();

    if (!empty($data)) {
      $firstGroup = reset($data);
      $activeDaysInfo = $firstGroup['activeDaysInfo'];

      // Verify calculation logic
      $expectedActiveDays =
        $activeDaysInfo['period'] -
        $activeDaysInfo['weekends'] -
        $activeDaysInfo['holidays'];

      $this->assertEquals(
        $expectedActiveDays,
        $activeDaysInfo['activeDays'],
        'Active days calculation should be: period - weekends - holidays',
      );

      // Holidays should be counted correctly
      $this->assertEquals(
        3,
        $activeDaysInfo['holidays'],
        'Should count exactly 3 holidays in the period',
      );
    }
  }
}
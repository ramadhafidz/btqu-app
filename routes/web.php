<?php

use App\Http\Controllers\Admin\{
  SchoolClassController,
  EmployeeController,
  StudentController,
  BtqGroupController,
  PromotionApprovalController,
  HolidayController,
};
use App\Http\Controllers\Teacher\{
  MyGroupController,
  ProgressController,
  PromotionController,
};
use App\Http\Controllers\{
  DataController,
  DashboardController,
  ProfileController,
  ChartController,
};
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\BtqGroup;
use App\Http\Controllers\Superadmin\UserController as SuperadminUserController;

// Route::get('/', function () {
//   return Inertia::render('Welcome', [
//     'canLogin' => Route::has('login'),
//     'canRegister' => Route::has('register'),
//     'laravelVersion' => Application::VERSION,
//     'phpVersion' => PHP_VERSION,
//   ]);
// });

Route::get('/', function () {
  return redirect()->route('login');
});

// Test route untuk debug holidays
Route::get('/', function () {
  return redirect()->route('login');
});

// --- RUTE YANG MEMBUTUHKAN LOGIN ---
Route::middleware(['auth', 'verified', 'password.changed'])->group(function () {
  Route::get('/dashboard', [DashboardController::class, 'index'])->name(
    'dashboard',
  );

  Route::prefix('superadmin')
    ->name('superadmin.')
    ->middleware('role.superadmin')
    ->group(function () {
      Route::resource('/users', SuperadminUserController::class)->except([
        'show',
        'create',
        'edit',
      ]);
      //   Route::post('/users', [SuperadminUserController::class, 'store'])->name(
      //     'users.store',
      //   );
      //   Route::patch('/users/{user}/change-role', [
      //     SuperadminUserController::class,
      //     'changeRole',
      //   ])->name('users.change-role');

      Route::get('/password-resets', [
        SuperadminUserController::class,
        'passwordRequestsIndex',
      ])->name('password-resets.index');

      Route::post('/users/{user}/reset-password', [
        SuperadminUserController::class,
        'resetPassword',
      ])->name('users.reset-password');

      Route::prefix('api')
        ->name('api.')
        ->group(function () {
          Route::apiResource('employees', EmployeeController::class)->names(
            'teachers',
          );
        });
    });

  // --- RUTE KHUSUS KOORDINATOR ---
  Route::prefix('admin')
    ->name('admin.')
    ->middleware('role.koordinator')
    ->group(function () {
      // Halaman Admin
      Route::get(
        '/school-classes',
        fn() => Inertia::render('Admin/SchoolClasses'),
      )->name('school-classes.index');
      //   Route::get(
      //     '/teachers',
      //     fn() => Inertia::render('Admin/Teachers'),
      //   )->name('teachers.index');
      Route::get('/students', fn() => Inertia::render('Admin/Students'))->name(
        'students.index',
      );
      Route::get(
        '/btq-groups',
        fn() => Inertia::render('Admin/BtqGroups'),
      )->name('btq-groups.index');

      // Holidays management
      Route::get('/holidays', [HolidayController::class, 'index'])->name(
        'holidays.index',
      );
      Route::post('/holidays', [HolidayController::class, 'store'])->name(
        'holidays.store',
      );
      Route::put('/holidays/{holiday}', [
        HolidayController::class,
        'update',
      ])->name('holidays.update');
      Route::delete('/holidays/{holiday}', [
        HolidayController::class,
        'destroy',
      ])->name('holidays.destroy');
      Route::post('/holidays/import-national', [
        HolidayController::class,
        'importNationalHolidays',
      ])->name('holidays.import-national');

      // API Admin
      Route::prefix('api')
        ->name('api.')
        ->group(function () {
          Route::apiResource('school-classes', SchoolClassController::class);
          Route::apiResource('students', StudentController::class);
          Route::apiResource('btq-groups', BtqGroupController::class);
          Route::get('all-school-classes', [
            SchoolClassController::class,
            'all',
          ])->name('all-school-classes');
          Route::get('all-teachers', [EmployeeController::class, 'all'])->name(
            'all-teachers',
          );
          Route::get('unassigned-students', [
            StudentController::class,
            'unassigned',
          ])->name('unassigned-students');
          Route::post('btq-groups/{btq_group}/add-student', [
            BtqGroupController::class,
            'addStudent',
          ])->name('btq-groups.add-student');
          Route::post('btq-groups/{btq_group}/remove-student', [
            BtqGroupController::class,
            'removeStudent',
          ])->name('btq-groups.remove-student');
        });

      Route::get('/promotion-approvals', [
        PromotionApprovalController::class,
        'index',
      ])->name('promotion-approvals.index');
      Route::post('/promotion-approvals/{progress}/approve', [
        PromotionApprovalController::class,
        'approve',
      ])->name('promotion-approvals.approve');
      Route::post('/promotion-approvals/{progress}/reject', [
        PromotionApprovalController::class,
        'reject',
      ])->name('promotion-approvals.reject');

      Route::get('/dashboard/group/{group}', function (BtqGroup $group) {
        return Inertia::render('Admin/GroupDetailDashboard', [
          'group' => $group,
        ]);
      })->name('dashboard.group-detail');

      Route::prefix('api')
        ->name('api.')
        ->group(function () {
          Route::get('/charts/group-detail/{group}', [
            ChartController::class,
            'groupDetailDashboard',
          ])->name('charts.group-detail');
        });
    });

  // --- RUTE KHUSUS GURU ---
  Route::prefix('teacher')
    ->name('teacher.')
    ->group(function () {
      Route::get('/my-group', [MyGroupController::class, 'index'])->name(
        'my-group.index',
      );
      Route::patch('/progress/{progress}', [
        ProgressController::class,
        'update',
      ])->name('progress.update');
      Route::post('/promotions/{progress}', [
        PromotionController::class,
        'propose',
      ])->name('promotions.propose');
      //Route::put('/hafalan/{btq_group}', [HafalanController::class, 'update'])->name('hafalan.update');
    });

  // --- RUTE PROFIL & DATA UMUM ---
  Route::prefix('profile')
    ->name('profile.')
    ->group(function () {
      Route::get('/', [ProfileController::class, 'edit'])->name('edit');
      Route::patch('/', [ProfileController::class, 'update'])->name('update');
      Route::delete('/', [ProfileController::class, 'destroy'])->name(
        'destroy',
      );
    });
  Route::get('/api/juzs', [DataController::class, 'juzs'])->name('api.juzs');
  Route::get('/api/surahs', [DataController::class, 'surahs'])->name(
    'api.surahs',
  );

  Route::prefix('api/charts')
    ->name('api.charts.')
    ->group(function () {
      // Rute untuk guru
      Route::get('/teacher-dashboard', [
        ChartController::class,
        'teacherDashboard',
      ])->name('teacher-dashboard');

      // Rute untuk koordinator, dilindungi oleh middleware role
      Route::get('/coordinator-dashboard', [
        ChartController::class,
        'coordinatorDashboard',
      ])
        ->middleware('role.koordinator')
        ->name('coordinator-dashboard');

      Route::get('/student-distribution', [
        ChartController::class,
        'studentDistributionByJilid',
      ])
        ->middleware('role.koordinator')
        ->name('student-distribution');
    });
});

require __DIR__ . '/auth.php';

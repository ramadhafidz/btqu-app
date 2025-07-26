<?php

use App\Http\Controllers\Admin\{SchoolClassController, TeacherController, StudentController, BtqGroupController};
use App\Http\Controllers\Teacher\{MyGroupController, ProgressController, PromotionController, HafalanController};
use App\Http\Controllers\{DataController, DashboardController, ProfileController};
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// --- RUTE YANG MEMBUTUHKAN LOGIN ---
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // --- RUTE KHUSUS KOORDINATOR ---
    Route::prefix('admin')->name('admin.')->middleware('role.koordinator')->group(function () {
        // Halaman Admin
        Route::get('/school-classes', fn() => Inertia::render('Admin/SchoolClasses/Index'))->name('school-classes.index');
        Route::get('/teachers', fn() => Inertia::render('Admin/Teachers/Index'))->name('teachers.index');
        Route::get('/students', fn() => Inertia::render('Admin/Students/Index'))->name('students.index');
        Route::get('/btq-groups', fn() => Inertia::render('Admin/BtqGroups/Index'))->name('btq-groups.index');

        // API Admin
        Route::prefix('api')->name('api.')->group(function () {
            Route::apiResource('school-classes', SchoolClassController::class);
            Route::apiResource('teachers', TeacherController::class);
            Route::apiResource('students', StudentController::class);
            Route::apiResource('btq-groups', BtqGroupController::class);
            Route::get('all-school-classes', [SchoolClassController::class, 'all'])->name('all-school-classes');
            Route::get('all-teachers', [TeacherController::class, 'all'])->name('all-teachers');
            Route::get('unassigned-students', [StudentController::class, 'unassigned'])->name('unassigned-students');
            Route::post('btq-groups/{btq_group}/add-student', [BtqGroupController::class, 'addStudent'])->name('btq-groups.add-student');
            Route::post('btq-groups/{btq_group}/remove-student', [BtqGroupController::class, 'removeStudent'])->name('btq-groups.remove-student');
        });
    });

    // --- RUTE KHUSUS GURU ---
    Route::prefix('teacher')->name('teacher.')->group(function () {
        Route::get('/my-group', [MyGroupController::class, 'index'])->name('my-group.index');
        Route::patch('/progress/{progress}', [ProgressController::class, 'update'])->name('progress.update');
        Route::post('/promotions/{progress}', [PromotionController::class, 'propose'])->name('promotions.propose');
        Route::put('/hafalan/{btq_group}', [HafalanController::class, 'update'])->name('hafalan.update');
    });

    // --- RUTE PROFIL & DATA UMUM ---
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });
    Route::get('/api/juzs', [DataController::class, 'juzs'])->name('api.juzs');
    Route::get('/api/surahs', [DataController::class, 'surahs'])->name('api.surahs');
});

require __DIR__ . '/auth.php';

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee; // Diubah dari Teacher
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class EmployeeController extends Controller // Diubah dari TeacherController
{
  /**
   * Display a listing of the resource.
   */
  public function index(Request $request)
  {
    $employees = Employee::query() // Diubah dari Teacher
      ->with([
        'user',
        'btqGroup' => function ($query) {
          $query->withCount('students');
        },
      ])
      ->when($request->input('search'), function ($query, $search) {
        $query
          ->where('id_pegawai', 'like', "%{$search}%")
          ->orWhereHas('user', function ($subQuery) use ($search) {
            $subQuery
              ->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
          });
      })
      ->get();

    return response()->json($employees);
  }

  /**
   * Store a newly created resource in storage.
   * Catatan: Logika utama pembuatan user kini ada di Superadmin/UserController.
   * Metode ini dipertahankan untuk kompatibilitas API jika masih digunakan.
   */
  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' =>
        'required|string|lowercase|email|max:255|unique:' . User::class,
      'password' => ['required', 'confirmed', Rules\Password::defaults()],
      'id_pegawai' => 'required|string|max:255|unique:' . Employee::class, // Diubah ke Employee
    ]);

    $employee = DB::transaction(function () use ($request) {
      // Buat data User terlebih dahulu
      $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'guru', // Diasumsikan controller ini hanya untuk membuat guru
      ]);

      // Buat data Employee yang terhubung dengan user baru
      $employee = Employee::create([ // Diubah dari Teacher
        'user_id' => $user->id,
        'id_pegawai' => $request->id_pegawai,
      ]);

      return $employee;
    });

    return response()->json($employee->load('user'), 201);
  }

  /**
   * Display the specified resource.
   */
  public function show(Employee $employee) // Diubah dari Teacher
  {
    return response()->json($employee->load('user'));
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Employee $employee) // Diubah dari Teacher
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' =>
        'required|string|lowercase|email|max:255|unique:users,email,' .
        $employee->user_id,
      'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
      'id_pegawai' =>
        'required|string|max:255|unique:employees,id_pegawai,' . $employee->id, // Diubah ke 'employees'
    ]);

    $employee = DB::transaction(function () use ($request, $employee) {
      // Update data di tabel users
      $employee->user->update([
        'name' => $request->name,
        'email' => $request->email,
      ]);

      // Jika ada password baru, update juga passwordnya
      if ($request->filled('password')) {
        $employee->user->update([
          'password' => Hash::make($request->password),
        ]);
      }

      // Update data di tabel employees
      $employee->update([
        'id_pegawai' => $request->id_pegawai,
      ]);

      return $employee;
    });

    return response()->json($employee->load('user'));
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Employee $employee) // Diubah dari Teacher
  {
    DB::transaction(function () use ($employee) {
      $employee->user->delete();
      $employee->delete();
    });

    return response()->noContent();
  }

  /**
   * Mengambil daftar guru untuk dropdown/pilihan.
   */
  public function all(Request $request)
  {
    $employees = Employee::query() // Diubah dari Teacher
      ->with('user')
      // Filter penting: Hanya ambil pegawai yang role-nya 'guru'
      ->whereHas('user', function ($query) {
        $query->where('role', 'guru');
      })
      ->when($request->input('search'), function ($query, $search) {
        $query->whereHas('user', function ($subQuery) use ($search) {
          $subQuery->where('name', 'like', "%{$search}%");
        });
      })
      ->limit(20)
      ->get();

    return response()->json($employees);
  }
}
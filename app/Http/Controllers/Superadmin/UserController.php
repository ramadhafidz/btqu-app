<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PasswordResetRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
  public function index(Request $request)
  {
    $users = User::query()
      ->whereIn('role', ['guru', 'koordinator'])
      ->with('employee')
      ->when($request->input('search'), function ($query, $search) {
        $query
          ->where('name', 'like', "%{$search}%")
          ->orWhere('email', 'like', "%{$search}%")
          ->orWhereHas('employee', function ($subQuery) use ($search) {
            $subQuery->where('id_pegawai', 'like', "%{$search}%");
          });
      })
      ->orderBy('name')
      ->get();

    return Inertia::render('Superadmin/Users/Index', [
      'users' => $users,
    ]);
  }

  public function passwordRequestsIndex()
  {
    $requests = PasswordResetRequest::where('status', 'pending')
      ->with('user')
      ->latest()
      ->get();

    return Inertia::render('Superadmin/PasswordResets/Index', [
      'requests' => $requests,
    ]);
  }

  public function resetPassword(Request $request, User $user)
  {
    $idPegawai = $user->employee->id_pegawai;
    $defaultPassword = 'guruquran' . $idPegawai;

    // Reset password ke default
    $user->password = $defaultPassword; // Ganti dengan password default Anda
    $user->password_changed_at = null; // Paksa ganti password saat login lagi
    $user->save();

    // Selesaikan permintaan
    PasswordResetRequest::where('user_id', $user->id)
      ->where('status', 'pending')
      ->update(['status' => 'completed']);

    return back()->with(
      'success',
      "Password untuk {$user->name} berhasil di-reset.",
    );
  }

  public function store(Request $request)
  {
    // dd($request->all());

    $request->validate([
      'name' => 'required|string|max:255',
      'email' =>
        'required|string|lowercase|email|max:255|unique:' . User::class,
      'role' => ['required', Rule::in(['guru', 'koordinator'])],
      'id_pegawai' => 'required|string|max:255|unique:' . Employee::class,
    ]);

    DB::transaction(function () use ($request) {
      $defaultPassword = 'guruquran' . $request->id_pegawai;

      $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'role' => $request->role,
        'password' => $defaultPassword,
      ]);

      Employee::create([
        'user_id' => $user->id,
        'id_pegawai' => $request->id_pegawai,
      ]);
    });

    return to_route('superadmin.users.index')->with(
      'success',
      'User baru berhasil ditambahkan.',
    );
  }

  public function update(Request $request, User $user)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' =>
        'required|string|lowercase|email|max:255|unique:users,email,' .
        $user->id,
      'id_pegawai' =>
        'required|string|max:255|unique:employees,id_pegawai,' .
        $user->employee->id,
      'role' => ['required', Rule::in(['guru', 'koordinator'])],
    ]);

    DB::transaction(function () use ($request, $user) {
      $user->update($request->only('name', 'email', 'role'));
      $user->employee->update($request->only('id_pegawai'));
    });

    return back()->with('success', 'Data user berhasil diubah.');
  }

  public function destroy(User $user)
  {
    // Transaksi tidak wajib di sini karena onDelete('cascade') sudah diatur di migrasi
    $user->delete();
    return back()->with('success', 'User berhasil dihapus.');
  }
}

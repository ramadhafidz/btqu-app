<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
  public function index()
  {
    $users = User::whereIn('role', ['guru', 'koordinator'])
      ->with('teacher') // Load relasi teacher jika ada
      ->orderBy('name')
      ->get();

    return Inertia::render('Superadmin/Users/Index', [
      'users' => $users,
    ]);
  }

  public function changeRole(Request $request, User $user)
  {
    $validated = $request->validate([
      'role' => ['required', Rule::in(['guru', 'koordinator'])],
    ]);

    // Jika guru diubah jadi koor, hapus data teacher-nya
    if ($user->role === 'guru' && $validated['role'] === 'koordinator') {
      $user->teacher()->delete();
    }

    $user->role = $validated['role'];
    $user->save();

    return back()->with('success', 'Role pengguna berhasil diubah.');
  }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\BtqGroup;
use App\Models\User;

class DashboardController extends Controller
{
  public function index()
  {
    $user = Auth::user();

    if ($user->role === 'guru') {
      $group = BtqGroup::where('teacher_id', $user->employee?->id)
        ->with(['students.progress', 'teacher.user'])
        ->first();
      return Inertia::render('Teacher/Dashboard', [
        'btqGroup' => $group,
      ]);
    } elseif ($user->role === 'koordinator') {
      return Inertia::render('Dashboard');
    } elseif ($user->role === 'superadmin') {
      // Data yang mungkin dibutuhkan Superadmin di dashboard-nya
      $stats = [
        'total_users' => User::whereIn('role', [
          'guru',
          'koordinator',
        ])->count(),
        'total_teachers' => User::where('role', 'guru')->count(),
        'total_coordinators' => User::where('role', 'koordinator')->count(),
      ];
      return Inertia::render('Superadmin/Dashboard', ['stats' => $stats]);
    }

    // Fallback jika role tidak terdefinisi
    return redirect('/');
  }
}

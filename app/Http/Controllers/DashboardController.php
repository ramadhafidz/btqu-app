<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\BtqGroup;

class DashboardController extends Controller
{
  public function index()
  {
    $user = Auth::user();

    if ($user->role === 'guru') {
      // Jika user adalah guru, cari grup yang dia ajar
      $group = BtqGroup::where('teacher_id', $user->teacher?->id)
        ->with(['students.progress', 'teacher.user'])
        ->first();

      // Tampilkan halaman khusus untuk guru dan kirim data grupnya
      return Inertia::render('Teacher/Dashboard', [
        'btqGroup' => $group,
      ]);
    }

    // Jika bukan guru (atau koordinator), tampilkan dashboard biasa
    return Inertia::render('Dashboard');
  }
}

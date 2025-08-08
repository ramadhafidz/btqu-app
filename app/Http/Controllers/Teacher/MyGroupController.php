<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\BtqGroup;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class MyGroupController extends Controller
{
  public function index()
  {
    $user = Auth::user();
    $group = BtqGroup::where('teacher_id', $user->employee?->id)
      ->with(['students.progress', 'teacher.user'])
      ->first();
    if ($group) {
      Log::info('MyGroupController index', [
        'teacher_id' => $user->employee?->id,
        'group_id' => $group->id,
        'student_names' => $group->students->pluck('nama_lengkap'),
      ]);
    } else {
      Log::warning('MyGroupController index no group found', [
        'teacher_id' => $user->employee?->id,
      ]);
    }
    return Inertia::render('Teacher/MyGroup', ['btqGroup' => $group]);
  }
}

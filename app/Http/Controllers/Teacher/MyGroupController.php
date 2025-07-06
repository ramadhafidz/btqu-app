<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\BtqGroup;
use Inertia\Inertia;

class MyGroupController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $group = BtqGroup::where('teacher_id', $user->teacher?->id)
            ->with(['students.progress', 'teacher.user', 'hafalanSurah']) // Tambahkan hafalanSurah
            ->first();
        return Inertia::render('Teacher/MyGroup', ['btqGroup' => $group]);
    }
}
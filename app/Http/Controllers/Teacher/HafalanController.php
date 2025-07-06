<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\BtqGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // 1. Tambahkan use statement ini

class HafalanController extends Controller
{
    public function update(Request $request, BtqGroup $btqGroup)
    {
        // 2. Ganti auth()->user() menjadi Auth::user()
        if (Auth::user()->teacher?->id !== $btqGroup->teacher_id) {
            abort(403, 'Anda tidak berhak mengubah grup ini.');
        }

        $validated = $request->validate([
            'hafalan_surah_id' => ['nullable', 'exists:surahs,id'],
            'hafalan_ayat' => ['nullable', 'string', 'max:255'],
        ]);

        $btqGroup->update($validated);

        return response()->json($btqGroup->load('hafalanSurah'));
    }
}

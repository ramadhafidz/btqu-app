<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use App\Models\StudentProgressLog;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function update(Request $request, StudentProgress $progress)
    {
        $data = $request->validate([
            'pages_to_add' => 'sometimes|integer|min:1',
            'hafalan_surah_id' => 'nullable|exists:surahs,id',
            'hafalan_ayat' => 'nullable|string|max:255',
        ]);

        $before = $progress->replicate();

        if (isset($data['pages_to_add'])) {
            $progress->halaman += $data['pages_to_add'];
        }
        if (array_key_exists('hafalan_surah_id', $data)) {
            $progress->hafalan_surah_id = $data['hafalan_surah_id'];
        }
        if (array_key_exists('hafalan_ayat', $data)) {
            $progress->hafalan_ayat = $data['hafalan_ayat'];
        }
        $progress->save();

        // Log perubahan halaman
        if (isset($data['pages_to_add'])) {
            StudentProgressLog::create([
                'student_progress_id' => $progress->id,
                'jilid' => $progress->jilid,
                'halaman' => $progress->halaman,
                'type' => 'halaman',
                'hafalan_surah_id' => $progress->hafalan_surah_id,
                'hafalan_ayat' => $progress->hafalan_ayat,
            ]);
        }
        // Log perubahan hafalan
        if (array_key_exists('hafalan_surah_id', $data) || array_key_exists('hafalan_ayat', $data)) {
            StudentProgressLog::create([
                'student_progress_id' => $progress->id,
                'jilid' => $progress->jilid,
                'halaman' => $progress->halaman,
                'type' => 'hafalan',
                'hafalan_surah_id' => $progress->hafalan_surah_id,
                'hafalan_ayat' => $progress->hafalan_ayat,
            ]);
        }

        return response()->json($progress->load('student'));
    }
}

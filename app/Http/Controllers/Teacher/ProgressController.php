<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function update(Request $request, StudentProgress $progress)
    {
        // Validasi: input harus angka, minimal 1
        $data = $request->validate([
            'pages_to_add' => 'required|integer|min:1'
        ]);

        // Logika: Halaman saat ini ditambah halaman baru
        $progress->halaman += $data['pages_to_add'];
        $progress->save();

        return response()->json($progress);
    }
}

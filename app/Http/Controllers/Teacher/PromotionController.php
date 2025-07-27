<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
  public function propose(StudentProgress $progress)
  {
    // Ubah status progres menjadi 'Diajukan'
    $progress->status_kenaikan = 'Diajukan';
    $progress->save();

    // [UBAH] Kembalikan ke halaman sebelumnya dengan pesan sukses
    return back()->with(
      'success',
      'Siswa berhasil diajukan untuk kenaikan jilid.',
    );
  }
}

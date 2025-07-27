<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PromotionApprovalController extends Controller
{
  /**
   * Menampilkan halaman daftar pengajuan kenaikan.
   */
  public function index()
  {
    $proposals = StudentProgress::where('status_kenaikan', 'Diajukan')
      ->with(['student.schoolClass', 'student.btqGroup.teacher.user'])
      ->latest()
      ->get();

    // dd($proposals->toArray());

    return Inertia::render('Admin/PromotionApprovals/Index', [
      'proposals' => $proposals,
    ]);
  }

  /**
   * Menyetujui pengajuan kenaikan jilid.
   */
  public function approve(Request $request, StudentProgress $progress)
  {
    DB::transaction(function () use ($progress) {
      // Naikkan jilid, reset halaman, kembalikan status ke Proses
      $progress->jilid += 1;
      $progress->halaman = 1;
      $progress->status_kenaikan = 'Proses'; // Atau bisa juga 'Lulus' jika ingin ada jejak
      $progress->save();
    });

    return to_route('admin.promotion-approvals.index')->with(
      'success',
      'Kenaikan jilid berhasil disetujui.',
    );
  }

  /**
   * Menolak pengajuan kenaikan jilid.
   */
  public function reject(Request $request, StudentProgress $progress)
  {
    // Kembalikan status ke Proses
    $progress->status_kenaikan = 'Proses';
    $progress->save();

    return to_route('admin.promotion-approvals.index')->with(
      'success',
      'Pengajuan kenaikan jilid ditolak.',
    );
  }
}

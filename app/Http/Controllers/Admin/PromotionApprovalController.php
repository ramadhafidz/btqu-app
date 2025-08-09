<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use App\Models\StudentPromotionReviewLog;
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

    return Inertia::render('Admin/PromotionApprovals', [
      'proposals' => $proposals,
    ]);
  }

  /**
   * Menyetujui pengajuan kenaikan jilid.
   */
  public function approve(Request $request, StudentProgress $progress)
  {
    $request->validate([
      'note' => ['nullable', 'string', 'max:1000'],
    ]);

    DB::transaction(function () use ($progress, $request) {
      // Naikkan jilid, reset halaman, kembalikan status ke Proses
      $progress->jilid += 1;
      $progress->halaman = 1;
      $progress->status_kenaikan = 'Proses'; // Atau bisa juga 'Lulus' jika ingin ada jejak
      $progress->save();

      StudentPromotionReviewLog::create([
        'student_progress_id' => $progress->id,
        'note' => $request->input('note'),
        'reviewed_by_user_id' => optional($request->user())->id,
        'decision' => 'approved',
        'reviewed_at' => now(),
      ]);
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
    $request->validate([
      'note' => ['nullable', 'string', 'max:1000'],
    ]);

    // Kembalikan status ke Proses dan catat review
    $progress->status_kenaikan = 'Proses';
    $progress->save();

    StudentPromotionReviewLog::create([
      'student_progress_id' => $progress->id,
      'note' => $request->input('note'),
      'reviewed_by_user_id' => optional($request->user())->id,
      'decision' => 'rejected',
      'reviewed_at' => now(),
    ]);

    return to_route('admin.promotion-approvals.index')->with(
      'success',
      'Pengajuan kenaikan jilid ditolak.',
    );
  }
}

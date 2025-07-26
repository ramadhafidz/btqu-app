<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\BtqGroup;

class ChartController extends Controller
{
    // Periode analisis data
    protected $days = 30;

    /**
     * Menyediakan data untuk dashboard guru.
     */
    public function teacherDashboard()
    {
        $user = Auth::user();
        $group = BtqGroup::where('teacher_id', $user->teacher?->id)->first();

        if (!$group) {
            return response()->json(['message' => 'Guru tidak memiliki grup'], 404);
        }

        $studentIds = $group->students()->pluck('id');
        if($studentIds->isEmpty()){
            return response()->json(['message' => 'Tidak ada siswa dalam grup'], 404);
        }

        $progressIds = DB::table('student_progress')->whereIn('student_id', $studentIds)->pluck('id');

        // Hitung total log dalam periode waktu
        $totalPages = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'halaman')->where('created_at', '>=', now()->subDays($this->days))->count();
        $totalHafalan = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'hafalan')->where('created_at', '>=', now()->subDays($this->days))->count();

        // Data untuk Line Chart (progres harian)
        $dailyProgress = DB::table('student_progress_logs')
            ->whereIn('student_progress_id', $progressIds)
            ->where('created_at', '>=', now()->subDays($this->days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw("SUM(CASE WHEN type = 'halaman' THEN 1 ELSE 0 END) as pages"),
                DB::raw("SUM(CASE WHEN type = 'hafalan' THEN 1 ELSE 0 END) as hafalan")
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'avgPagesPerDay' => round($totalPages / $this->days, 2),
            'avgHafalanPerDay' => round($totalHafalan / $this->days, 2),
            'dailyProgress' => $dailyProgress,
            'groupName' => 'Kelompok Anda',
        ]);
    }

    /**
     * Menyediakan data untuk dashboard koordinator.
     */
    public function coordinatorDashboard()
    {
        $groupsData = BtqGroup::with('teacher.user')->has('students')->get();
        $result = [];

        foreach ($groupsData as $group) {
            $studentIds = $group->students()->pluck('id');
            $progressIds = DB::table('student_progress')->whereIn('student_id', $studentIds)->pluck('id');

            if($progressIds->isEmpty()) continue;

            $totalPages = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'halaman')->where('created_at', '>=', now()->subDays($this->days))->count();
            $totalHafalan = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'hafalan')->where('created_at', '>=', now()->subDays($this->days))->count();

            $result[] = [
                'group_id' => $group->id,
                'group_name' => 'Grup ' . $group->teacher->user->name,
                'avg_pages_per_day' => round($totalPages / $this->days, 2),
                'avg_hafalan_per_day' => round($totalHafalan / $this->days, 2),
            ];
        }

        return response()->json(['progressPerGroup' => $result]);
    }

    /**
     * Menyediakan data detail grup untuk koordinator (mirip teacherDashboard).
     */
    public function groupDetailDashboard(BtqGroup $group)
    {
        // Logika ini sama persis dengan teacherDashboard, tapi untuk grup yang dipilih
        $studentIds = $group->students()->pluck('id');
        if($studentIds->isEmpty()){
            return response()->json(['message' => 'Tidak ada siswa dalam grup ini'], 404);
        }

        $progressIds = DB::table('student_progress')->whereIn('student_id', $studentIds)->pluck('id');

        $totalPages = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'halaman')->where('created_at', '>=', now()->subDays($this->days))->count();
        $totalHafalan = DB::table('student_progress_logs')->whereIn('student_progress_id', $progressIds)->where('type', 'hafalan')->where('created_at', '>=', now()->subDays($this->days))->count();

        $dailyProgress = DB::table('student_progress_logs')
            ->whereIn('student_progress_id', $progressIds)
            ->where('created_at', '>=', now()->subDays($this->days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw("SUM(CASE WHEN type = 'halaman' THEN 1 ELSE 0 END) as pages"),
                DB::raw("SUM(CASE WHEN type = 'hafalan' THEN 1 ELSE 0 END) as hafalan")
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'avgPagesPerDay' => round($totalPages / $this->days, 2),
            'avgHafalanPerDay' => round($totalHafalan / $this->days, 2),
            'dailyProgress' => $dailyProgress,
            'groupName' => 'Grup ' . $group->teacher->user->name,
        ]);
    }
}
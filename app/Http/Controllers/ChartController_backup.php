<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\BtqGroup;
use App\Models\StudentProgress;
use App\Models\Holiday;

class ChartControllerBackup extends Controller
{
  // Periode analisis data
  protected $days = 30;

  /**
   * Helper method untuk mendapatkan data hari libur
   */
  private function getHolidays()
  {
    return Holiday::pluck('tanggal')->map(function ($date) {
      return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
    });
  }

  /**
   * Menyediakan data untuk dashboard guru.
   */
  public function teacherDashboard()
  {
    $user = Auth::user();
    $group = BtqGroup::where('teacher_id', $user->employee?->id)->first();

    if (!$group) {
      return response()->json(['message' => 'Guru tidak memiliki grup'], 404);
    }

    $studentIds = $group->students()->pluck('id');
    if ($studentIds->isEmpty()) {
      return response()->json(['message' => 'Tidak ada siswa dalam grup'], 404);
    }

    $progressIds = DB::table('student_progress')
      ->whereIn('student_id', $studentIds)
      ->pluck('id');

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    $holidays = DB::table('holidays')
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [TAHAP 2.2] Buat kueri dasar yang sudah difilter untuk hari aktif
    $activeDaysQuery = DB::table('student_progress_logs')
      ->whereIn('student_progress_id', $progressIds)
      ->where('created_at', '>=', now()->subDays($this->days))
      // Filter 1: Bukan Sabtu (7) atau Minggu (1) (sesuaikan jika database Anda berbeda)
      ->whereNotIn(DB::raw('DAYOFWEEK(created_at)'), [1, 7])
      // Filter 2: Tanggalnya tidak ada di dalam daftar hari libur
      ->whereNotIn(DB::raw('DATE(created_at)'), $holidays);

    // Hitung total log dalam periode waktu HANYA PADA HARI AKTIF
    $totalPages = (clone $activeDaysQuery)->where('type', 'halaman')->count();
    // $totalHafalan = (clone $activeDaysQuery)->where('type', 'hafalan')->count(); // COMMENT DULU

    // [BARU] Hitung total hari aktif teoritis dalam periode (untuk pembagi)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $this->days,
      $holidays,
    );

    // Data untuk Line Chart (progres harian) - COMMENT HAFALAN DULU
    $dailyProgress = (clone $activeDaysQuery)
      ->select(
        DB::raw('DATE(created_at) as date'),
        DB::raw("SUM(CASE WHEN type = 'halaman' THEN 1 ELSE 0 END) as pages"),
        // DB::raw("SUM(CASE WHEN type = 'hafalan' THEN 1 ELSE 0 END) as hafalan"), // COMMENT DULU
      )
      ->groupBy('date')
      ->orderBy('date', 'asc')
      ->get();

    return response()->json([
      // Gunakan pembagi hari aktif teoritis
      'avgPagesPerDay' =>
        $theoreticalActiveDays > 0
          ? round($totalPages / $theoreticalActiveDays, 2)
          : 0,
      // 'avgHafalanPerDay' =>
      //   $theoreticalActiveDays > 0 ? round($totalHafalan / $theoreticalActiveDays, 2) : 0, // COMMENT DULU
      'dailyProgress' => $dailyProgress,
      'groupName' => 'Kelompok Anda',
      // [BARU] Data hari aktif untuk tampilan frontend
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays, // Hari aktif sebagai pembagi
        'period' => $this->days, // Total hari dalam periode
        'weekends' => $this->countWeekendsInPeriod($this->days), // Total weekend dalam periode
        'holidays' => $this->countHolidaysInPeriod($this->days, $holidays), // Total hari libur dalam periode
        'totalPages' => $totalPages, // Total aktivitas halaman
        // 'totalHafalan' => $totalHafalan, // COMMENT DULU
      ],
    ]);
  }

  /**
   * Menyediakan data untuk dashboard koordinator.
   */
  public function coordinatorDashboard()
  {
    // [UBAH] Gunakan withCount untuk efisiensi
    $groupsData = BtqGroup::with('teacher.user')
      ->withCount('students')
      ->has('students')
      ->get();

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    $holidays = DB::table('holidays')
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [BARU] Hitung total hari aktif teoritis dalam periode (global untuk semua grup)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $this->days,
      $holidays,
    );

    $result = [];

    foreach ($groupsData as $group) {
      $studentIds = $group->students()->pluck('id'); // Ini masih dibutuhkan untuk logs
      $progressIds = DB::table('student_progress')
        ->whereIn('student_id', $studentIds)
        ->pluck('id');

      if ($progressIds->isEmpty()) {
        continue;
      }

      // [TAHAP 2.2] Buat kueri dasar yang sudah difilter untuk hari aktif
      $activeDaysQuery = DB::table('student_progress_logs')
        ->whereIn('student_progress_id', $progressIds)
        ->where('created_at', '>=', now()->subDays($this->days))
        // Filter 1: Bukan Sabtu (7) atau Minggu (1)
        ->whereNotIn(DB::raw('DAYOFWEEK(created_at)'), [1, 7])
        // Filter 2: Tanggalnya tidak ada di dalam daftar hari libur
        ->whereNotIn(DB::raw('DATE(created_at)'), $holidays);

      // Hitung total log dalam periode waktu HANYA PADA HARI AKTIF
      $totalPages = (clone $activeDaysQuery)->where('type', 'halaman')->count();
      // $totalHafalan = (clone $activeDaysQuery)
      //   ->where('type', 'hafalan')
      //   ->count(); // COMMENT DULU

      $groupName = $group->teacher
        ? 'Grup ' . $group->teacher->user->name
        : "Grup Level {$group->level} (Tanpa Guru)";

      $result[] = [
        'group_id' => $group->id,
        'group_name' => $groupName,
        'avg_pages_per_day' =>
          $theoreticalActiveDays > 0
            ? round($totalPages / $theoreticalActiveDays, 2)
            : 0,
        // 'avg_hafalan_per_day' =>
        //   $theoreticalActiveDays > 0
        //     ? round($totalHafalan / $theoreticalActiveDays, 2)
        //     : 0, // COMMENT DULU
        'total_pages' => $totalPages, // BARU: Total aktivitas
        // 'total_hafalan' => $totalHafalan, // COMMENT DULU
      ];
    }

    // [BARU] Siapkan data statistik untuk KPI cards
    $statistics = [
      'total_groups' => $groupsData->count(),
      'total_students' => $groupsData->sum('students_count'),
      'active_teachers' => $groupsData
        ->whereNotNull('teacher_id')
        ->pluck('teacher_id')
        ->unique()
        ->count(),
    ];

    return response()->json([
      'progressPerGroup' => $result,
      'statistics' => $statistics, // <-- Kirim data baru
      // [BARU] Data hari aktif untuk tampilan frontend
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays, // Hari aktif sebagai pembagi
        'period' => $this->days, // Total hari dalam periode
        'weekends' => $this->countWeekendsInPeriod($this->days), // Total weekend dalam periode
        'holidays' => $this->countHolidaysInPeriod($this->days, $holidays), // Total hari libur dalam periode
      ],
    ]);
  }

  /**
   * Menyediakan data detail grup untuk koordinator (mirip teacherDashboard).
   */
  public function groupDetailDashboard(BtqGroup $group)
  {
    // Logika ini sama persis dengan teacherDashboard, tapi untuk grup yang dipilih
    $studentIds = $group->students()->pluck('id');
    if ($studentIds->isEmpty()) {
      return response()->json(
        ['message' => 'Tidak ada siswa dalam grup ini'],
        404,
      );
    }

    $progressIds = DB::table('student_progress')
      ->whereIn('student_id', $studentIds)
      ->pluck('id');

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    $holidays = DB::table('holidays')
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [TAHAP 2.2] Buat kueri dasar yang sudah difilter untuk hari aktif
    $activeDaysQuery = DB::table('student_progress_logs')
      ->whereIn('student_progress_id', $progressIds)
      ->where('created_at', '>=', now()->subDays($this->days))
      // Filter 1: Bukan Sabtu (7) atau Minggu (1)
      ->whereNotIn(DB::raw('DAYOFWEEK(created_at)'), [1, 7])
      // Filter 2: Tanggalnya tidak ada di dalam daftar hari libur
      ->whereNotIn(DB::raw('DATE(created_at)'), $holidays);

    // Hitung total log dalam periode waktu HANYA PADA HARI AKTIF
    $totalPages = (clone $activeDaysQuery)->where('type', 'halaman')->count();
    // $totalHafalan = (clone $activeDaysQuery)->where('type', 'hafalan')->count(); // COMMENT DULU

    // Hitung jumlah hari aktif yang sebenarnya dalam rentang waktu untuk pembagi rata-rata
    $actualActiveDays = (clone $activeDaysQuery)
      ->select(DB::raw('COUNT(DISTINCT DATE(created_at)) as total'))
      ->value('total');

    // Data untuk Line Chart (progres harian) - hanya hari aktif, COMMENT HAFALAN DULU
    $dailyProgress = (clone $activeDaysQuery)
      ->select(
        DB::raw('DATE(created_at) as date'),
        DB::raw("SUM(CASE WHEN type = 'halaman' THEN 1 ELSE 0 END) as pages"),
        // DB::raw("SUM(CASE WHEN type = 'hafalan' THEN 1 ELSE 0 END) as hafalan"), // COMMENT DULU
      )
      ->groupBy('date')
      ->orderBy('date', 'asc')
      ->get();

    // [BARU] Hitung total hari aktif teoritis dalam periode (untuk informasi)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $this->days,
      $holidays,
    );

    return response()->json([
      'avgPagesPerDay' =>
        $theoreticalActiveDays > 0
          ? round($totalPages / $theoreticalActiveDays, 2)
          : 0,
      // 'avgHafalanPerDay' =>
      //   $theoreticalActiveDays > 0 ? round($totalHafalan / $theoreticalActiveDays, 2) : 0, // COMMENT DULU
      'dailyProgress' => $dailyProgress,
      'groupName' => 'Grup ' . $group->teacher->user->name,
      // [BARU] Data hari aktif untuk tampilan frontend
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays, // Hari aktif sebagai pembagi
        'period' => $this->days, // Total hari dalam periode
        'weekends' => $this->countWeekendsInPeriod($this->days), // Total weekend dalam periode
        'holidays' => $this->countHolidaysInPeriod($this->days, $holidays), // Total hari libur dalam periode
        'totalPages' => $totalPages, // Total aktivitas halaman
        // 'totalHafalan' => $totalHafalan, // COMMENT DULU
      ],
    ]);
  }

  public function studentDistributionByJilid(Request $request)
  {
    $distribution = StudentProgress::query()
      ->select('jilid', DB::raw('COUNT(*) as student_count'))
      // Gabungkan dengan tabel siswa dan kelas untuk filtering
      ->join('students', 'student_progress.student_id', '=', 'students.id')
      ->join(
        'school_classes',
        'students.school_class_id',
        '=',
        'school_classes.id',
      )
      // Terapkan filter HANYA jika ada input 'level'
      ->when($request->input('level'), function ($query, $level) {
        return $query->where('school_classes.level', $level);
      })
      ->groupBy('jilid')
      ->orderBy('jilid', 'asc')
      ->get();

    return response()->json($distribution);
  }

  /**
   * Menghitung total hari aktif teoritis dalam periode (hari kerja - hari libur)
   */
  private function calculateTheoreticalActiveDays($days, $holidays)
  {
    $totalDays = $days;
    $weekends = $this->countWeekendsInPeriod($days);
    $holidaysInPeriod = $this->countHolidaysInPeriod($days, $holidays);

    return $totalDays - $weekends - $holidaysInPeriod;
  }

  /**
   * Menghitung jumlah weekend (Sabtu & Minggu) dalam periode tertentu
   */
  private function countWeekendsInPeriod($days)
  {
    $weekends = 0;
    $startDate = now()->subDays($days);

    for ($i = 0; $i < $days; $i++) {
      $date = $startDate->copy()->addDays($i);
      $dayOfWeek = $date->dayOfWeek; // 0=Minggu, 6=Sabtu
      if ($dayOfWeek == 0 || $dayOfWeek == 6) {
        // Minggu atau Sabtu
        $weekends++;
      }
    }

    return $weekends;
  }

  /**
   * Menghitung jumlah hari libur dalam periode tertentu
   */
  private function countHolidaysInPeriod($days, $holidays)
  {
    $startDate = now()->subDays($days)->format('Y-m-d');
    $endDate = now()->format('Y-m-d');

    return $holidays
      ->filter(function ($holiday) use ($startDate, $endDate) {
        return $holiday >= $startDate && $holiday <= $endDate;
      })
      ->count();
  }
}

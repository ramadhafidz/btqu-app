<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\BtqGroup;
use App\Models\StudentProgress;
use App\Models\Holiday;

class ChartController extends Controller
{
  // Default fallback days (used only when range not provided)
  protected $defaultDays = 30;

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
  public function teacherDashboard(Request $request)
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

    // Resolve date range based on requested filter
    [$startDate, $endDate, $rangeMeta] = $this->resolveDateRange($request);

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    $holidays = DB::table('holidays')
      ->whereBetween('tanggal', [
        $startDate->format('Y-m-d'),
        $endDate->format('Y-m-d'),
      ])
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [TAHAP 2.2] Buat kueri dasar yang sudah difilter untuk hari aktif
    $activeDaysQuery = DB::table('student_progress_logs')
      ->whereIn('student_progress_id', $progressIds)
      ->whereBetween('created_at', [
        $startDate->copy()->startOfDay(),
        $endDate->copy()->endOfDay(),
      ])
      // Filter 1: Bukan Sabtu (7) atau Minggu (1) (sesuaikan jika database Anda berbeda)
      ->whereNotIn(DB::raw('DAYOFWEEK(created_at)'), [1, 7])
      // Filter 2: Tanggalnya tidak ada di dalam daftar hari libur
      ->whereNotIn(DB::raw('DATE(created_at)'), $holidays);

    // Hitung total log dalam periode waktu HANYA PADA HARI AKTIF
    $totalPages = (clone $activeDaysQuery)->where('type', 'halaman')->count();
    // $totalHafalan = (clone $activeDaysQuery)->where('type', 'hafalan')->count(); // COMMENT DULU

    // [BARU] Hitung total hari aktif teoritis dalam periode (untuk pembagi)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $startDate,
      $endDate,
      $holidays,
    );

    // Data untuk Line Chart (progres harian) - COMMENT HAFALAN DULU
    $dailyProgress = (clone $activeDaysQuery)
      ->select(
        DB::raw('DATE(created_at) as date'),
        DB::raw("SUM(CASE WHEN type = 'halaman' THEN 1 ELSE 0 END) as pages"),
      )
      ->groupBy('date')
      ->orderBy('date', 'asc')
      ->get();

    // [BARU] Rincian per siswa (menggunakan hari aktif teoritis sebagai pembagi agar konsisten)
    $logsPerStudent = DB::table('student_progress_logs')
      ->join(
        'student_progress',
        'student_progress_logs.student_progress_id',
        '=',
        'student_progress.id',
      )
      ->whereIn('student_progress.student_id', $studentIds)
      ->whereBetween('student_progress_logs.created_at', [
        $startDate->copy()->startOfDay(),
        $endDate->copy()->endOfDay(),
      ])
      ->whereNotIn(DB::raw('DAYOFWEEK(student_progress_logs.created_at)'), [
        1,
        7,
      ])
      ->whereNotIn(DB::raw('DATE(student_progress_logs.created_at)'), $holidays)
      ->select(
        'student_progress.student_id',
        DB::raw(
          "SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages",
        ),
        // DB::raw("SUM(CASE WHEN student_progress_logs.type = 'hafalan' THEN 1 ELSE 0 END) as hafalan") // COMMENT DULU
      )
      ->groupBy('student_progress.student_id')
      ->pluck('pages', 'student_progress.student_id');

    $studentsMeta = DB::table('students')
      ->whereIn('id', $studentIds)
      ->select('id', 'nama_lengkap')
      ->orderBy('nama_lengkap')
      ->get();

    $progressPerStudent = $studentsMeta->map(function ($s) use (
      $logsPerStudent,
      $theoreticalActiveDays,
    ) {
      $pages = (int) ($logsPerStudent[$s->id] ?? 0);
      return [
        'student_id' => $s->id,
        'nama_lengkap' => $s->nama_lengkap,
        'avg_pages_per_day' =>
          $theoreticalActiveDays > 0
            ? round($pages / $theoreticalActiveDays, 2)
            : 0,
        'avg_hafalan_per_day' => 0, // COMMENT DULU
      ];
    });

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
      'groupId' => $group->id,
      'students' => $studentsMeta->pluck('nama_lengkap'),
      'progressPerStudent' => $progressPerStudent,
      // [BARU] Data hari aktif untuk tampilan frontend - dengan perhitungan yang benar
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays,
        'period' => $rangeMeta['periodDays'],
        'startDate' => $startDate->toDateString(),
        'endDate' => $endDate->toDateString(),
        'rangeLabel' => $rangeMeta['label'],
        'weekends' => $this->countWeekendsInPeriod($startDate, $endDate),
        'holidays' => $this->countHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
        'workdayHolidays' => $this->countWorkdayHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
        'totalPages' => $totalPages,
      ],
    ]);
  }

  /**
   * Menyediakan data untuk dashboard koordinator.
   */
  public function coordinatorDashboard(Request $request)
  {
    // [UBAH] Gunakan withCount untuk efisiensi
    $groupsData = BtqGroup::with('teacher.user')
      ->withCount('students')
      ->has('students')
      ->get();

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    [$startDate, $endDate, $rangeMeta] = $this->resolveDateRange($request);

    $holidays = DB::table('holidays')
      ->whereBetween('tanggal', [
        $startDate->format('Y-m-d'),
        $endDate->format('Y-m-d'),
      ])
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [BARU] Hitung total hari aktif teoritis dalam periode (global untuk semua grup)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $startDate,
      $endDate,
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
        ->whereBetween('created_at', [
          $startDate->copy()->startOfDay(),
          $endDate->copy()->endOfDay(),
        ])
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
      // [BARU] Data hari aktif untuk tampilan frontend - dengan perhitungan yang benar
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays,
        'period' => $rangeMeta['periodDays'],
        'startDate' => $startDate->toDateString(),
        'endDate' => $endDate->toDateString(),
        'rangeLabel' => $rangeMeta['label'],
        'weekends' => $this->countWeekendsInPeriod($startDate, $endDate),
        'holidays' => $this->countHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
        'workdayHolidays' => $this->countWorkdayHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
      ],
    ]);
  }

  /**
   * Menyediakan data detail grup untuk koordinator (mirip teacherDashboard).
   */
  public function groupDetailDashboard(Request $request, BtqGroup $group)
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

    [$startDate, $endDate, $rangeMeta] = $this->resolveDateRange($request);

    // [TAHAP 2.1] Ambil semua tanggal libur dari tabel holidays
    $holidays = DB::table('holidays')
      ->whereBetween('tanggal', [
        $startDate->format('Y-m-d'),
        $endDate->format('Y-m-d'),
      ])
      ->pluck('tanggal')
      ->map(function ($date) {
        return $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
      });

    // [TAHAP 2.2] Buat kueri dasar yang sudah difilter untuk hari aktif
    $activeDaysQuery = DB::table('student_progress_logs')
      ->whereIn('student_progress_id', $progressIds)
      ->whereBetween('created_at', [
        $startDate->copy()->startOfDay(),
        $endDate->copy()->endOfDay(),
      ])
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
      )
      ->groupBy('date')
      ->orderBy('date', 'asc')
      ->get();

    // [BARU] Hitung total hari aktif teoritis dalam periode (untuk informasi)
    $theoreticalActiveDays = $this->calculateTheoreticalActiveDays(
      $startDate,
      $endDate,
      $holidays,
    );

    // [BARU] Rincian per siswa (mirip endpoint guru)
    $logsPerStudent = DB::table('student_progress_logs')
      ->join(
        'student_progress',
        'student_progress_logs.student_progress_id',
        '=',
        'student_progress.id',
      )
      ->whereIn('student_progress.student_id', $studentIds)
      ->whereBetween('student_progress_logs.created_at', [
        $startDate->copy()->startOfDay(),
        $endDate->copy()->endOfDay(),
      ])
      ->whereNotIn(DB::raw('DAYOFWEEK(student_progress_logs.created_at)'), [
        1,
        7,
      ])
      ->whereNotIn(DB::raw('DATE(student_progress_logs.created_at)'), $holidays)
      ->select(
        'student_progress.student_id',
        DB::raw(
          "SUM(CASE WHEN student_progress_logs.type = 'halaman' THEN 1 ELSE 0 END) as pages",
        ),
      )
      ->groupBy('student_progress.student_id')
      ->pluck('pages', 'student_progress.student_id');

    $studentsMeta = DB::table('students')
      ->whereIn('id', $studentIds)
      ->select('id', 'nama_lengkap')
      ->orderBy('nama_lengkap')
      ->get();

    $progressPerStudent = $studentsMeta->map(function ($s) use (
      $logsPerStudent,
      $theoreticalActiveDays,
    ) {
      $pages = (int) ($logsPerStudent[$s->id] ?? 0);
      return [
        'student_id' => $s->id,
        'nama_lengkap' => $s->nama_lengkap,
        'avg_pages_per_day' =>
          $theoreticalActiveDays > 0
            ? round($pages / $theoreticalActiveDays, 2)
            : 0,
        'avg_hafalan_per_day' => 0, // COMMENT DULU
      ];
    });

    return response()->json([
      'avgPagesPerDay' =>
        $theoreticalActiveDays > 0
          ? round($totalPages / $theoreticalActiveDays, 2)
          : 0,
      // 'avgHafalanPerDay' =>
      //   $theoreticalActiveDays > 0 ? round($totalHafalan / $theoreticalActiveDays, 2) : 0, // COMMENT DULU
      'dailyProgress' => $dailyProgress,
      'groupName' => 'Grup ' . $group->teacher->user->name,
      'groupId' => $group->id,
      'students' => $studentsMeta->pluck('nama_lengkap'),
      'progressPerStudent' => $progressPerStudent,
      // [BARU] Data hari aktif untuk tampilan frontend - dengan perhitungan yang benar
      'activeDaysInfo' => [
        'activeDays' => $theoreticalActiveDays,
        'period' => $rangeMeta['periodDays'],
        'startDate' => $startDate->toDateString(),
        'endDate' => $endDate->toDateString(),
        'rangeLabel' => $rangeMeta['label'],
        'weekends' => $this->countWeekendsInPeriod($startDate, $endDate),
        'holidays' => $this->countHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
        'workdayHolidays' => $this->countWorkdayHolidaysInPeriod(
          $startDate,
          $endDate,
          $holidays,
        ),
        'totalPages' => $totalPages,
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
   * Dengan logika yang benar: hari libur yang jatuh di weekend tidak dihitung ganda
   */
  private function calculateTheoreticalActiveDays(
    $startDate,
    $endDate,
    $holidays,
  ) {
    $activeDays = 0;
    $cursor = $startDate->copy();
    while ($cursor->lte($endDate)) {
      $dayOfWeek = $cursor->dayOfWeek; // 0=Minggu, 6=Sabtu
      $dateString = $cursor->format('Y-m-d');
      $isWeekend = $dayOfWeek == 0 || $dayOfWeek == 6;
      $isHoliday = $holidays->contains($dateString);
      if (!$isWeekend && !$isHoliday) {
        $activeDays++;
      }
      $cursor->addDay();
    }
    return $activeDays;
  }

  /**
   * Menghitung jumlah weekend (Sabtu & Minggu) dalam periode tertentu
   */
  private function countWeekendsInPeriod($startDate, $endDate)
  {
    $weekends = 0;
    $cursor = $startDate->copy();
    while ($cursor->lte($endDate)) {
      $dayOfWeek = $cursor->dayOfWeek;
      if ($dayOfWeek == 0 || $dayOfWeek == 6) {
        $weekends++;
      }
      $cursor->addDay();
    }
    return $weekends;
  }

  /**
   * Menghitung jumlah hari libur dalam periode tertentu
   * (termasuk yang jatuh di weekend)
   */
  private function countHolidaysInPeriod($startDate, $endDate, $holidays)
  {
    $start = $startDate->format('Y-m-d');
    $end = $endDate->format('Y-m-d');
    return $holidays
      ->filter(function ($holiday) use ($start, $end) {
        return $holiday >= $start && $holiday <= $end;
      })
      ->count();
  }

  /**
   * Menghitung jumlah hari libur yang jatuh di hari kerja (bukan weekend)
   */
  private function countWorkdayHolidaysInPeriod($startDate, $endDate, $holidays)
  {
    $workdayHolidays = 0;
    $cursor = $startDate->copy();
    while ($cursor->lte($endDate)) {
      $dayOfWeek = $cursor->dayOfWeek; // 0=Minggu, 6=Sabtu
      $dateString = $cursor->format('Y-m-d');
      $isWeekend = $dayOfWeek == 0 || $dayOfWeek == 6;
      $isHoliday = $holidays->contains($dateString);
      if ($isHoliday && !$isWeekend) {
        $workdayHolidays++;
      }
      $cursor->addDay();
    }
    return $workdayHolidays;
  }

  /**
   * Resolve date range from request.
   * Supported params:
   * range: last7 | last30 | month | year
   * month: 1-12 (required if range=month)
   * year: YYYY (required if range=month|year)
   */
  private function resolveDateRange(Request $request)
  {
    $range = $request->query('range', 'last30');
    $today = now();
    $label = '';
    switch ($range) {
      case 'last7':
        $start = $today->copy()->subDays(6)->startOfDay();
        $end = $today->copy()->endOfDay();
        $label = '7 Hari Terakhir';
        break;
      case 'last30':
        $start = $today->copy()->subDays(29)->startOfDay();
        $end = $today->copy()->endOfDay();
        $label = '30 Hari Terakhir';
        break;
      case 'month':
        $month = (int) $request->query('month', $today->month);
        $year = (int) $request->query('year', $today->year);
        $start = now()->setDate($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();
        $label = 'Bulan ' . $start->translatedFormat('F Y');
        break;
      case 'year':
        $year = (int) $request->query('year', $today->year);
        $start = now()->setDate($year, 1, 1)->startOfDay();
        $end = $start->copy()->endOfYear();
        $label = 'Tahun ' . $year;
        break;
      default:
        $start = $today->copy()->subDays(29)->startOfDay();
        $end = $today->copy()->endOfDay();
        $label = '30 Hari Terakhir';
    }
    // Pastikan perhitungan hari selalu integer (hindari floating precision)
    $periodDays =
      (int) ($start
        ->copy()
        ->startOfDay()
        ->diffInDays($end->copy()->startOfDay()) + 1);
    return [
      $start,
      $end,
      ['label' => $label, 'periodDays' => (int) $periodDays],
    ];
  }
}

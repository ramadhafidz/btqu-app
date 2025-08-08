<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class HolidayController extends Controller
{
  public function index(Request $request)
  {
    $year = $request->input('year', now()->year);
    $status = $request->input('status'); // 'past' | 'upcoming' | null

    $holidays = Holiday::query()
      ->when($request->input('search'), function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('keterangan', 'like', "%{$search}%")->orWhere(
            'tanggal',
            'like',
            "%{$search}%",
          );
        });
      })
      ->inYear($year)
      ->when($status === 'past', function ($q) use ($status) {
        $q->where('tanggal', '<', now()->toDateString());
      })
      ->when($status === 'upcoming', function ($q) use ($status) {
        $q->where('tanggal', '>=', now()->toDateString());
      })
      ->orderBy('tanggal', 'asc')
      ->paginate(10)
      ->withQueryString();

    // Get all holidays for calendar view (not paginated)
    $allHolidaysForYear = Holiday::query()
      ->inYear($year)
      ->orderBy('tanggal', 'asc')
      ->get();

    return Inertia::render('Admin/Holidays', [
      'holidays' => $holidays,
      'allHolidays' => $allHolidaysForYear,
      'filters' => $request->only(['search', 'year', 'status']),
      'currentYear' => now()->year,
      'statistics' => [
        'total' => Holiday::inYear($year)->count(),
        'upcoming' => Holiday::where('tanggal', '>=', now()->toDateString())
          ->inYear($year)
          ->count(),
        'past' => Holiday::where('tanggal', '<', now()->toDateString())
          ->when(
            $request->input('year'),
            function ($query, $year) {
              $query->inYear($year);
            },
            function ($query) {
              $query->inYear(now()->year);
            },
          )
          ->count(),
      ],
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate(
      [
        'tanggal' => 'required|date|unique:holidays,tanggal',
        'keterangan' => 'required|string|max:255',
      ],
      [
        'tanggal.required' => 'Tanggal wajib diisi',
        'tanggal.date' => 'Format tanggal tidak valid',
        'tanggal.unique' => 'Tanggal libur sudah ada',
        'keterangan.required' => 'Keterangan wajib diisi',
        'keterangan.max' => 'Keterangan maksimal 255 karakter',
      ],
    );

    Holiday::create($validated);

    return redirect()
      ->back()
      ->with('success', 'Hari libur berhasil ditambahkan');
  }

  public function update(Request $request, Holiday $holiday)
  {
    $validated = $request->validate(
      [
        'tanggal' => 'required|date|unique:holidays,tanggal,' . $holiday->id,
        'keterangan' => 'required|string|max:255',
      ],
      [
        'tanggal.required' => 'Tanggal wajib diisi',
        'tanggal.date' => 'Format tanggal tidak valid',
        'tanggal.unique' => 'Tanggal libur sudah ada',
        'keterangan.required' => 'Keterangan wajib diisi',
        'keterangan.max' => 'Keterangan maksimal 255 karakter',
      ],
    );

    $holiday->update($validated);

    return redirect()
      ->back()
      ->with('success', 'Hari libur berhasil diperbarui');
  }

  public function destroy(Holiday $holiday)
  {
    $holiday->delete();

    return redirect()->back()->with('success', 'Hari libur berhasil dihapus');
  }

  /**
   * Import holidays from API or predefined list
   */
  public function importNationalHolidays(Request $request)
  {
    $year = $request->input('year', now()->year);

    // Data hari libur nasional Indonesia dari API dayoffapi.vercel.app
    $nationalHolidays = $this->getNationalHolidays($year);

    $imported = 0;
    $skipped = 0;
    $apiSuccess = false;

    // Cek apakah data berhasil diambil dari API
    try {
      $response = Http::timeout(10)->get('https://dayoffapi.vercel.app/api', [
        'year' => $year,
      ]);
      $apiSuccess = $response->successful();
    } catch (\Exception $e) {
      $apiSuccess = false;
    }

    foreach ($nationalHolidays as $holidayData) {
      $exists = Holiday::where('tanggal', $holidayData['tanggal'])->exists();

      if (!$exists) {
        Holiday::create($holidayData);
        $imported++;
      } else {
        $skipped++;
      }
    }

    $source = $apiSuccess ? 'API dayoffapi.vercel.app' : 'data fallback';
    $message = "Berhasil mengimpor {$imported} hari libur nasional dari {$source}.";
    if ($skipped > 0) {
      $message .= " {$skipped} hari libur dilewati karena sudah ada.";
    }

    return redirect()->back()->with('success', $message);
  }

  /**
   * Get national holidays for a specific year
   * Data diambil dari API dayoffapi.vercel.app
   */
  private function getNationalHolidays($year)
  {
    try {
      // Ambil data dari API dayoffapi.vercel.app
      $response = Http::timeout(10)->get('https://dayoffapi.vercel.app/api', [
        'year' => $year,
      ]);

      if ($response->successful()) {
        $apiData = $response->json();

        // Transform data dari API ke format yang sesuai dengan database
        $holidays = collect($apiData)
          ->map(function ($item) {
            return [
              'tanggal' => Carbon::parse($item['tanggal'])->format('Y-m-d'),
              'keterangan' =>
                $item['keterangan'] .
                ($item['is_cuti'] ? ' (Cuti Bersama)' : ' (Libur Nasional)'),
            ];
          })
          ->toArray();

        return $holidays;
      }
    } catch (\Exception $e) {
      // Log error untuk debugging
      Log::warning('Failed to fetch holidays from API', [
        'error' => $e->getMessage(),
        'year' => $year,
      ]);
    }

    // Fallback ke data hardcoded jika API gagal
    return $this->getFallbackHolidays($year);
  }

  /**
   * Fallback data if API fails
   */
  private function getFallbackHolidays($year)
  {
    // Data hari libur nasional Indonesia sebagai fallback
    $holidays = [
      [
        'tanggal' => "{$year}-01-01",
        'keterangan' => 'Tahun Baru Masehi (Libur Nasional)',
      ],
      [
        'tanggal' => "{$year}-08-17",
        'keterangan' => 'Hari Kemerdekaan Republik Indonesia (Libur Nasional)',
      ],
      [
        'tanggal' => "{$year}-12-25",
        'keterangan' => 'Hari Raya Natal (Libur Nasional)',
      ],
    ];

    // Untuk tahun 2025, tambahkan hari libur khusus
    if ($year == 2025) {
      $holidays = array_merge($holidays, [
        [
          'tanggal' => '2025-01-29',
          'keterangan' => 'Tahun Baru Imlek 2576 Kongzili (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-03-29',
          'keterangan' =>
            'Hari Raya Nyepi Tahun Baru Saka 1947 (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-03-31',
          'keterangan' => 'Hari Raya Idul Fitri 1446H (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-04-01',
          'keterangan' => 'Hari Raya Idul Fitri 1446H (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-04-18',
          'keterangan' => 'Wafat Yesus Kristus (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-05-01',
          'keterangan' => 'Hari Buruh Internasional (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-05-12',
          'keterangan' => 'Hari Raya Waisak 2569 BE (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-05-29',
          'keterangan' => 'Kenaikan Yesus Kristus (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-06-01',
          'keterangan' => 'Hari Lahir Pancasila (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-06-06',
          'keterangan' => 'Hari Raya Idul Adha 1446H (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-06-27',
          'keterangan' => 'Tahun Baru Islam 1 Muharram 1447H (Libur Nasional)',
        ],
        [
          'tanggal' => '2025-09-05',
          'keterangan' => 'Maulid Nabi Muhammad SAW (Libur Nasional)',
        ],
      ]);
    }

    return $holidays;
  }
}

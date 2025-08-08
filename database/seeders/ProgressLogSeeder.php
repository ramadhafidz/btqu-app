<?php

namespace Database\Seeders;

use App\Models\StudentProgress;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProgressLogSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    DB::table('student_progress_logs')->truncate();

    $allProgress = StudentProgress::all();
    $logsToInsert = [];
    $surahIds = DB::table('surahs')->pluck('id');

    if ($surahIds->isEmpty()) {
      $this->command->info(
        'No surahs found in database. Skipping ProgressLogSeeder.',
      );
      return;
    }

    foreach ($allProgress as $progress) {
      // Loop sebanyak 45 hari ke belakang untuk memastikan kita mendapat ~30 hari kerja
      for ($i = 0; $i < 45; $i++) {
        $logDate = Carbon::now()->subDays($i);

        // [UBAH] Hanya jalankan logika jika tanggal BUKAN hari Sabtu atau Minggu
        if (!$logDate->isWeekend()) {
          // Peluang 70% untuk membuat log pada hari aktif
          if (rand(1, 100) > 30) {
            $pageLogsCount = rand(1, 3);
            for ($j = 0; $j < $pageLogsCount; $j++) {
              $logsToInsert[] = [
                'student_progress_id' => $progress->id,
                'jilid' => $progress->jilid,
                'halaman' => $progress->halaman,
                'hafalan_surah_id' => $progress->hafalan_surah_id,
                'hafalan_ayat' => $progress->hafalan_ayat,
                'type' => 'halaman',
                'created_at' => $logDate,
                'updated_at' => $logDate,
              ];
            }

            // Peluang 15% untuk membuat log hafalan
            if (rand(1, 100) <= 15) {
              $logsToInsert[] = [
                'student_progress_id' => $progress->id,
                'jilid' => $progress->jilid,
                'halaman' => $progress->halaman,
                'hafalan_surah_id' =>
                  $progress->hafalan_surah_id ?? $surahIds->random(),
                'hafalan_ayat' => $progress->hafalan_ayat ?? '1-' . rand(5, 20),
                'type' => 'hafalan',
                'created_at' => $logDate,
                'updated_at' => $logDate,
              ];
            }
          }
        }
      }
    }

    foreach (array_chunk($logsToInsert, 500) as $chunk) {
      DB::table('student_progress_logs')->insert($chunk);
    }

    $this->command->info('Dummy progress logs have been created successfully!');
  }
}

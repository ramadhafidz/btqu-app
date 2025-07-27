<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\StudentProgress;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

    // [UBAH] Ambil semua ID surah yang valid dari database terlebih dahulu
    $surahIds = DB::table('surahs')->pluck('id');

    // Jika tidak ada surah sama sekali, hentikan seeder agar tidak error.
    if ($surahIds->isEmpty()) {
      $this->command->info(
        'No surahs found in database. Skipping ProgressLogSeeder.',
      );
      return;
    }

    foreach ($allProgress as $progress) {
      for ($i = 0; $i < 30; $i++) {
        if (rand(1, 100) > 30) {
          $logDate = Carbon::now()->subDays($i);

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

          if (rand(1, 100) <= 15) {
            $logsToInsert[] = [
              'student_progress_id' => $progress->id,
              'jilid' => $progress->jilid,
              'halaman' => $progress->halaman,
              // [UBAH] Gunakan ID surah acak yang valid dari data yang ada
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

    foreach (array_chunk($logsToInsert, 500) as $chunk) {
      DB::table('student_progress_logs')->insert($chunk);
    }

    $this->command->info('Dummy progress logs have been created successfully!');
  }
}

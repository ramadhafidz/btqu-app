<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HolidaySeeder extends Seeder
{
  public function run(): void
  {
    DB::table('holidays')->insert([
      ['tanggal' => '2025-08-17', 'keterangan' => 'Hari Kemerdekaan RI'],
      ['tanggal' => '2025-12-25', 'keterangan' => 'Hari Raya Natal'],
      // Tambahkan tanggal libur lainnya di sini
    ]);
  }
}
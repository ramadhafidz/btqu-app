<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Juz;
use App\Models\Surah;
use Illuminate\Support\Facades\DB;

class QuranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('juz_surah')->truncate();
        Juz::truncate();
        Surah::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $juzs = [];
        for ($i = 1; $i <= 30; $i++) {
            $juzs[] = ['id' => $i, 'juz_number' => $i];
        }
        DB::table('juzs')->insert($juzs);

        $surahs = [
            ['id' => 1, 'surah_number' => 1, 'name_latin' => 'Al-Fatihah', 'name_arabic' => 'ٱلْفَاتِحَة', 'number_of_ayahs' => 7],
            ['id' => 2, 'surah_number' => 2, 'name_latin' => 'Al-Baqarah', 'name_arabic' => 'ٱلْبَقَرَة', 'number_of_ayahs' => 286],
            // ... dan seterusnya
        ];
        DB::table('surahs')->insert($surahs);

        $juzSurah = [
            ['juz_id' => 1, 'surah_id' => 1, 'start_ayah' => 1],
            ['juz_id' => 1, 'surah_id' => 2, 'start_ayah' => 1],
            ['juz_id' => 2, 'surah_id' => 2, 'start_ayah' => 142],
            ['juz_id' => 3, 'surah_id' => 2, 'start_ayah' => 253],
            // ... dan seterusnya
        ];
        DB::table('juz_surah')->insert($juzSurah);
    }
}

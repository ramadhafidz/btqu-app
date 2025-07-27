<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentProgress;

class StudentSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Data kelas
    $classes = [
      ['level' => 1, 'nama_kelas' => 'Al-Khwarizmi'],
      ['level' => 1, 'nama_kelas' => 'Ibnu Sina'],
      ['level' => 2, 'nama_kelas' => 'Al-Farabi'],
      ['level' => 2, 'nama_kelas' => 'Ibnu Al-Haytham'],
      ['level' => 3, 'nama_kelas' => 'Ibnu Hayyan'],
      ['level' => 3, 'nama_kelas' => 'Ibnu Khaldun'],
    ];

    // Insert kelas dan simpan id-nya
    $classIds = [];
    foreach ($classes as $class) {
      $schoolClass = SchoolClass::firstOrCreate($class);
      $classIds[] = [
        'id' => $schoolClass->id,
        'level' => $schoolClass->level,
      ];
    }

    // Data siswa
    $students = [
      'Ahmad Fauzan Ramadhan',
      'Siti Nur Aisyah',
      'Muhammad Rizky Alfarizi',
      'Aulia Zahra Khairunnisa',
      'Fajar Maulana Akbar',
      'Nabila Syifa Azahra',
      'Rafi Hidayatullah',
      'Khairunnisa Putri Lestari',
      'Iqbal Nurul Fikri',
      'Dewi Ayu Rahmah',
      'Reza Anugrah Saputra',
      'Aisyah Humaira',
      'Farhan Abdul Majid',
      'Zahra Nayla Salsabila',
      'Ilham Syahputra',
      'Latifah Nuraini',
      'Yusuf Maulana',
      'Hana Khairani',
      'Aditya Ramadhan',
      'Fatimah Zahra',
      'Alif Rizqullah',
      'Sabrina Aulia Rahma',
      'Zidan Alfarel Malik',
      'Sarah Maulida',
      'Fikri Muhammad Azzam',
      'Amira Salsabila',
      'Hafizh Rasyid Fadhillah',
      'Nailah Syakirah',
      'Arsyad Nurjaman',
      'Khalila Zahrina',
    ];

    // Bagi siswa ke kelas (5 siswa per kelas)
    $tahun_lahir = [2009, 2009, 2008, 2008, 2007, 2007];
    $idx = 0;
    foreach ($classIds as $k => $class) {
      for ($i = 0; $i < 5; $i++) {
        $nama = $students[$idx];
        $nisn =
          $tahun_lahir[$k] . str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $student = Student::create([
          'nisn' => $nisn,
          'nama_lengkap' => $nama,
          'school_class_id' => $class['id'],
        ]);

        // Tambahkan progress untuk setiap siswa
        StudentProgress::create([
          'student_id' => $student->id,
          'jilid' => rand(1, 6),
          'halaman' => 1,
          'status_kenaikan' => 'Proses',
        ]);

        $idx++;
      }
    }
  }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    User::create([
      'name' => 'Super Admin',
      'email' => 'superadmin@example.com',
      'password' => Hash::make('superadmin123'), // Ganti dengan password yang aman
      'role' => 'superadmin',
      'password_changed_at' => now(),
    ]);

    // 1. Buat user koordinator
    $idPegawaiKoor = 'PG6';
    $koorUser = User::create([
      'name' => 'Koordinator Utama',
      'email' => 'koordinator@example.com',
      'password' => 'guruquran' . $idPegawaiKoor, // <-- Password dinamis
      'role' => 'koordinator',
    ]);

    Employee::create([
      'user_id' => $koorUser->id,
      'id_pegawai' => $idPegawaiKoor,
    ]);

    // 2. Buat 5 user guru + data teacher
    for ($i = 1; $i <= 5; $i++) {
      $idPegawaiGuru = "PG{$i}";
      $guruUser = User::create([
        'name' => "Guru {$i}",
        'email' => "guru{$i}@example.com",
        'password' => 'guruquran' . $idPegawaiGuru, // <-- Password dinamis
        'role' => 'guru',
      ]);

      Employee::create([
        'user_id' => $guruUser->id,
        'id_pegawai' => $idPegawaiGuru,
      ]);
    }
  }
}

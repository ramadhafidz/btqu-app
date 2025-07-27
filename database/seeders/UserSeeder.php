<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // 1. Buat user koordinator
    User::create([
      'name' => 'Koordinator Utama',
      'email' => 'koordinator@example.com',
      'password' => Hash::make('koor123'),
      'role' => 'koordinator',
    ]);

    // 2. Buat 5 user guru + data teacher
    for ($i = 1; $i <= 5; $i++) {
      $user = User::create([
        'name' => "Guru $i",
        'email' => "guru$i@example.com",
        'password' => Hash::make('guru123'),
        'role' => 'guru',
      ]);

      Teacher::create([
        'user_id' => $user->id,
        'id_pegawai' => "PG$i",
      ]);
    }
  }
}

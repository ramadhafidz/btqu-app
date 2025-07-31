<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Employee;
use App\Models\BtqGroup;
use Illuminate\Support\Facades\DB;

class BtqGroupSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Bersihkan data grup sebelumnya agar seeder bisa dijalankan berulang kali
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    Student::query()->update(['btq_group_id' => null]);
    BtqGroup::truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    // Ambil semua guru dan siswa yang ada
    $teachers = Employee::whereHas('user', function ($query) {
      $query->where('role', 'guru');
    })->get();
    $students = Student::with('schoolClass')->get();

    // Kelompokkan siswa berdasarkan level kelas mereka
    $studentsByLevel = $students->groupBy('schoolClass.level');

    $teacherIndex = 0;

    // Loop melalui setiap level
    foreach ($studentsByLevel as $level => $studentsInLevel) {
      // Bagi siswa di level ini menjadi kelompok-kelompok berisi 5 orang
      foreach ($studentsInLevel->chunk(5) as $studentChunk) {
        // Pastikan kita masih punya guru untuk ditugaskan
        $teacherId = null;
        if (isset($teachers[$teacherIndex])) {
          $teacherId = $teachers[$teacherIndex]->id;
          $teacherIndex++;
        }

        // Buat grup BTQ baru
        $group = BtqGroup::create([
          'level' => $level,
          'teacher_id' => $teacherId,
        ]);

        // Update semua siswa dalam chunk ini untuk masuk ke grup baru
        $studentIds = $studentChunk->pluck('id');
        Student::whereIn('id', $studentIds)->update([
          'btq_group_id' => $group->id,
        ]);
      }
    }

    $this->command->info(
      'BTQ groups have been created and students have been assigned successfully!',
    );
  }
}

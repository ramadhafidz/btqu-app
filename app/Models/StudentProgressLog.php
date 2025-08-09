<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProgressLog extends Model
{
  protected $fillable = [
    'student_progress_id',
    'jilid',
    'halaman',
  'hafalan_juz_id',
    'hafalan_surah_id',
    'hafalan_ayat',
    'type', // 'halaman' atau 'hafalan'
  ];

  public function studentProgress()
  {
    return $this->belongsTo(StudentProgress::class);
  }

  public function hafalanJuz()
  {
    return $this->belongsTo(Juz::class, 'hafalan_juz_id');
  }
}

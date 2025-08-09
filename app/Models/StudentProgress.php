<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProgress extends Model
{
  use HasFactory;

  protected $fillable = [
    'student_id',
    'jilid',
    'halaman',
  'hafalan_juz_id',
    'status_kenaikan',
    'hafalan_surah_id',
    'hafalan_ayat',
  ];

  protected $casts = [];

  public function student()
  {
    return $this->belongsTo(Student::class);
  }

  public function reviewLogs()
  {
    return $this->hasMany(StudentPromotionReviewLog::class, 'student_progress_id');
  }

  public function hafalanJuz()
  {
    return $this->belongsTo(Juz::class, 'hafalan_juz_id');
  }
}

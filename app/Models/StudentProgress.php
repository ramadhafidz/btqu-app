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
    'status_kenaikan',
    'hafalan_surah_id',
    'hafalan_ayat',
  ];

  public function student()
  {
    return $this->belongsTo(Student::class);
  }
}

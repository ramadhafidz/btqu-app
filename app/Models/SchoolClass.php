<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
  use HasFactory;

  protected $fillable = ['level', 'nama_kelas'];

  public function students()
  {
    return $this->hasMany(Student::class);
  }
}

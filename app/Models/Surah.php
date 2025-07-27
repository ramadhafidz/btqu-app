<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Surah extends Model
{
  public $timestamps = false;

  public function juzs()
  {
    return $this->belongsToMany(Juz::class, 'juz_surah')->withPivot(
      'start_ayah',
    );
  }
}

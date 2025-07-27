<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Juz extends Model
{
  public $timestamps = false;

  public function surahs()
  {
    return $this->belongsToMany(Surah::class, 'juz_surah')->withPivot(
      'start_ayah',
    );
  }
}

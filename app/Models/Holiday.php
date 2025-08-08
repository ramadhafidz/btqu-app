<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
  protected $fillable = ['tanggal', 'keterangan'];

  protected $casts = [
    'tanggal' => 'datetime',
  ];

  public function scopeInYear($query, $year = null)
  {
    $year = $year ?: now()->year;
    return $query->whereYear('tanggal', $year);
  }

  public function scopeUpcoming($query)
  {
    return $query->where('tanggal', '>=', now()->toDateString());
  }

  public function getFormattedDateAttribute()
  {
    return $this->tanggal->locale('id')->translatedFormat('l, d F Y');
  }
}
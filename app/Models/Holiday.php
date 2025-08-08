<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
  protected $fillable = ['tanggal', 'keterangan'];

  // Cast ke tipe date dengan format Y-m-d agar serialisasi JSON cocok untuk <input type="date">
  protected $casts = [
    'tanggal' => 'date:Y-m-d',
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
    if (!$this->tanggal) {
      return null;
    }
    $raw = $this->getAttribute('tanggal');
    $date = $raw instanceof Carbon ? $raw : Carbon::parse($raw);
    return $date->locale('id')->translatedFormat('l, d F Y');
  }
}

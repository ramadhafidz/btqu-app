<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BtqGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'level',
        'hafalan_surah_id', // Tambahkan ini
        'hafalan_ayat',     // Tambahkan ini
    ];

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function hafalanSurah()
    {
        return $this->belongsTo(Surah::class, 'hafalan_surah_id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}

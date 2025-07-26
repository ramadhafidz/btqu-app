<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'nisn',
        'nama_lengkap',
        'school_class_id',
        'btq_group_id',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function progress()
    {
        return $this->hasOne(StudentProgress::class);
    }

    public function btqGroup()
    {
        return $this->belongsTo(BtqGroup::class);
    }
}

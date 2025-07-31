<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
  use HasFactory;

  protected $fillable = ['user_id', 'id_pegawai'];
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  public function btqGroup()
  {
    return $this->hasOne(BtqGroup::class, 'teacher_id');
  }
}

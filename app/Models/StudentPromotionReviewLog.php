<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPromotionReviewLog extends Model
{
    use HasFactory;

    protected $table = 'student_promotion_review_logs';

    protected $fillable = [
        'student_progress_id',
        'note',
        'reviewed_by_user_id',
        'decision',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function progress()
    {
        return $this->belongsTo(StudentProgress::class, 'student_progress_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}

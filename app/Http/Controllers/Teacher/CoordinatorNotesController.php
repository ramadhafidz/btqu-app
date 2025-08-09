<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\BtqGroup;
use App\Models\StudentPromotionReviewLog;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CoordinatorNotesController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $employeeId = $user->employee?->id;

        $group = BtqGroup::where('teacher_id', $employeeId)->first();

        if (!$group) {
            return Inertia::render('Teacher/CoordinatorNotes', [
                'logs' => [],
                'btqGroup' => null,
            ]);
        }

        $logs = StudentPromotionReviewLog::with(['progress.student', 'reviewer'])
            ->whereHas('progress.student', function ($q) use ($group) {
                $q->where('btq_group_id', $group->id);
            })
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'student' => [
                        'id' => optional($log->progress?->student)->id,
                        'nama_lengkap' => optional($log->progress?->student)->nama_lengkap,
                    ],
                    'jilid' => optional($log->progress)->jilid,
                    'decision' => $log->decision,
                    'reviewed_at' => optional($log->reviewed_at)?->toIso8601String(),
                    'reviewer' => [
                        'id' => optional($log->reviewer)->id,
                        'name' => optional($log->reviewer)->name,
                    ],
                    'note' => $log->note,
                ];
            })->values();

        return Inertia::render('Teacher/CoordinatorNotes', [
            'logs' => $logs,
            'btqGroup' => [
                'id' => $group->id,
                'level' => $group->level,
            ],
        ]);
    }
}

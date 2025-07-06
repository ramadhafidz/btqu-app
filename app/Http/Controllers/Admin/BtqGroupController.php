<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BtqGroup;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class BtqGroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $groups = BtqGroup::query()
            ->when($request->level, function ($query, $level) {
                return $query->where('level', $level);
            })
            ->with(['teacher.user', 'students'])
            ->get();

        return response()->json($groups);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate(['level' => 'required|integer|min:1']);

        $group = BtqGroup::create($request->only('level'));

        return response()->json($group, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BtqGroup $btqGroup)
    {
        $validated = $request->validate([
            'teacher_id' => ['sometimes', 'required', 'exists:teachers,id', Rule::unique('btq_groups')->ignore($btqGroup->id)],
            'hafalan_surah_id' => ['nullable', 'exists:surahs,id'],
            'hafalan_ayat' => ['nullable', 'string', 'max:255'],
        ], [
            'teacher_id.unique' => 'Guru ini sudah mengajar di kelompok lain.',
        ]);

        $btqGroup->update($validated);

        return response()->json($btqGroup->load(['teacher.user', 'students', 'hafalanSurah']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BtqGroup $btqGroup)
    {
        DB::transaction(function () use ($btqGroup) {
            // Set btq_group_id menjadi null untuk semua siswa di grup ini
            $btqGroup->students()->update(['btq_group_id' => null]);
            // Baru hapus grupnya
            $btqGroup->delete();
        });

        return response()->noContent();
    }

    public function addStudent(Request $request, BtqGroup $btqGroup)
    {
        $request->validate(['student_id' => 'required|exists:students,id']);

        $student = Student::find($request->student_id);
        $student->btq_group_id = $btqGroup->id;
        $student->save();

        return response()->json($student);
    }

    public function removeStudent(Request $request, BtqGroup $btqGroup)
    {
        $request->validate(['student_id' => 'required|exists:students,id']);

        $student = Student::find($request->student_id);
        // Pastikan siswa ini memang ada di grup yang benar sebelum dikeluarkan
        if ($student->btq_group_id === $btqGroup->id) {
            $student->btq_group_id = null;
            $student->save();
        }

        return response()->noContent();
    }
}

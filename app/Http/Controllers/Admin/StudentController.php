<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\StudentProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $students = Student::with('schoolClass')->get();
        return response()->json($students);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nisn' => 'required|string|max:255|unique:students,nisn',
            'nama_lengkap' => 'required|string|max:255',
            'school_class_id' => 'required|exists:school_classes,id',
        ]);

        $student = DB::transaction(function () use ($request) {
            // Buat data siswa
            $student = Student::create($request->all());

            // Buat data progress awal untuk siswa tersebut
            $student->progress()->create([
                'jilid' => 1,
                'halaman' => 1,
                'hafalan_surah_id' => null,
                'hafalan_ayat' => 'Belum ada',
            ]);

            return $student;
        });

        return response()->json($student->load('schoolClass'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        return response()->json($student->load('schoolClass'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Student $student)
    {
        $request->validate([
            'nisn' => 'required|string|max:255|unique:students,nisn,'.$student->id,
            'nama_lengkap' => 'required|string|max:255',
            'school_class_id' => 'required|exists:school_classes,id',
        ]);

        $student->update($request->all());

        return response()->json($student->load('schoolClass'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->noContent();
    }

    public function unassigned(Request $request)
    {
        // Ambil semua siswa yang belum punya kelompok
        $students = Student::query()
            ->whereNull('btq_group_id')
            // Tambahkan kondisi 'when' untuk memfilter berdasarkan level
            ->when($request->level, function ($query, $level) {
                // Ini adalah query relasi: cari siswa yang 'schoolClass'-nya
                // memiliki level yang sesuai.
                return $query->whereHas('schoolClass', function ($subQuery) use ($level) {
                    $subQuery->where('level', $level);
                });
            })
            ->get();

        return response()->json($students);
    }
}

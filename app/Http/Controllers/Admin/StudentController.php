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
  protected const JILID_LIMITS = [
    1 => 40,
    2 => 40,
    3 => 40,
    4 => 40,
    5 => 40,
    6 => 40,
    7 => 37,
    8 => 25,
  ];

  public function index(Request $request)
  {
    $students = Student::query()
      ->with(['schoolClass', 'btqGroup.teacher.user', 'progress'])
      ->when($request->input('class'), function ($query, $classId) {
        $query->where('school_class_id', $classId);
      })
      ->when($request->input('search'), function ($query, $search) {
        $query->where(function ($subQuery) use ($search) {
          $subQuery
            ->where('nama_lengkap', 'like', "%{$search}%")
            ->orWhere('nisn', 'like', "%{$search}%");
        });
      })
      ->get();

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
      'jilid' => [
        'required',
        'integer',
        'in:' . implode(',', array_keys(self::JILID_LIMITS)),
      ],
      'halaman' => [
        'required',
        'integer',
        'min:1',
        function ($attribute, $value, $fail) use ($request) {
          $jilid = $request->input('jilid');
          if (
            $jilid &&
            isset(self::JILID_LIMITS[$jilid]) &&
            $value > self::JILID_LIMITS[$jilid]
          ) {
            $fail(
              "Halaman untuk jilid {$jilid} tidak boleh lebih dari " .
                self::JILID_LIMITS[$jilid] .
                '.',
            );
          }
        },
      ],
    ]);

    $student = DB::transaction(function () use ($request) {
      // Buat data siswa
      $student = Student::create($request->all());

      // Buat data progress awal untuk siswa tersebut
      $student->progress()->create([
        'jilid' => $request->jilid,
        'halaman' => $request->halaman,
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
      'nisn' => 'required|string|max:255|unique:students,nisn,' . $student->id,
      'nama_lengkap' => 'required|string|max:255',
      'school_class_id' => 'required|exists:school_classes,id',
      'jilid' => [
        'required',
        'integer',
        'in:' . implode(',', array_keys(self::JILID_LIMITS)),
      ],
      'halaman' => [
        'required',
        'integer',
        'min:1',
        function ($attribute, $value, $fail) use ($request) {
          $jilid = $request->input('jilid');
          if (
            $jilid &&
            isset(self::JILID_LIMITS[$jilid]) &&
            $value > self::JILID_LIMITS[$jilid]
          ) {
            $fail(
              "Halaman untuk jilid {$jilid} tidak boleh lebih dari " .
                self::JILID_LIMITS[$jilid] .
                '.',
            );
          }
        },
      ],
    ]);

    DB::transaction(function () use ($request, $student) {
      $student->update(
        $request->only('nisn', 'nama_lengkap', 'school_class_id'),
      );

      // Update atau buat data progress jika belum ada
      $student->progress()->updateOrCreate(
        ['student_id' => $student->id], // Kondisi pencarian
        ['jilid' => $request->jilid, 'halaman' => $request->halaman], // Data yang diupdate
      );
    });

    return response()->json($student->load('schoolClass', 'progress'));
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
        return $query->whereHas('schoolClass', function ($subQuery) use (
          $level,
        ) {
          $subQuery->where('level', $level);
        });
      })
      ->get();

    return response()->json($students);
  }
}

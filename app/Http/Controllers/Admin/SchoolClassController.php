<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolClassController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    $classes = SchoolClass::withCount('students')
      ->orderBy('level')
      ->orderBy('nama_kelas')
      ->get();

    return response()->json($classes);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'level' => ['required', 'integer', 'min:1'],
      'nama_kelas' => [
        'required',
        'string',
        'max:255',
        Rule::unique('school_classes'),
      ],
    ]);

    $class = SchoolClass::create($validated);
    return response()->json(
      [
        'message' => "Kelas baru {$class->level} {$class->nama_kelas} berhasil ditambahkan.",
        'class' => $class,
      ],
      201,
    );
  }

  /**
   * Display the specified resource.
   */
  public function show(SchoolClass $schoolClass)
  {
    return response()->json($schoolClass);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, SchoolClass $schoolClass)
  {
    // Simpan data lama untuk pesan
    $oldLevel = $schoolClass->level;
    $oldNamaKelas = $schoolClass->nama_kelas;

    $validated = $request->validate([
      'level' => ['required', 'integer', 'min:1'],
      'nama_kelas' => [
        'required',
        'string',
        'max:255',
        Rule::unique('school_classes')->ignore($schoolClass->id),
      ],
    ]);

    $schoolClass->update($validated);
    return response()->json([
      'message' => "Kelas {$oldLevel} {$oldNamaKelas} berhasil diperbarui menjadi {$schoolClass->level} {$schoolClass->nama_kelas}.",
      'class' => $schoolClass,
    ]);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(SchoolClass $schoolClass)
  {
    // Simpan data untuk pesan sebelum dihapus
    $level = $schoolClass->level;
    $namaKelas = $schoolClass->nama_kelas;

    $schoolClass->delete();
    return response()->json([
      'message' => "Kelas {$level} {$namaKelas} berhasil dihapus.",
    ]);
  }

  public function all()
  {
    return response()->json(
      SchoolClass::orderBy('level')->orderBy('nama_kelas')->get(),
    );
  }
}
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
        $classes = SchoolClass::orderBy('level')->orderBy('nama_kelas')->get();
        return response()->json($classes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'level' => ['required', 'integer', 'min:1'],
            'nama_kelas' => ['required', 'string', 'max:255', Rule::unique('school_classes')],
        ]);

        $class = SchoolClass::create($validated);
        return response()->json($class, 201);
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
        $validated = $request->validate([
            'level' => ['required', 'integer', 'min:1'],
            'nama_kelas' => ['required', 'string', 'max:255', Rule::unique('school_classes')->ignore($schoolClass->id)],
        ]);

        $schoolClass->update($validated);
        return response()->json($schoolClass);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SchoolClass $schoolClass)
    {
        $schoolClass->delete();
        return response()->noContent();
    }

    public function all()
    {
        return response()->json(SchoolClass::orderBy('level')->orderBy('nama_kelas')->get());
    }
}
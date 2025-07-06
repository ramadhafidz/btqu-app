<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $teachers = Teacher::with('user')->get();
        return response()->json($teachers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'id_pegawai' => 'required|string|max:255|unique:' . Teacher::class,
        ]);

        $teacher = DB::transaction(function () use ($request) {
            // Buat data User terlebih dahulu
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'guru', // Set role sebagai guru
            ]);

            // Buat data Teacher yang terhubung dengan user baru
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'id_pegawai' => $request->id_pegawai,
            ]);

            return $teacher;
        });

        return response()->json($teacher->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Teacher $teacher)
    {
        return response()->json($teacher->load('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Teacher $teacher)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $teacher->user_id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'id_pegawai' => 'required|string|max:255|unique:teachers,id_pegawai,' . $teacher->id,
        ]);

        $teacher = DB::transaction(function () use ($request, $teacher) {
            // Update data di tabel users
            $teacher->user->update([
                'name' => $request->name,
                'email' => $request->email,
            ]);

            // Jika ada password baru, update juga passwordnya
            if ($request->filled('password')) {
                $teacher->user->update([
                    'password' => Hash::make($request->password),
                ]);
            }

            // Update data di tabel teachers
            $teacher->update([
                'id_pegawai' => $request->id_pegawai,
            ]);

            return $teacher;
        });

        return response()->json($teacher->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher)
    {
        DB::transaction(function () use ($teacher) {
            $teacher->user->delete();
            $teacher->delete();
        });

        return response()->noContent();
    }

    public function all()
    {
        return response()->json(Teacher::with('user')->get());
    }
}
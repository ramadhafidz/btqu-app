<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Juz;
use App\Models\Surah;

class DataController extends Controller
{
  public function juzs()
  {
    return response()->json(Juz::all());
  }

  public function surahs(Request $request)
  {
    $query = Surah::query();
    if ($request->filled('juz_id')) {
      $query->whereHas('juzs', function ($q) use ($request) {
        $q->where('juz_id', $request->juz_id);
      });
    }
    return response()->json($query->orderBy('surah_number')->get());
  }
}

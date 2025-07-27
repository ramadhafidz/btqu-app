<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class EnsurePasswordIsChanged
{
  public function handle(Request $request, Closure $next)
  {
    $user = $request->user();

    // Jika user sudah login, passwordnya belum diubah, dan dia tidak sedang mencoba
    // mengakses halaman ganti password atau logout, maka paksa redirect.
    if (
      $user &&
      is_null($user->password_changed_at) &&
      $user->role !== 'superadmin' &&
      !$request->routeIs('profile.edit') &&
      !$request->routeIs('logout')
    ) {
      return redirect()
        ->route('profile.edit')
        ->with(
          'message',
          'Harap ubah password default Anda untuk melanjutkan.',
        );
    }

    return $next($request);
  }
}
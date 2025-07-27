<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRoleKoordinator
{
  public function handle(Request $request, Closure $next): Response
  {
    // Jika user yang login rolenya adalah 'koordinator'
    if ($request->user() && $request->user()->role === 'koordinator') {
      // Izinkan untuk melanjutkan
      return $next($request);
    }

    // Jika bukan, blokir dengan halaman error 403
    abort(403, 'UNAUTHORIZED ACTION.');
  }
}

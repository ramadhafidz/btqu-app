<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRoleSuperadmin
{
  public function handle(Request $request, Closure $next): Response
  {
    if ($request->user() && $request->user()->role === 'superadmin') {
      return $next($request);
    }
    abort(403, 'UNAUTHORIZED ACTION.');
  }
}

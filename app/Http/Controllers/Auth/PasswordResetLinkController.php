<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\PasswordResetRequest;

class PasswordResetLinkController extends Controller
{
  /**
   * Display the password reset link request view.
   */
  public function create(): Response
  {
    return Inertia::render('Auth/ForgotPassword', [
      'status' => session('status'),
    ]);
  }

  /**
   * Handle an incoming password reset link request.
   *
   * @throws \Illuminate\Validation\ValidationException
   */
  public function store(Request $request): RedirectResponse
  {
    $request->validate(['email' => 'required|email|exists:users,email']);
    $user = User::where('email', $request->email)->first();

    $existingRequest = PasswordResetRequest::where('user_id', $user->id)
      ->where('status', 'pending')
      ->exists();

    if ($existingRequest) {
      return back()->with(
        'status',
        'Anda sudah memiliki permintaan reset password yang sedang diproses.',
      );
    }

    PasswordResetRequest::create([
      'user_id' => $user->id,
      'status' => 'pending',
    ]);

    return back()->with('status', 'Permintaan reset password telah berhasil dikirim ke Superadmin.');
  }
}

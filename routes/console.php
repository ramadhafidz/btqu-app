<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
  $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule dashboard cache clearing
Schedule::command('dashboard:clear-cache --force')
    ->dailyAt('06:00')
    ->when(function () {
        // Only clear cache on business days
        return now()->isWeekday();
    })
    ->withoutOverlapping()
    ->runInBackground();

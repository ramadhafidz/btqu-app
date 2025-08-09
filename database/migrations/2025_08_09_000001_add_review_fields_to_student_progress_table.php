<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    // No-op: columns were moved to a dedicated logs table in a later migration
  }

  public function down(): void
  {
    // No-op
  }
};

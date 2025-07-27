<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('btq_groups', function (Blueprint $table) {
      $table->unsignedTinyInteger('level')->after('teacher_id');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('btq_groups', function (Blueprint $table) {
      $table->dropColumn('level');
    });
  }
};

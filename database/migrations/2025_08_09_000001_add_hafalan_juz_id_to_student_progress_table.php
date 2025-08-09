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
    Schema::table('student_progress', function (Blueprint $table) {
      $table
        ->foreignId('hafalan_juz_id')
        ->nullable()
        ->after('halaman')
        ->constrained('juzs');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('student_progress', function (Blueprint $table) {
      $table->dropForeign(['hafalan_juz_id']);
      $table->dropColumn('hafalan_juz_id');
    });
  }
};

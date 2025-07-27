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
    Schema::create('juz_surah', function (Blueprint $table) {
      $table->id();
      $table->foreignId('juz_id')->constrained('juzs')->onDelete('cascade');
      $table->foreignId('surah_id')->constrained('surahs')->onDelete('cascade');
      $table->integer('start_ayah');
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('juz_surah');
  }
};

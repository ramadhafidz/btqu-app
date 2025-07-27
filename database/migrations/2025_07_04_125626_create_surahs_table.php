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
    Schema::create('surahs', function (Blueprint $table) {
      $table->id();
      $table->integer('surah_number');
      $table->string('name_latin');
      $table->string('name_arabic');
      $table->integer('number_of_ayahs');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('surahs');
  }
};

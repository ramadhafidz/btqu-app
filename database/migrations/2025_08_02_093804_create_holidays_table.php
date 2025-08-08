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
    Schema::create('holidays', function (Blueprint $table) {
      $table->id();
      $table->date('tanggal')->unique(); // Kolom untuk menyimpan tanggal libur
      $table->string('keterangan')->nullable(); // Keterangan libur (opsional)
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('holidays');
  }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_progress_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_progress_id')->constrained('student_progress')->onDelete('cascade');
            $table->integer('jilid');
            $table->integer('halaman');
            $table->foreignId('hafalan_surah_id')->nullable()->constrained('surahs');
            $table->string('hafalan_ayat')->nullable();
            $table->string('type')->comment('halaman/hafalan');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_progress_logs');
    }
};
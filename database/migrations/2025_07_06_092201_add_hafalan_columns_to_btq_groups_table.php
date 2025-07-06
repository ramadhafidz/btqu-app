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
        Schema::table('btq_groups', function (Blueprint $table) {
            $table->foreignId('hafalan_surah_id')->nullable()->constrained('surahs')->after('level');
            $table->string('hafalan_ayat')->nullable()->after('hafalan_surah_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('btq_groups', function (Blueprint $table) {
            $table->dropForeign(['hafalan_surah_id']);
            $table->dropColumn(['hafalan_surah_id', 'hafalan_ayat']);
        });
    }
};

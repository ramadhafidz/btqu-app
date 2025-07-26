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
        // Kolom hafalan dihapus, tidak perlu menambah kolom apapun di sini
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada kolom yang perlu dihapus karena tidak ada perubahan pada up()
    }
};

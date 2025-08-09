<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_promotion_review_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_progress_id')->constrained('student_progress')->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('decision', 20); // approved | rejected
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // Drop columns from student_progress, if they exist
        Schema::table('student_progress', function (Blueprint $table) {
            if (Schema::hasColumn('student_progress', 'last_reviewed_by_user_id')) {
                $table->dropForeign(['last_reviewed_by_user_id']);
            }
            if (Schema::hasColumn('student_progress', 'last_review_note')) {
                $table->dropColumn('last_review_note');
            }
            if (Schema::hasColumn('student_progress', 'last_reviewed_by_user_id')) {
                $table->dropColumn('last_reviewed_by_user_id');
            }
            if (Schema::hasColumn('student_progress', 'last_review_decision')) {
                $table->dropColumn('last_review_decision');
            }
            if (Schema::hasColumn('student_progress', 'last_reviewed_at')) {
                $table->dropColumn('last_reviewed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_promotion_review_logs');

        Schema::table('student_progress', function (Blueprint $table) {
            // Recreate columns if needed on rollback
            $table->text('last_review_note')->nullable()->after('status_kenaikan');
            $table->foreignId('last_reviewed_by_user_id')->nullable()->after('last_review_note')->constrained('users')->nullOnDelete();
            $table->string('last_review_decision', 20)->nullable()->after('last_reviewed_by_user_id');
            $table->timestamp('last_reviewed_at')->nullable()->after('last_review_decision');
        });
    }
};

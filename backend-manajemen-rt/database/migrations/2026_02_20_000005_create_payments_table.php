<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('resident_id')->constrained('residents')->cascadeOnDelete();
            $table->foreignId('payment_type_id')->constrained('payment_types')->cascadeOnDelete();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->unsignedBigInteger('amount');
            $table->enum('status', ['paid', 'unpaid'])->default('unpaid');
            $table->date('payment_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['house_id', 'payment_type_id', 'month', 'year'],
                'unique_payment_per_month'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

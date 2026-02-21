<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('houses', function (Blueprint $table) {
            $table->id();
            $table->string('house_number', 10)->unique();
            $table->string('block', 10)->nullable();
            $table->string('address');
            $table->enum('status', ['occupied', 'empty'])->default('empty');
            $table->enum('house_type', ['tetap', 'kontrak'])->default('tetap');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('houses');
    }
};

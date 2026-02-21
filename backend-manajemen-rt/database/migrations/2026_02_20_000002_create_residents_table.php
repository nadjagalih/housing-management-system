<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residents', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('ktp_photo')->nullable();
            $table->enum('resident_type', ['tetap', 'kontrak'])->default('tetap');
            $table->string('phone_number', 20)->nullable();
            $table->enum('marital_status', ['married', 'single'])->default('single');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};

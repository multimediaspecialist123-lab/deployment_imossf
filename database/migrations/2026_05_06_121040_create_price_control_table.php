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
        Schema::create('price_control', function (Blueprint $table) {
            $table->id();
            $table->enum('unit', [
                'per_head',
                'per_kg',
                 ]);
            $table->enum('category', [
                'piglet',
                'fattening',
                 ]);
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_control');
    }
};

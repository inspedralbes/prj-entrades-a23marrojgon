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
        Schema::create('concerts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->dateTime('date');
            $table->string('venue'); // e.g., Palau Sant Jordi
            $table->decimal('price', 8, 2);
            $table->integer('total_tickets');
            $table->integer('available_tickets');
            $table->string('image_url')->nullable();
            $table->string('status')->default('active'); // active, cancelled, sold_out
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('concerts');
    }
};

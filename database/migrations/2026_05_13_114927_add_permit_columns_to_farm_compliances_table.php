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
        Schema::table('farm_compliances', function (Blueprint $table) {
            // Add boolean columns with default values
            $table->boolean('has_barangay_clearance')->default(false)->after('has_biosecurity');
            $table->boolean('has_business_permit')->default(false)->after('has_barangay_clearance');
            
            // Optional: Add related columns for permit numbers and dates
            $table->string('barangay_clearance_number')->nullable()->after('has_business_permit');
            $table->string('business_permit_number')->nullable()->after('barangay_clearance_number');
            $table->date('barangay_clearance_date')->nullable()->after('business_permit_number');
            $table->date('business_permit_date')->nullable()->after('barangay_clearance_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('farm_compliances', function (Blueprint $table) {
            $table->dropColumn([
                'has_barangay_clearance',
                'has_business_permit',
                'barangay_clearance_number',
                'business_permit_number',
                'barangay_clearance_date',
                'business_permit_date'
            ]);
        });
    }
};
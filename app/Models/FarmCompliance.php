<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FarmCompliance extends Model
{
    protected $fillable = [
        'user_id',

        'registration_number',
        'lgu_name',
        'barangay_name',
        'date_registered',
        'valid_until',

        'has_septic_tank',
        'has_drainage',
        'proper_waste_disposal',
        'distance_from_residence',
        'meets_distance_requirement',
        'has_proper_pen',
        'has_biosecurity',

        'status',
        'remarks',
        'verified_by',
        'verified_at',

         'has_barangay_clearance',      // Add this
    'has_business_permit',          // Add this
    'barangay_clearance_number',    // Optional
    'business_permit_number',       // Optional
    'barangay_clearance_date',      // Optional
    'business_permit_date',         // Optional
    ];

    protected $casts = [
        'has_septic_tank' => 'boolean',
        'has_drainage' => 'boolean',
        'proper_waste_disposal' => 'boolean',
        'meets_distance_requirement' => 'boolean',
        'has_proper_pen' => 'boolean',
        'has_biosecurity' => 'boolean',

        'date_registered' => 'date',
        'valid_until' => 'date',
        'verified_at' => 'datetime',
        
          'has_barangay_clearance' => 'boolean',
    'has_business_permit' => 'boolean',
    'barangay_clearance_date' => 'date',
    'business_permit_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ✅ Helper
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}
<?php

namespace App\Models\Marketplace;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Swine\Swine;
use App\Models\Marketplace\MarketplaceTransaction;

class ListingSwine extends Model
{
    use HasFactory;

    protected $fillable = [
       'listing_id',
        'swine_id',
        'seller_id',
        'status',
        'scaled_weight',
        'estimated_weight',
        'sex',
        'birthdate',
        'breed',
        'thumbnail',
        'remarks',
        'reserved_by',
        'is_reserved',
        'reservation_expires_at',
        'da_approval_status',
        'da_remarks',
        'approved_by',

];

protected $casts = [
    'birthdate' => 'date',
    'reservation_expires_at' => 'datetime',
    'is_reserved' => 'boolean',
];

    public function listing()
    {
        return $this->belongsTo(MarketplaceListing::class, 'listing_id');
    }

    public function swine()
    {
        return $this->belongsTo(Swine::class, 'swine_id');
    }

    public function reservedBy()
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }

      public function requests()
    {
        return $this->hasMany(SwineRequest::class, 'listing_swine_id');
    }
    

     public function seller()
    {
        return $this->belongsTo(\App\Models\User::class, 'seller_id');
    }

     // DA personnel who approved/restrained the swine
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    public function transactions()
    {
        return $this->hasMany(MarketplaceTransaction::class, 'listing_swine_id');
    }
    /**
     * 🧠 Sync swine attributes (sex, breed, birthdate, etc.)
     * Called when added to a listing
     */
  public function syncFromSwine()
{
    if (! $this->swine) return;

    $attributes = [
        'sex' => $this->swine->sex,
        'birthdate' => $this->swine->birthdate,
        'breed' => $this->swine->breed->name ?? $this->swine->breed_name,
        'scaled_weight' => $this->swine->weight ?? null,
    ];

    $this->fill($attributes);

    if ($this->isDirty()) {
        $this->save();
    }
}


    /**
     * Automatically sync whenever created
     */
     
   protected static function booted()
{
    static::created(function ($listingSwine) {
        $listingSwine->syncFromSwine();
        $listingSwine->listing?->syncAggregateAttributes();

        // ✅ Mark swine as available when listed
        if ($listingSwine->swine) {
            $listingSwine->swine->update([
                'status' => 'available',
            ]);
        }
    });

    static::updated(function ($listingSwine) {
        $listingSwine->listing?->syncAggregateAttributes();

        if ($listingSwine->wasChanged('status') && $listingSwine->swine) {
            $listingSwine->swine->update([
                'status' => $listingSwine->status,
            ]);
        }
    });

    static::deleted(function ($listingSwine) {
        $listingSwine->listing?->syncAggregateAttributes();

        // 🔁 Restore swine status when removed from listing
        if ($listingSwine->swine) {
            $listingSwine->swine->update([
                'status' => 'active', // or 'on_farm' / 'available_on_farm'
            ]);
        }
    });
}

    /**
     * 🧩 Scopes for cleaner query usage
     */
    public function scopeApproved($query)
    {
        return $query->where('da_approval_status', 'approved');
    }

    public function scopeRestrained($query)
    {
        return $query->where('da_approval_status', 'restrained');
    }

    public function scopePending($query)
    {
        return $query->whereNull('da_approval_status');
    }

   /**
     * 🧮 Helper: Display DA approval badge text for UI
     */
   /**
 * 🧮 Helper: Display DA approval badge text for UI
 * - Returns nothing if DA has not yet reviewed (status is null)
 */
public function getDaApprovalBadgeAttribute()
{
    // If not yet reviewed, return empty string (so nothing displays)
    if (is_null($this->da_approval_status)) {
        return '';
    }

    // Otherwise, show status badge text
    return match ($this->da_approval_status) {
        'approved' => '✅ Verified by DA',
        'restrained' => '🚫 Restrained by DA',
        default => '',
    };
}

public function swineRequest()
{
    return $this->hasOne(\App\Models\Marketplace\SwineRequest::class, 'listing_swine_id');
}





}

<?php

namespace App\Models\Swine;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Swine\Breed;
use App\Models\Swine\SwineTransaction;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use Illuminate\Support\Str; // ✅ import Str here
use App\Models\Marketplace\MarketplaceListing;
use Carbon\Carbon; // ✅ Add this at top with other imports

class Swine extends Model
{
     use SoftDeletes;

    protected $fillable = [
        'owner_id',
        'tag_number',
        'sex',
        'birthdate',
        'breed_id',
        'cuztom_breed',
        'category',
        'purpose',
        'weight',
        'stage',
        'status',
        'description',
    ];

     protected $table = 'swine';

    public function expenses():hasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function owner():BelongsTo{
        return $this->belongsTo(User::class, );
    }

     public function breed()
    {
        return $this->belongsTo(Breed::class, 'breed_id');
    }

        public function transactions()
    {
        return $this->hasMany(SwineTransaction::class);
    }


       protected $appends = [
        'category_readable',
        'purpose_readable',
        'stage_readable',
          'age_in_days', // ✅ add here
    ];

    public function getCategoryReadableAttribute()
    {
        return $this->category ? Str::title(str_replace('_', ' ', $this->category)) : null;
    }

    public function getPurposeReadableAttribute()
    {
        return $this->purpose ? Str::title(str_replace('_', ' ', $this->purpose)) : null;
    }

    public function getStageReadableAttribute()
    {
        return $this->stage ? Str::title(str_replace('_', ' ', $this->stage)) : null;
    }

    public function groups()
{
    return $this->belongsToMany(SwineGroup::class, 'swine_group_members', 'swine_id', 'swine_group_id')
        ->withTimestamps()
        ->withPivot(['joined_at', 'left_at']);
}

 // 🔗 Get all group memberships (pivot table)
    public function groupMembers()
    {
        return $this->hasMany(SwineGroupMember::class, 'swine_id');
    }

     public function listings()
    {
        return $this->belongsToMany(MarketplaceListing::class, 'listing_swine', 'swine_id', 'listing_id')
                    ->withPivot([
            'seller_id',
            'status',
            'scaled_weight',
            'estimated_weight',
            'sex',
            'birthdate',
            'breed',
            'thumbnail',
            'remarks',
            'is_reserved',
            'reserved_by',
            'reservation_expires_at',
            'da_approval_status',
            'da_remarks',
            'approved_by',
        ])
        ->withTimestamps();
    }

    // Auto getter for combined breed name
    public function getBreedNameAttribute()
    {
        return $this->breed->name ?? $this->cuztom_breed ?? 'Unknown';
    }

    protected static function booted()
{
    static::created(function ($swine) {
        log_activity('created', 'swine', ['id' => $swine->id]);
    });

    static::updated(function ($swine) {
        log_activity('updated', 'swine', [
            'id' => $swine->id,
            'changes' => $swine->getChanges()
        ]);
    });

    static::deleted(function ($swine) {
        log_activity('deleted', 'swine', ['id' => $swine->id]);
    });
}

public function getAgeInDaysAttribute()
{
    return $this->birthdate
        ? Carbon::parse($this->birthdate)->diffInDays(now())
        : null;
}

public function listingSwine()
{
    return $this->hasMany(\App\Models\Marketplace\ListingSwine::class, 'swine_id');
}

    
}

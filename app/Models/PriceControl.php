<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceControl extends Model
{
    use HasFactory;

    protected $table = 'price_control';

    protected $fillable = [
        'unit',
        'category',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    /**
     * Get price control by category
     */
    public static function getPriceByCategory(string $category): ?self
    {
        return self::where('category', $category)->first();
    }

    /**
     * Get all price controls as key-value pairs for dropdown
     */
    public static function getPriceOptions(): array
    {
        return self::all()->mapWithKeys(function ($priceControl) {
            return [$priceControl->category => [
                'price' => $priceControl->price,
                'unit' => $priceControl->unit,
                'category' => $priceControl->category,
            ]];
        })->toArray();
    }
}
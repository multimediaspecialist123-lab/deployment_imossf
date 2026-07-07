<?php
// app/Http/Controllers/PriceControlController.php

namespace App\Http\Controllers;

use App\Models\PriceControl;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PriceControlController extends Controller
{
    /**
     * Display the price control management page
     */
    public function index()
    {
        // Get all price controls
        $priceControls = PriceControl::all()->keyBy('category');
        
        return Inertia::render('admin/price-control/index', [
            'priceControls' => $priceControls,
        ]);
    }

    /**
     * Update a specific price control
     */
    public function update(Request $request, $id)
    {
        $priceControl = PriceControl::findOrFail($id);
        
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'unit' => 'required|in:per_head,per_kg',
        ]);
        
        $priceControl->update($validated);
        
        return back()->with('success', 'Price updated successfully!');
    }

    /**
     * Update multiple price controls at once
     */
    public function updateMultiple(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:price_control,id',
            'updates.*.price' => 'required|numeric|min:0',
            'updates.*.unit' => 'required|in:per_head,per_kg',
        ]);
        
        foreach ($validated['updates'] as $update) {
            $priceControl = PriceControl::find($update['id']);
            if ($priceControl) {
                $priceControl->update([
                    'price' => $update['price'],
                    'unit' => $update['unit'],
                ]);
            }
        }
        
        return back()->with('success', 'All prices updated successfully!');
    }

    /**
     * Create a new price control (for breeder or other categories)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|unique:price_control,category',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|in:per_head,per_kg',
        ]);
        
        PriceControl::create($validated);
        
        return back()->with('success', 'New price template created successfully!');
    }

    /**
     * Delete a price control
     */
    public function destroy($id)
    {
        $priceControl = PriceControl::findOrFail($id);
        $priceControl->delete();
        
        return back()->with('success', 'Price template deleted successfully!');
    }
}
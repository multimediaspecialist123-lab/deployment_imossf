<?php
// app/Http/Controllers/VetmedClearanceController.php

namespace App\Http\Controllers;

use App\Models\VetmedClearance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log; // Add for better logging

class VetmedClearanceController extends Controller
{
    /**
     * Display a listing of user's vetmed clearances.
     */
    public function index()
    {
        $clearances = VetmedClearance::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('vetmed/index', [
            'clearances' => $clearances,
        ]);
    }

    /**
     * Show form for creating a new vetmed clearance.
     */
    public function create()
    {
        return Inertia::render('vetmed/create');
    }

    /**
     * Store a newly created vetmed clearance.
     */
     public function store(Request $request)
    {
        $validated = $request->validate([
            'clearance_number' => 'nullable|string|max:255',
            'document_type' => 'required|string|max:255',
            'veterinarian_name' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255',
            'issued_by' => 'nullable|string|max:255',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'remarks' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        try {
            DB::beginTransaction();

            // Handle file upload
            $file = $request->file('file');
            
            // Generate unique filename
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::slug($originalName) . '_' . time() . '.' . $extension;
            
            // Store file in public disk
            $filePath = $file->storeAs('vetmed-clearances', $fileName, 'public');
            
            // Verify file was stored
            if (!$filePath || !Storage::disk('public')->exists($filePath)) {
                throw new \Exception('Failed to store file');
            }

            // Create clearance record
            $clearance = VetmedClearance::create([
                'user_id' => auth()->id(),
                'clearance_number' => $validated['clearance_number'] ?? null,
                'document_type' => $validated['document_type'] ?? 'Veterinary Clearance',
                'veterinarian_name' => $validated['veterinarian_name'] ?? null,
                'license_number' => $validated['license_number'] ?? null,
                'issued_by' => $validated['issued_by'] ?? null,
                'issue_date' => $validated['issue_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'file_path' => $filePath,
                'file_name' => $fileName,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'pending_review',
            ]);

            DB::commit();

            // Use Inertia::location for redirect to ensure proper handling
            return redirect('/vetmed-clearance')->with('success', 'Success!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error
            Log::error('Vetmed Clearance Store Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // Delete file if it was uploaded
            if (isset($filePath) && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
            
            return back()->with('error', 'Failed to submit clearance: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified vetmed clearance.
     */
    public function show(VetmedClearance $vetmedClearance)
    {
        // Check if user owns this clearance or is admin
        if ($vetmedClearance->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        return Inertia::render('vetmed/show', [
            'clearance' => $vetmedClearance,
        ]);
    }

    /**
     * Show form for editing vetmed clearance.
     */
    public function edit(VetmedClearance $vetmedClearance)
    {
        // Only allow editing if pending_review or needs_revision
        if (!in_array($vetmedClearance->status, ['pending_review', 'needs_revision','verified'])) {
            return redirect()->route('vetmed.index')
                ->with('error', 'Cannot edit verified or rejected clearance.');
        }

        if ($vetmedClearance->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('vetmed/edit', [
            'clearance' => $vetmedClearance,
        ]);
    }

    /**
     * Update the specified vetmed clearance.
     */
    public function update(Request $request, VetmedClearance $vetmedClearance)
    {
        // Only allow updating if pending_review or needs_revision
        if (!in_array($vetmedClearance->status, ['pending_review', 'needs_revision','verified'])) {
            return back()->with('error', 'Cannot update verified or rejected clearance.');
        }

        if ($vetmedClearance->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'clearance_number' => 'nullable|string|max:255',
            'document_type' => 'required|string|max:255',
            'veterinarian_name' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255',
            'issued_by' => 'nullable|string|max:255',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'remarks' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        try {
            DB::beginTransaction();

            // Handle file upload if new file provided
            if ($request->hasFile('file')) {
                // Delete old file
                if ($vetmedClearance->file_path && Storage::disk('public')->exists($vetmedClearance->file_path)) {
                    Storage::disk('public')->delete($vetmedClearance->file_path);
                }

                // Upload new file
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('vetmed-clearances', $fileName, 'public');

                $vetmedClearance->file_path = $filePath;
                $vetmedClearance->file_name = $fileName;
                $vetmedClearance->mime_type = $file->getMimeType();
                $vetmedClearance->file_size = $file->getSize();
            }

            // Update fields
            $vetmedClearance->clearance_number = $validated['clearance_number'] ?? null;
            $vetmedClearance->document_type = $validated['document_type'];
            $vetmedClearance->veterinarian_name = $validated['veterinarian_name'] ?? null;
            $vetmedClearance->license_number = $validated['license_number'] ?? null;
            $vetmedClearance->issued_by = $validated['issued_by'] ?? null;
            $vetmedClearance->issue_date = $validated['issue_date'] ?? null;
            $vetmedClearance->expiry_date = $validated['expiry_date'] ?? null;
            $vetmedClearance->remarks = $validated['remarks'] ?? null;
            
            // Reset status to pending_review if it was needs_revision
            if ($vetmedClearance->status === 'needs_revision') {
                $vetmedClearance->status = 'pending_review';
                $vetmedClearance->rejection_reason = null;
            }

            $vetmedClearance->save();

            DB::commit();

            return redirect()->route('vetmed.index')
                ->with('success', 'Vetmed Clearance updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update clearance: ' . $e->getMessage());
        }
    }
    /**
     * Remove the specified vetmed clearance.
     */
    public function destroy(VetmedClearance $vetmedClearance)
    {
        if ($vetmedClearance->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        try {
            // Delete file from storage
            if ($vetmedClearance->file_path && Storage::disk('public')->exists($vetmedClearance->file_path)) {
                Storage::disk('public')->delete($vetmedClearance->file_path);
            }

            $vetmedClearance->delete();

            return redirect()->route('vetmed.index')
                ->with('success', 'Vetmed Clearance deleted successfully.');

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete clearance: ' . $e->getMessage());
        }
    }

/**
     * Display admin listing of all vetmed clearances.
     */
    public function adminIndex(Request $request)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            abort(403);
        }

        $query = VetmedClearance::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by clearance number or user name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('clearance_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $clearances = $query->paginate(15);

        return Inertia::render('admin/vetmed/index', [
            'clearances' => $clearances,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Update the status of a vetmed clearance (Admin only).
     */
    public function updateStatus(Request $request, VetmedClearance $vetmedClearance)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending_review,verified,rejected,needs_revision',
            'rejection_reason' => 'required_if:status,rejected,needs_revision|nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $oldStatus = $vetmedClearance->status;
            $vetmedClearance->status = $validated['status'];
            
            if ($validated['status'] === 'verified') {
                $vetmedClearance->verified_at = now();
                $vetmedClearance->verified_by = auth()->id();
                $vetmedClearance->rejection_reason = null;
            } elseif ($validated['status'] === 'rejected' || $validated['status'] === 'needs_revision') {
                $vetmedClearance->rejection_reason = $validated['rejection_reason'] ?? null;
                $vetmedClearance->verified_at = null;
                $vetmedClearance->verified_by = null;
            } else {
                $vetmedClearance->verified_at = null;
                $vetmedClearance->verified_by = null;
                $vetmedClearance->rejection_reason = null;
            }

            $vetmedClearance->save();

            DB::commit();

            return redirect()->back()->with('success', 'Clearance status updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Status Update Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to update status: ' . $e->getMessage());
        }
    }
    
}
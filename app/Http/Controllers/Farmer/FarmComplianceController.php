<?php

namespace App\Http\Controllers\Farmer;

use App\Http\Controllers\Controller;
use App\Models\FarmCompliance;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FarmComplianceController extends Controller
{
    public function show(?int $id = null): Response|RedirectResponse
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        
        if ($id) {
            $compliance = FarmCompliance::with('verifier', 'user')->findOrFail($id);
            
            if (!$isAdmin && $compliance->user_id !== $user->id) {
                abort(403, 'Unauthorized access');
            }
        } else {
            $compliance = FarmCompliance::with('verifier', 'user')
                ->where('user_id', $user->id)
                ->first();
                
            if (!$compliance && !$isAdmin) {
                return redirect()->route('farm-compliance.register');
            }
            
            if (!$compliance && $isAdmin) {
                return redirect()->route('admin.farm-compliances.index');
            }
        }
        
        return Inertia::render('farmer/FarmComplianceDetails', [
            'compliance' => $compliance,
            'isAdmin' => $isAdmin
        ]);
    }
    
    public function create(): Response|RedirectResponse
    {
        $user = Auth::user();
        $existing = FarmCompliance::where('user_id', $user->id)->first();
        
        if ($existing) {
            return redirect()->route('farm-compliance.show', $existing->id);
        }
        
        return Inertia::render('farmer/FarmComplianceRegister');
    }
    
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        $existing = FarmCompliance::where('user_id', $user->id)->first();
        if ($existing) {
            return redirect()->route('farm-compliance.show', $existing->id)
                ->with('error', 'Farm compliance record already exists.');
        }
        
        $validated = $request->validate([
            'registration_number' => 'nullable|string|unique:farm_compliances',
            'lgu_name' => 'nullable|string|max:255',
            'barangay_name' => 'nullable|string|max:255',
            'date_registered' => 'nullable|date',
            'valid_until' => 'nullable|date|after:date_registered',
            'has_septic_tank' => 'boolean',
            'has_drainage' => 'boolean',
            'proper_waste_disposal' => 'boolean',
            'distance_from_residence' => 'nullable|numeric|min:0',
            'meets_distance_requirement' => 'boolean',
            'has_proper_pen' => 'boolean',
            'has_biosecurity' => 'boolean',
            'remarks' => 'nullable|string',
        ]);
        
        $validated['user_id'] = $user->id;
        $validated['status'] = 'pending';
        
        $compliance = FarmCompliance::create($validated);
        
        return redirect()->route('farm-compliance.show', $compliance->id)
            ->with('success', 'Farm compliance application submitted successfully!');
    }
    
 public function update(Request $request, int $id): RedirectResponse
{
    try {
        $compliance = FarmCompliance::findOrFail($id);
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        
        Log::info('Farm Compliance Update Attempt', [
            'compliance_id' => $id,
            'user_id' => $user->id,
            'user_role' => $user->role,
            'isAdmin' => $isAdmin,
            'request_data' => $request->all()
        ]);
        
        if (!$isAdmin && $compliance->user_id !== $user->id) {
            Log::warning('Unauthorized update attempt', ['user_id' => $user->id, 'compliance_user_id' => $compliance->user_id]);
            abort(403, 'Unauthorized access');
        }
        
        $rules = [];
        
        if ($isAdmin) {
            // Admin can update all fields including permits
            $rules = [
                'registration_number' => 'nullable|string|unique:farm_compliances,registration_number,' . $id,
                'lgu_name' => 'nullable|string|max:255',
                'barangay_name' => 'nullable|string|max:255',
                'date_registered' => 'nullable|date',
                'valid_until' => 'nullable|date|after:date_registered',
                'has_septic_tank' => 'boolean',
                'has_drainage' => 'boolean',
                'proper_waste_disposal' => 'boolean',
                'distance_from_residence' => 'nullable|numeric|min:0',
                'meets_distance_requirement' => 'boolean',
                'has_proper_pen' => 'boolean',
                'has_biosecurity' => 'boolean',
                'has_barangay_clearance' => 'boolean',           // Add this
                'has_business_permit' => 'boolean',              // Add this
                'barangay_clearance_number' => 'nullable|string|max:255',  // Add this
                'business_permit_number' => 'nullable|string|max:255',     // Add this
                'barangay_clearance_date' => 'nullable|date',    // Add this
                'business_permit_date' => 'nullable|date',       // Add this
                'remarks' => 'nullable|string',
                'status' => 'sometimes|in:pending,approved,rejected',
            ];
        } else {
            // Farmers can only update compliance fields (cannot update permits)
            $rules = [
                'has_septic_tank' => 'boolean',
                'has_drainage' => 'boolean',
                'proper_waste_disposal' => 'boolean',
                'distance_from_residence' => 'nullable|numeric|min:0',
                'meets_distance_requirement' => 'boolean',
                'has_proper_pen' => 'boolean',
                'has_biosecurity' => 'boolean',
            ];
        }
        
        $validated = $request->validate($rules);
        
        Log::info('Validation passed', ['validated_data' => $validated]);
        
        if ($isAdmin && isset($validated['status']) && $validated['status'] === 'approved' && $compliance->status !== 'approved') {
            $validated['verified_by'] = $user->id;
            $validated['verified_at'] = now();
            Log::info('Setting verification info', ['verified_by' => $user->id]);
        }
        
        $compliance->update($validated);
        
        Log::info('Farm Compliance updated successfully', ['id' => $compliance->id]);
        
        $message = $isAdmin ? 'Farm compliance record updated successfully!' : 'Your farm compliance record has been updated!';
        
        return redirect()->route('farm-compliance.show', $compliance->id)
            ->with('success', $message);
            
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('Validation failed', ['errors' => $e->errors()]);
        return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
        Log::error('Update failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        return back()->with('error', 'Failed to update: ' . $e->getMessage())->withInput();
    }
}
    
    public function destroy(int $id): RedirectResponse
    {
        $compliance = FarmCompliance::findOrFail($id);
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        
        if (!$isAdmin) {
            if ($compliance->user_id !== $user->id) {
                abort(403, 'Unauthorized access');
            }
            
            if ($compliance->status === 'approved') {
                return back()->with('error', 'Approved records cannot be deleted. Please contact DA administrator.');
            }
        }
        
        $compliance->delete();
        
        $redirectRoute = $isAdmin ? route('admin.farm-compliances.index') : route('farmer.dashboard');
        
        return redirect($redirectRoute)
            ->with('success', 'Farm compliance record deleted successfully.');
    }
    
    public function index(): Response|RedirectResponse
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized access');
        }
        
        $compliances = FarmCompliance::with(['user', 'verifier'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return Inertia::render('admin/FarmComplianceList', [
            'compliances' => $compliances
        ]);
    }
}
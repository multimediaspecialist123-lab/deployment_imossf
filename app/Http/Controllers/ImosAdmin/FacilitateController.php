<?php 
// app/Http/Controllers/Admin/UserController.php

namespace App\Http\Controllers\ImosAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserInformation;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class FacilitateController extends Controller
{
public function index(Request $request)
{
    // Get logged-in user
    $authUser = auth()->user();

    // Base query with userInformation relationship
    $query = User::with(['userInformation', 'userInformation.barangay'])
                ->orderBy('created_at', 'desc');

    // Apply role filter if NOT admin
    if ($authUser->role !== 'admin') {
        $query->whereIn('role', ['farmer', 'buyer']);
    }

    // Get overall statistics BEFORE pagination
    $overallStats = [
        'total' => User::count(),
        'farmers' => User::where('role', 'farmer')->count(),
        'buyers' => User::where('role', 'buyer')->count(),
        'enforcers' => User::where('role', 'enforcer')->count(),
        'admins' => User::where('role', 'admin')->count(),
    ];

    $users = $query->paginate(10)
    ->through(function ($user) {
        $userInfo = $user->userInformation;
        $farmCompliance = $user->farmCompliance;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => optional($user->created_at)->format('M d, Y'),
            'barangay' => optional(optional($userInfo)->barangay)->name ?? 'N/A',
            'purok' => optional($userInfo)->purok ?? 'N/A',
            'firstname' => optional($userInfo)->firstname ?? '',
            'middlename' => optional($userInfo)->middlename ?? '',
            'lastname' => optional($userInfo)->lastname ?? '',
            'profile' => ($userInfo && $userInfo->profile_picture)
                ? asset('storage/' . $userInfo->profile_picture)
                : null,
            'farm_compliance' => $farmCompliance ? [
                'id' => $farmCompliance->id,
                'status' => $farmCompliance->status,
                'verified_at' => $farmCompliance->verified_at,
                'registration_number' => $farmCompliance->registration_number,
            ] : null,
        ];
    });

    return Inertia::render('admin/facilitate/users', [
        'users' => $users,
        'overallStats' => $overallStats, // Pass overall stats separately
    ]);
}



public function show($id)
{
    // Find the user by ID with all the necessary relationships
    $user = User::with([
        'userInformation.province',
        'userInformation.municipal',
        'userInformation.barangay',
        'swine',
        'livestockInsuranceApplications.animals'
    ])->findOrFail($id);

    $info = $user->userInformation;
    
    if (!$info) {
        return redirect()->back()->with('warning', 'This user doesn’t have profile information yet.');
    }

    // --- SWINE COLLECTION ---
    $swineCollection = $user->swine;

    // --- COUNT SWINE STATUS ---
    $statusCounts = [
        'active'    => $swineCollection->where('status', 'active')->count(),
        'available' => $swineCollection->where('status', 'available')->count(),
        'sold'      => $swineCollection->where('status', 'sold')->count(),
        'dead'      => $swineCollection->where('status', 'dead')->count(),
    ];

    // --- COUNT BY PURPOSE ---
    $purposeCounts = $swineCollection
        ->groupBy('purpose')
        ->map(fn($g) => $g->count())
        ->toArray();

    // --- COUNT BY CATEGORY ---
    $categoryCounts = [
        'barrow' => $swineCollection->where('category', 'barrow')->count(),
        'gilt'   => $swineCollection->where('category', 'gilt')->count(),
        'sow'    => $swineCollection->where('category', 'sow')->count(),
        'piglet' => $swineCollection->where('category', 'piglet')->count(),
        'boar'   => $swineCollection->where('category', 'boar')->count(),
    ];

    // --- UNIQUE BREEDS ---
    $uniqueBreeds = $swineCollection
        ->map(fn($s) => $s->custom_breed ?: ($s->breed ? $s->breed->name : null))
        ->filter()
        ->unique()
        ->values()
        ->all();

    // --- Transform swine for frontend table ---
   $swine = $swineCollection->map(function ($s) {
    $ageInDays = null;
    if ($s->birthdate) {
        // Ensure we're getting whole days and convert to integer
        $ageInDays = (int) Carbon::parse($s->birthdate)->diffInDays(Carbon::now());
    }
    return [
        'id' => $s->id,
        'category' => $s->category,
        'breed' => $s->breed ? $s->breed->name : null,
        'custom_breed' => $s->custom_breed,
        'age' => $ageInDays,
        'status' => $s->status,
        'purpose' => $s->purpose,
        'sex' => $s->sex,
        'description' => $s->description,
    ];
})->values()->all();

    // --- Prepare user data for frontend ---
    $data = [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'created_at' => $user->created_at->format('M d, Y'),
        'profile_picture' => ($info && $info->profile_picture)
            ? asset('storage/' . $info->profile_picture)
            : asset('default.png'),
        'firstname' => $info->firstname,
        'middlename' => $info->middlename,
        'lastname' => $info->lastname,
        'extension' => $info->extension,
        'contact' => $info->contact,
        'birthdate' => $info->birthdate,
        'gender' => $info->gender,
        'civil_status' => $info->civil_status,
        'occupation' => $info->occupation,
        'province' => optional($info->province)->name ?? 'N/A',
        'municipal' => optional($info->municipal)->name ?? 'N/A',
        'barangay' => optional($info->barangay)->name ?? 'N/A',
        'street' => $info->street ?? 'N/A',
        'purok' => $info->purok ?? 'N/A',
        'status' => $info->status ?? 'N/A',
        'purpose_counts' => $purposeCounts,
        'swine_count' => $swineCollection->count(),
        'status_counts' => $statusCounts,
        'category_counts' => $categoryCounts,
        'breeds' => $uniqueBreeds,
        'swine' => $swine,
    ];

    $applications = $user->livestockInsuranceApplications->map(fn($app) => [
        'id' => $app->id,
        'status' => $app->status,
        'cover_type' => $app->cover_type,
        'created_at' => $app->created_at->format('M d, Y'),
        'updated_at' => $app->updated_at->format('M d, Y'),
        'number_of_heads' => $app->number_of_heads,
        'animals' => $app->animals->map(fn($animal) => [
            'id' => $animal->id,
            'ear_mark' => $animal->ear_mark,
            'veterinary_report_id' => $animal->veterinary_report_id,
        ])
    ]);

    return Inertia::render('farmer/profile', [  // You might want to rename this view
        'user' => $data,
        'applications' => $applications
    ]);
}
public function farmershow()
{
    // Get the currently logged-in user
    $user = auth()->user()->load([
        'userInformation.province',
        'userInformation.municipal',
        'userInformation.barangay',
        'swine',
         'livestockInsuranceApplications.animals'
    ]);

    $info = $user->userInformation;
    
    if (!$info) {
        return redirect()->back()->with('warning', 'You don’t have profile information yet.');
    }

    // --- SWINE COLLECTION ---
    $swineCollection = $user->swine;

    // --- COUNT SWINE STATUS ---
    $statusCounts = [
        'active'    => $swineCollection->where('status', 'active')->count(),
        'available' => $swineCollection->where('status', 'available')->count(),
        'sold'      => $swineCollection->where('status', 'sold')->count(),
        'dead'      => $swineCollection->where('status', 'dead')->count(),
    ];

    // --- COUNT BY PURPOSE ---
    $purposeCounts = $swineCollection
        ->groupBy('purpose')
        ->map(fn($g) => $g->count())
        ->toArray();

    // --- COUNT BY CATEGORY ---
    $categoryCounts = [
        'barrow' => $swineCollection->where('category', 'barrow')->count(),
        'gilt'   => $swineCollection->where('category', 'gilt')->count(),
        'sow'    => $swineCollection->where('category', 'sow')->count(),
        'piglet' => $swineCollection->where('category', 'piglet')->count(),
        'boar'   => $swineCollection->where('category', 'boar')->count(),
    ];

    // --- UNIQUE BREEDS ---
    $uniqueBreeds = $swineCollection
        ->map(fn($s) => $s->custom_breed ?: $s->breed)
        ->filter()
        ->unique()
        ->values()
        ->all();

    // --- Transform swine for frontend table ---
 $swine = $swineCollection->map(function ($s) {
    $ageInDays = null;
    if ($s->birthdate) {
        // Ensure we're getting whole days and convert to integer
        $ageInDays = (int) Carbon::parse($s->birthdate)->diffInDays(Carbon::now());
    }
    return [
        'id' => $s->id,
        'category' => $s->category,
        'breed' => $s->breed ? $s->breed->name : null,
        'custom_breed' => $s->custom_breed,
        'age' => $ageInDays,
        'status' => $s->status,
        'purpose' => $s->purpose,
        'sex' => $s->sex,
        'description' => $s->description,
    ];
})->values()->all();

    // --- Prepare user data for frontend ---
    $data = [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'created_at' => $user->created_at->format('M d, Y'),
        'profile_picture' => ($info && $info->profile_picture)
            ? asset('storage/' . $info->profile_picture)
            : asset('default.png'),
        'firstname' => $info->firstname,
        'middlename' => $info->middlename,
        'lastname' => $info->lastname,
        'extension' => $info->extension,
        'contact' => $info->contact,
        'birthdate' => $info->birthdate,
        'gender' => $info->gender,
        'civil_status' => $info->civil_status,
        'occupation' => $info->occupation,
        'province' => optional($info->province)->name ?? 'N/A',
        'municipal' => optional($info->municipal)->name ?? 'N/A',
        'barangay' => optional($info->barangay)->name ?? 'N/A',
        'street' => $info->street ?? 'N/A',
        'purok' => $info->purok ?? 'N/A',
        'status' => $info->status ?? 'N/A',
        'purpose_counts' => $purposeCounts,
        'swine_count' => $swineCollection->count(),
        'status_counts' => $statusCounts,
        'category_counts' => $categoryCounts,
        'breeds' => $uniqueBreeds,
        'swine' => $swine,
    ];

      $applications = $user->livestockInsuranceApplications->map(fn($app) => [
        'id' => $app->id,
           'status' => $app->status, // ✅ ADD THIS
        'cover_type' => $app->cover_type,
        'created_at' => $app->created_at->format('M d, Y'),
        'updated_at' => $app->updated_at->format('M d, Y'),
        'number_of_heads' => $app->number_of_heads,
        'animals' => $app->animals->map(fn($animal) => [
            'id' => $animal->id,
            'ear_mark' => $animal->ear_mark,
            'veterinary_report_id' => $animal->veterinary_report_id,
        ])
    ]);

    return Inertia::render('farmer/profile', [
        'user' => $data,
        'applications' => $applications
    ]);
}


// Show create user page
   public function createUser()
{
    return Inertia::render('admin/facilitate/create_user', [
        'authRole' => auth()->user()->role
    ]);
}

public function store(Request $request)
{
    $authUser = auth()->user();

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6|confirmed',
        'role' => ['required', Rule::in(['admin','farmer','buyer','enforcer'])],
        'firstname' => 'required|string',
        'lastname' => 'required|string',
        'barangay_id' => 'nullable|exists:barangays,id',
        'purok' => 'nullable|string|max:50',
    ]);

    /**
     * 🔒 SECURITY CHECK:
     * If NOT admin, block creation of admin accounts
     */
    if ($authUser->role !== 'admin' && $validated['role'] === 'admin') {
        return back()->withErrors(['role' => 'You are not allowed to assign the admin role.']);
    }

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
    ]);

    $user->userInformation()->create([
        'firstname' => $validated['firstname'],
        'lastname' => $validated['lastname'],
        'middlename' => $request->middlename,
        'barangay_id' => $validated['barangay_id'] ?? null,
        'purok' => $validated['purok'] ?? null,
    ]);

    return redirect()
        ->route('facilitate.users.index')
        ->with('success', 'User created successfully.');
}


  // Show edit user page
public function editUser($id)
{
    $authUser = auth()->user();

    // Find the user or fail
    $user = User::with(['userInformation.province', 'userInformation.municipal', 'userInformation.barangay'])
        ->findOrFail($id);

    // 🔒 Security check: Non-admins cannot edit admin or enforcer users
    if ($authUser->role !== 'admin' && in_array($user->role, ['admin', 'enforcer'])) {
        abort(403, 'You are not authorized to edit this user.');
    }

    $data = [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
         'email_verified_at' => $user->email_verified_at, // ✅ ADD THIS
        'userInformation' => [
            'firstname' => optional($user->userInformation)->firstname ?? '',
            'middlename' => optional($user->userInformation)->middlename ?? '',
            'lastname' => optional($user->userInformation)->lastname ?? '',
            'purok' => optional($user->userInformation)->purok ?? '',
            'province_id' => optional($user->userInformation)->province_id ?? '',
            'province_name' => optional(optional($user->userInformation)->province)->name ?? '',
            'municipal_id' => optional($user->userInformation)->municipal_id ?? '',
            'municipal_name' => optional(optional($user->userInformation)->municipal)->name ?? '',
            'barangay_id' => optional($user->userInformation)->barangay_id ?? '',
            'barangay_name' => optional(optional($user->userInformation)->barangay)->name ?? '',
        ],
    ];

    return Inertia::render('admin/facilitate/edit_user', [
        'user' => $data,
        'authRole' => $authUser->role, // send role to frontend
    ]);
}




  public function updateUser(Request $request, $id)
{
    $authUser = auth()->user();
    $user = User::findOrFail($id);

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => ['required','email', Rule::unique('users')->ignore($user->id)],
        'email_verified' => 'required|boolean',
        'password' => 'nullable|string|min:6|confirmed',
        'role' => ['nullable', Rule::in(['admin','farmer','buyer','enforcer'])],
        'firstname' => 'nullable|string',
        'lastname' => 'nullable|string',
        'middlename' => 'nullable|string',
        'description' => 'nullable|string|max:500', // Add description validation
        'barangay_id' => 'nullable|exists:barangays,id',
        'purok' => 'nullable|string|max:50',
    ]);

    // Prevent non-admin from updating role to 'admin'
    if ($authUser->role !== 'admin' && $validated['role'] === 'admin') {
        return back()->withErrors(['role' => 'You are not allowed to assign the Admin role.']);
    }

    $user->update([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'role' => $validated['role'],
        'password' => $validated['password'] ? Hash::make($validated['password']) : $user->password,
        'email_verified_at' => $validated['email_verified']
            ? ($user->email_verified_at ?? now())
            : null,
    ]);

    $user->userInformation()->update([
        'firstname' => $validated['firstname'],
        'lastname' => $validated['lastname'],
        'middlename' => $validated['middlename'] ?? null,
        'description' => $validated['description'] ?? null, // Add description
        'barangay_id' => $validated['barangay_id'] ?? null,
        'purok' => $validated['purok'] ?? null,
    ]);

    return redirect()->route('facilitate.users.index')->with('success', 'User updated successfully.');
}


}

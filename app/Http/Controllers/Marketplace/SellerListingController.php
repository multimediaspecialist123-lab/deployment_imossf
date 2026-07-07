<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\FarmerRating;
use App\Models\ImosNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Marketplace\MarketplaceListing;
use App\Models\Marketplace\ListingSwine;
use App\Models\Swine\Swine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Marketplace\MarketplaceTransaction;
use App\Models\Marketplace\SwineRequest;
use App\Models\SwineExpense;
use App\Models\Marketplace\Notification;
use App\Models\PriceControl;
use App\Models\VetmedClearance;
use Carbon\Carbon;

class SellerListingController extends Controller
{


    // Display seller listings
public function index(Request $request)
{
    $user = $request->user();

    // ✅ Properly eager load user location relations
    $user->load([
        'userInformation.barangay',
        'userInformation.municipal',
        'userInformation.province',
    ]);

    $userInfo = $user->userInformation;

    // ✅ Get seller's rating information
    $averageRating = FarmerRating::getFarmerAverageRating($user->id);
    $totalRatings = FarmerRating::where('farmer_id', $user->id)->count();
    $formattedRating = FarmerRating::getFormattedRating($user->id);
    
    // Get rating distribution
    $ratingDistribution = FarmerRating::getRatingDistribution($user->id);

    // ✅ Dedicated Seller Profile (NO dependency on listings)
    $sellerProfile = [
        'name' => collect([
            $userInfo?->firstname,
            $userInfo?->middlename,
            $userInfo?->lastname,
        ])->filter()->join(' '),

        'contact' => $userInfo?->contact,

        'profile_image' => $userInfo?->profile_picture
            ? asset('storage/' . $userInfo->profile_picture)
            : asset('images/default-profile.png'),

        'location' => collect([
            $userInfo?->street,
            $userInfo?->purok ? 'Purok ' . $userInfo->purok : null,
            optional($userInfo?->barangay)->name,
            optional($userInfo?->municipal)->name,
            optional($userInfo?->province)->name,
        ])->filter()->join(', '),
        
        // Add rating information
        'average_rating' => $averageRating,
        'total_ratings' => $totalRatings,
        'formatted_rating' => $formattedRating,
        'rating_distribution' => $ratingDistribution,
    ];

    $profileImage = $sellerProfile['profile_image'];

    $search = $request->input('search', '');
    $status = $request->input('status', '');
    $requestType = $request->input('request', '');

    // =============================
    // Transactions
    // =============================
    $transactions = MarketplaceTransaction::with(['buyer', 'swineRequest', 'listing'])
        ->where('seller_id', $user->id)
        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('buyer', function ($qb) use ($search) {
                    $qb->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('swineRequest', function ($qb) use ($search) {
                    $qb->where('type', 'like', "%{$search}%")
                        ->orWhere('contact', 'like', "%{$search}%");
                })
                ->orWhere('state', 'like', "%{$search}%");
            });
        })
        ->when($status, fn ($query, $status) => $query->where('state', $status))
        ->when($requestType, function ($query, $requestType) {
            $query->whereHas('swineRequest', function ($q) use ($requestType) {
                $q->where('type', $requestType);
            });
        })
        ->orderBy('updated_at', 'desc')
        ->paginate(15)
        ->withQueryString();

    // Format transaction data
    $transactions->setCollection(
        $transactions->getCollection()->map(function ($tx) {

            $firstRequest = $tx->swineRequest->first();
            $formattedStatus = ucwords(str_replace('_', ' ', $tx->state));

            $offerAmount = $firstRequest?->offer_amount ?? null;
            $displayAmount = $offerAmount ?: $tx->price_per_unit ?: $tx->amount;
            $isOffer = !empty($offerAmount);

            $priceType = $tx->listing?->price_unit_type ?? null;
            $priceLabel = $priceType ? " {$priceType}" : "per head";

            return [
                'transaction_id' => $tx->id,
                'listing_id' => $tx->listing_id,
                'buyer_name' => $tx->buyer?->name ?? 'N/A',
                'contact' => $firstRequest?->contact ?? 'N/A',
                'request' => $firstRequest?->type ?? 'N/A',
                'quantity' => $tx->quantity,
                'amount' => $displayAmount,
                'price_label' => $priceLabel,
                'is_offer' => $isOffer,
                'status' => $formattedStatus,
                'raw_status' => $tx->state,
                'transaction_date' => $tx->transaction_date->format('Y-m-d'),
                'transaction_date_md' => $tx->updated_at->format('M d'),
                'seller_id' => $tx->seller_id,
                'email' => $tx->buyer?->email ?? 'N/A',
                'address' => $firstRequest?->address ?? 'N/A',
            ];
        })
    );

    // =============================
    // Listings
    // =============================
    $listings = MarketplaceListing::with([
        'listingSwine.swine',
        'province:id,name',
        'municipal:id,name',
        'barangay:id,name',
    ])
    ->where('seller_id', $user->id)
    ->orderByDesc('created_at')
    ->get();

    // Transform to include all needed data
    $formattedListings = $listings->map(function ($listing) {
        // Format address
        $listing->full_address = collect([
            $listing->street,
            $listing->purok ? 'Purok ' . $listing->purok : null,
            optional($listing->barangay)->name,
            optional($listing->municipal)->name,
            optional($listing->province)->name,
        ])->filter()->join(', ');
        
        // Format listing_swine with all needed data
        $listing->listing_swine = $listing->listingSwine->map(function($listingSwine) {
            $swine = $listingSwine->swine;
            
            $age = null;
            if ($swine && $swine->birthdate) {
                $ageInDays = now()->diffInDays($swine->birthdate);
                $age = round($ageInDays / 30, 1) . ' mo';
            }
            
            return [
                'id' => $listingSwine->id,
                'tag_number' => $swine?->tag_number ?? null,
                'breed' => $listingSwine->breed ?? $swine?->breed_name ?? null,
                'age' => $age,
                'sex' => $listingSwine->sex ?? $swine?->sex ?? null,
                'weight' => $listingSwine->scaled_weight ?? $listingSwine->estimated_weight ?? $swine?->weight ?? null,
                'status' => $listingSwine->status,
            ];
        })->toArray();
        
        unset($listing->listingSwine);
        
        return $listing;
    });

    // =============================
    // Overview Counts
    // =============================
    $totalBuyRequests = SwineRequest::whereHas('listingSwine', function ($q) use ($user) {
        $q->where('seller_id', $user->id);
    })->where('type', 'purchase')->count();

    $totalReservationRequests = SwineRequest::whereHas('listingSwine', function ($q) use ($user) {
        $q->where('seller_id', $user->id);
    })->where('type', 'reservation')->count();

    $totalListingSwine = ListingSwine::whereHas('listing', function ($q) use ($user) {
        $q->where('seller_id', $user->id);
    })->count();

    // =============================
    // Return
    // =============================
    return Inertia::render('marketplace/seller/index', [
        'listings' => $formattedListings,
        'requests' => $transactions,
        'overview' => [
            'total_buy' => $totalBuyRequests,
            'total_reserve' => $totalReservationRequests,
            'total_swine' => $totalListingSwine,
        ],
        'seller_profile' => $sellerProfile,
        'user_profile_image' => $profileImage,
    ]);
}


    // In your SellerListingController.php

// In your SellerListingController.php


public function create(Request $request)
{
    $user = $request->user();

    $availableSwine = Swine::where('owner_id', $user->id)
        ->where('status', 'active')
        ->doesntHave('listings')
        ->get();

    // Fetch existing VetmedClearances for this user
    $vetmedClearances = VetmedClearance::where('user_id', $user->id)
        ->where(function($q) {
            $q->whereNull('expiry_date')
              ->orWhere('expiry_date', '>=', now());
        })
        ->orderBy('updated_at', 'desc')
        ->get(['id', 'clearance_number', 'updated_at', 'issue_date', 'expiry_date']);

    // Get the latest clearance ID (first item from ordered collection)
    $latestClearanceId = $vetmedClearances->isNotEmpty() ? $vetmedClearances->first()->id : null;

    // Get price control data
    $priceControls = PriceControl::getPriceOptions();

    return Inertia::render('marketplace/seller/create', [
        'availableSwine' => $availableSwine,
        'selectedSwineIds' => $request->query('swine_ids', []),
        'vetmedClearances' => $vetmedClearances,
        'latestClearanceId' => $latestClearanceId,
        'priceControls' => $priceControls, // Add this
        'authUser' => [
            'id' => $user->id,
            'role' => $user->role,
        ],
    ]);
}


public function getSwineTotalExpenses(Request $request)
{
    $request->validate([
        'swine_ids' => 'required|array',
        'swine_ids.*' => 'exists:swine,id'
    ]);

    $totalExpenses = SwineExpense::whereIn('swine_id', $request->swine_ids)
        ->sum('individual_share');

    return response()->json([
        'total_expenses' => $totalExpenses,
        'formatted' => '₱' . number_format($totalExpenses, 2)
    ]);
}

    // Store new listing
   // In your SellerListingController.php

public function store(Request $request)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'category' => 'required|in:breeder,piglet,fattening',
        'price_per_unit' => 'required|numeric|min:0',
        'price_unit_type' => 'required|in:per_head,per_kg',
        'swine_ids' => 'required|array|min:1',
        'swine_ids.*' => 'exists:swine,id',
        'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        'images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        'vetmed_clearance_id' => 'nullable|exists:vetmed_clearances,id', // ✅ Add validation
    ]);

    DB::transaction(function () use ($request) {
        $user = $request->user();

        // Handle thumbnail image
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('listings', 'public');
        }

        // Get user address
        $address = \App\Models\Marketplace\MarketplaceListing::assignAddressFromUser($user);

        // Create marketplace listing with vetmed_clearance_id
        $listing = MarketplaceListing::create(array_merge([
            'seller_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'price_per_unit' => $request->price_per_unit,
            'price_unit_type' => $request->price_unit_type,
            'available_quantity' => count($request->swine_ids),
            'image' => $imagePath,
            'vetmed_clearance_id' => $request->vetmed_clearance_id, // ✅ Add this line
        ], $address));

        // Save gallery images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $path = $img->store('listings', 'public');
                \App\Models\Marketplace\ListingPhoto::create([
                    'listing_id' => $listing->id,
                    'path' => $path,
                ]);
            }
        }

        // Attach swine to listing and update status
        foreach ($request->swine_ids as $swineId) {
            $swine = Swine::findOrFail($swineId);

            // Create listing_swine record
            $listingSwine = ListingSwine::create([
                'listing_id' => $listing->id,
                'swine_id' => $swine->id,
                'seller_id' => $user->id,
                'status' => 'available',
            ]);

            $listingSwine->syncFromSwine();

            // Update original swine status
            $swine->update([
                'status' => 'available',
            ]);
        }

        // Update aggregate attributes
        $listing->syncAggregateAttributes();
        
        // Optional: Update the clearance to link back to this listing
        if ($request->vetmed_clearance_id) {
            $clearance = VetmedClearance::find($request->vetmed_clearance_id);
            if ($clearance) {
                $clearance->update([
                    'marketplace_listing_id' => $listing->id
                ]);
            }
        }
    });

    // Redirect or return response
    return redirect()->route('marketplace.seller.index')
        ->with('success', 'Listing created successfully!');
}


    // 🧩 Edit existing listing
   public function edit(Request $request, $id)
{
    $user = $request->user();
    $listing = MarketplaceListing::with([
        'province', 
        'municipal', 
        'barangay',
        'listingSwine', 
        'seller.userInformation', 
        'photos',
        'vetmedClearance' // Add this to load vetmed clearance
    ])
    ->where('seller_id', $user->id)
    ->where('id', $id)
    ->firstOrFail();

    // Then map photos to paths
    $listing->gallery_images = $listing->photos->map(fn($p) => $p->path)->toArray();
    $listing->gallery_image_ids = $listing->photos->pluck('id')->toArray();

    // Combine full address
    $listing->full_address = collect([
        $listing->street,
        $listing->purok,
        optional($listing->barangay)->name,
        optional($listing->municipal)->name,
        optional($listing->province)->name,
    ])->filter()->join(', ');

    // Swine owned by seller but not yet listed OR already in this listing
    $userId = $listing->seller_id;
    $availableSwine = Swine::where('owner_id', $userId)
        ->where('status', 'active')
        ->get();

    return Inertia::render('marketplace/seller/edit', [
        'listing' => $listing->load(['listingSwine']),
        'availableSwine' => $availableSwine,
        'vetmedClearance' => $listing->vetmedClearance, // Pass the vetmed clearance
    ]);
}

  public function update(Request $request, $id)
{
    $listing = MarketplaceListing::with('listingSwine')->findOrFail($id);

    if ($listing->seller_id !== $request->user()->id) {
        abort(403, 'Unauthorized');
    }

    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'category' => 'required|in:breeder,piglet,fattening',
        'price_per_unit' => 'required|numeric|min:0',
        'price_unit_type' => 'required|in:per_head,per_kg',
        'description' => 'nullable|string',
        'swine_ids' => 'nullable|array',
        'swine_ids.*' => 'exists:swine,id',
    ]);

    DB::transaction(function () use ($listing, $validated) {
        // Update the listing core info
        $listing->update([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'price_per_unit' => $validated['price_per_unit'],
            'price_unit_type' => $validated['price_unit_type'],
            'description' => $validated['description'] ?? null,
        ]);

        // ✅ Add new swine to the listing (append-only)
        if (!empty($validated['swine_ids'])) {
            $currentSwineIds = $listing->listingSwine->pluck('swine_id')->toArray();
            $newSwineIds = array_diff($validated['swine_ids'], $currentSwineIds);

            foreach ($newSwineIds as $swineId) {
                $listing->listingSwine()->create([
                    'swine_id' => $swineId,
                    'seller_id' => $listing->seller_id,
                    'status' => 'available',
                ]);

                // 🔄 Update the swine's status in swine table
                Swine::where('id', $swineId)->update(['status' => 'available']);
            }
        }

        // 🧠 Do NOT auto-remove anything here; handled manually via a separate "remove" action

        if (method_exists($listing, 'syncAggregateAttributes')) {
            $listing->syncAggregateAttributes();
        }
    });
    
    return redirect()->route('marketplace.seller.edit', $listing->id)
                     ->with('success', 'Listing updated successfully.');
}





// 🧩 Delete a listing (only owner)
public function destroy(Request $request, $id)
{
    $user = $request->user(); // This is the SELLER (actor)

    $listing = MarketplaceListing::where('id', $id)
        ->where('seller_id', $user->id)
        ->firstOrFail();

    DB::transaction(function () use ($listing, $user) {
        
        // 1️⃣ Handle all transactions related to this listing
        $transactions = MarketplaceTransaction::where('listing_id', $listing->id)->get();
        
        foreach ($transactions as $transaction) {
            // Update transaction state based on current state
            if (in_array($transaction->state, [
                'pending_request', 
                'seller_review', 
                'seller_approved', 
                'buyer_confirmed', 
                'in_progress'
            ])) {
                // Active transactions become 'listing_deleted'
                $transaction->update([
                    'state' => 'listing_deleted'
                ]);

                // ✅ NOTIFICATION FOR BUYER (user_id = buyer, actor_id = seller)
                ImosNotification::create([
                    'user_id'   => $transaction->buyer_id,  // 👈 RECEIVER: Buyer gets email
                    'actor_id'  => $user->id,               // 👈 ACTOR: Seller triggered it
                    'type'      => 'marketplace',
                    'action'    => 'listing_deleted',
                    'message'   => "The listing '{$listing->title}' has been removed. Your transaction has been marked as 'Listing Deleted'.",
                    'url'       => route('marketplace.buyer.transaction.setup', $transaction->id),
                ]);

                // Free up any reserved swine
                ListingSwine::where('listing_id', $listing->id)
                    ->where('reserved_by', $transaction->buyer_id)
                    ->update([
                        'status' => 'available',
                        'reserved_by' => null,
                        'reservation_expires_at' => null,
                    ]);
            }
            elseif ($transaction->state === 'completed') {
                // ✅ NOTIFICATION FOR BUYER (completed transaction)
                ImosNotification::create([
                    'user_id'   => $transaction->buyer_id,  // 👈 RECEIVER: Buyer
                    'actor_id'  => $user->id,               // 👈 ACTOR: Seller
                    'type'      => 'marketplace',
                    'action'    => 'listing_removed',
                    'message'   => "The listing '{$listing->title}' you purchased has been removed by the seller.",
                    'url'       => route('marketplace.buyer.transaction.setup', $transaction->id),
                ]);
            }
            // For cancelled, expired - no action needed
        }

        // 2️⃣ Get swine IDs linked to this listing
        $swineIds = ListingSwine::where('listing_id', $listing->id)
            ->pluck('swine_id');

        // 3️⃣ Restore swine back to ACTIVE
        Swine::whereIn('id', $swineIds)
            ->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

        // 4️⃣ Delete pivot records
        ListingSwine::where('listing_id', $listing->id)->delete();

        // 5️⃣ Optional: Notify SELLER that listing was deleted successfully
        // (seller is both user_id AND actor_id since they're notifying themselves)
        ImosNotification::create([
            'user_id'   => $user->id,        // 👈 RECEIVER: Seller (themselves)
            'actor_id'  => $user->id,        // 👈 ACTOR: Also seller
            'type'      => 'marketplace',
            'action'    => 'listing_deleted',
            'message'   => "Your listing '{$listing->title}' has been successfully removed.",
            'url'       => route('marketplace.seller.index'),
        ]);

        // 6️⃣ Soft delete listing
        $listing->delete();
    });

    return redirect()
        ->route('marketplace.seller.index')
        ->with('success', 'Listing removed, transactions updated, and swine restored to active.');
}


public function removeSwine($listingId, $swineId)
{
    $listing = MarketplaceListing::findOrFail($listingId);
    $swine = Swine::findOrFail($swineId);

    // Ensure ownership
    if ($listing->seller_id !== auth()->id() || $swine->owner_id !== auth()->id()) {
        abort(403, 'Unauthorized');
    }

    // ✅ Use model instance so deleted event fires
    $listingSwine = $listing->listingSwine()->where('swine_id', $swineId)->first();

    if ($listingSwine) {
        $listingSwine->delete(); // This triggers booted() deleted() event
    }

    // Restore swine to active status
    $swine->update(['status' => 'active']);

    return back()->with('success', 'Swine removed from listing.');
}


public function updateImage(Request $request, $id)
{
    $listing = MarketplaceListing::findOrFail($id);

    if ($listing->seller_id !== $request->user()->id) {
        abort(403, 'Unauthorized');
    }

    $request->validate([
        'image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
    ]);

    // Delete old image if exists
    if ($listing->image && Storage::disk('public')->exists($listing->image)) {
        Storage::disk('public')->delete($listing->image);
    }

    // Store new image in the same folder as listing_photos
    $path = $request->file('image')->store('listings', 'public');
    $listing->update(['image' => $path]);

    return back()->with('success', 'Thumbnail image updated successfully!');
}


public function addGalleryImages(Request $request, $id)
{
    $listing = MarketplaceListing::findOrFail($id);

    if ($listing->seller_id !== $request->user()->id) {
        abort(403, 'Unauthorized');
    }

    $request->validate([
        'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
    ]);

    DB::transaction(function () use ($listing, $request) {
        foreach ($request->file('images', []) as $img) {
            $filename = 'gallery_' . uniqid() . '.' . $img->getClientOriginalExtension();
            $path = $img->storeAs('listings', $filename, 'public');

            \App\Models\Marketplace\ListingPhoto::create([
                'listing_id' => $listing->id,
                'path' => $path,
            ]);
        }
    });

    return back()->with('success', 'Gallery images added successfully.');
}


public function deleteGalleryImage($listingId, $photoId)
{
    $listing = MarketplaceListing::findOrFail($listingId);
    $photo = \App\Models\Marketplace\ListingPhoto::findOrFail($photoId);

    if ($listing->seller_id !== auth()->id() || $photo->listing_id !== $listing->id) {
        abort(403, 'Unauthorized');
    }

    if (Storage::disk('public')->exists($photo->path)) {
        Storage::disk('public')->delete($photo->path);
    }

    $photo->delete();

    return back()->with('success', 'Gallery image removed.');
}

public function requests(Request $request)
{
    $user = $request->user();

    $transactions = MarketplaceTransaction::with(['buyer', 'swineRequest'])
        ->where('seller_id', $user->id)
        ->orderByDesc('transaction_date')
        ->get();

    $data = $transactions->map(function ($tx, $index) {
        $firstRequest = $tx->swineRequest->first();

        // Format status (remove underscores, capitalize each word)
        $formattedStatus = ucwords(str_replace('_', ' ', $tx->state));

        return [
            'no' => $index + 1,
            'transaction_id' => $tx->id,
            'buyer_name' => $tx->buyer?->name ?? 'N/A',
            'contact' => $firstRequest?->contact ?? 'N/A',
            'request' => $firstRequest?->type ?? 'N/A',
            'quantity' => $tx->quantity,
            'amount' => $tx->amount,
            'status' => $formattedStatus, // formatted label
            'raw_status' => $tx->state,    // for color
            'transaction_date' => $tx->transaction_date->format('Y-m-d'), // only date
        ];
    });

    return Inertia::render('marketplace/seller/requests', [
        'requests' => $data
    ]);
}




public function findBySwine($swineId)
{
    $listing = MarketplaceListing::whereHas('swine', function($query) use ($swineId) {
        $query->where('swine_id', $swineId);
    })->first();

    if (!$listing) {
        return response()->json([
            'success' => false,
            'message' => 'No listing found for this swine.'
        ], 404);
    }

    return response()->json([
        'success' => true,
        'listing_id' => $listing->id
    ]);
}

}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Swine\SwineGroup;
use Illuminate\Support\Facades\DB;
use App\Models\Swine\Swine;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    /** Display all expenses for the authenticated user */
    // public function index()
    // {
    //     $expenses = Expense::with(['swine', 'group.members'])
    //         ->where('owner_id', auth()->id())
    //         ->latest()
    //         ->paginate(10);

    //     return Inertia::render('expenses/index', [
    //         'expenses' => $expenses
    //     ]);
    // }
public function index(Request $request) 
{
    $user = Auth::user();


 $swineFinalAmount = \App\Models\Marketplace\SwineRequest::query()
    ->select([
        'listing_swine.swine_id',
        'swine_requests.final_amount',
    ])
    ->join('listing_swine', 'swine_requests.listing_swine_id', '=', 'listing_swine.id')
    ->join('marketplace_transactions', 'swine_requests.transaction_id', '=', 'marketplace_transactions.id')
    ->orderByDesc('swine_requests.id')
    ->get()
    ->unique('swine_id')
    ->pluck('final_amount', 'swine_id');   // 🔥 THIS IS THE MISSING PIECE

    $expenses = Expense::with('swineExpenses')
        ->where('owner_id', $user->id)
        ->latest()
        ->get()
        ->map(function ($expense) {
            $expense->swine_ids = $expense->swineExpenses
                ->pluck('swine_id')
                ->toArray();
            return $expense;
        });

          // Get total expense per swine (sum of individual_share)
$swineExpenseTotals = \App\Models\SwineExpense::select(
        'swine_id',
        DB::raw('SUM(individual_share) as total_expense')
    )
    ->groupBy('swine_id')
    ->pluck('total_expense', 'swine_id'); 
    // returns: [swine_id => total]
    
    // Only get groups that belong to the user
 $groups = SwineGroup::where('owner_id', $user->id)
    ->with(['swine' => function ($query) use ($user) {
        $query->where('owner_id', $user->id);
    }])
    ->get()
    ->map(function ($group) use ($swineExpenseTotals, $swineFinalAmount) {
        $group->swine = $group->swine->map(function ($s) use ($swineExpenseTotals, $swineFinalAmount) {
            $s->total_expense = $swineExpenseTotals[$s->id] ?? 0;
            $s->final_amount = $swineFinalAmount[$s->id] ?? 0;

            return $s;
        });
        return $group;
    });

          
    
  $swine = Swine::where('owner_id', $user->id)
    ->get()
    ->map(function ($s) use ($swineExpenseTotals, $swineFinalAmount) {
        $s->total_expense = $swineExpenseTotals[$s->id] ?? 0;

        // THIS is your single final amount
        $s->final_amount = $swineFinalAmount[$s->id] ?? 0;

        return $s;
    });

    $totalExpenses = Expense::where('owner_id', $user->id)->sum('amount');
    $categoryBreakdown = Expense::where('owner_id', $user->id)
        ->select('category', DB::raw('SUM(amount) as total'))
        ->groupBy('category')
        ->get()
        ->map(function ($item) use ($totalExpenses) {
            $item->percentage = $totalExpenses > 0 ? round(($item->total / $totalExpenses) * 100, 2) : 0;
            return $item;
        });

    $latestExpenses = Expense::where('owner_id', $user->id)
        ->latest()
        ->take(5)
        ->get(['category', 'description', 'quantity', 'unit', 'amount', 'date']);

    // Get the selected expense if provided
    $selectedExpenseId = $request->input('expense_id');
    $selectedExpense = null;

    if ($selectedExpenseId) {
        $selectedExpense = Expense::with('swineExpenses.swine')
            ->where('owner_id', $user->id)
            ->find($selectedExpenseId);

        if ($selectedExpense) {
            $selectedExpense->swine_ids = $selectedExpense->swineExpenses
                ->pluck('swine_id')
                ->toArray();
        }
    }



    return Inertia::render('expenses/index', [
        'expenses' => $expenses,
        'groups' => $groups,
        'swine' => $swine,
        'summary' => [
            'total' => $totalExpenses,
            'breakdown' => $categoryBreakdown,
            'latest' => $latestExpenses,
        ],
        'selected_group_id' => $request->input('group_id'),
        'selected_swine_ids' => $request->input('swine_ids', []),
        'selected_expense' => $selectedExpense,
    ]);
}

public function store(ExpenseRequest $request)
{
    try {
        $userId = auth()->id();
        
        \Illuminate\Support\Facades\Log::info('Store Expense - Request Data:', $request->all());
        
        $validated = $request->validated();
        
        $selectedSwineIds = $validated['swine_ids'] ?? [];
        $groupId = $validated['group_id'] ?? $request->input('group_id');
        
        // Ensure group_id is properly set
        if ($groupId === 'null' || $groupId === 'none' || $groupId === '') {
            $groupId = null;
        }
        
        if ($groupId) {
            $groupId = (int) $groupId;
        }
        
        // Filter out sold swine
        $filteredOutCount = 0;
        if (!empty($selectedSwineIds)) {
            $activeSwineIds = \App\Models\Swine\Swine::where('owner_id', $userId)
                ->whereIn('id', $selectedSwineIds)
                ->where('status', '!=', 'sold')
                ->pluck('id')
                ->toArray();
            
            $filteredOutCount = count($selectedSwineIds) - count($activeSwineIds);
            $selectedSwineIds = $activeSwineIds;
        }
        
        \Illuminate\Support\Facades\Log::info('Store Expense - Final Group ID:', ['group_id' => $groupId]);
        \Illuminate\Support\Facades\Log::info('Store Expense - Selected Swine IDs (active only):', ['swine_ids' => $selectedSwineIds]);
        
        // Validate that selected swine belong to the group if group is specified
        if ($groupId && !empty($selectedSwineIds)) {
            $group = \App\Models\Swine\SwineGroup::find($groupId);
            if (!$group) {
                return redirect()->back()->withErrors(['error' => 'Selected group does not exist.']);
            }
            
            $groupSwineIds = $group->swine()
                ->where('swine.owner_id', $userId)
                ->where('swine.status', '!=', 'sold')
                ->pluck('swine.id')
                ->toArray();
            
            $invalidSwine = array_diff($selectedSwineIds, $groupSwineIds);
            if (!empty($invalidSwine)) {
                return redirect()->back()->withErrors([
                    'error' => 'Some selected swine do not belong to the selected group.'
                ]);
            }
        }
        
        // Validate that all swine IDs belong to the user and are not sold
        if (!empty($selectedSwineIds)) {
            $validSwineIds = \App\Models\Swine\Swine::where('owner_id', $userId)
                ->whereIn('id', $selectedSwineIds)
                ->where('status', '!=', 'sold')
                ->pluck('id')
                ->toArray();
            
            if (count($validSwineIds) !== count($selectedSwineIds)) {
                return redirect()->back()->withErrors([
                    'error' => 'Some swine IDs are invalid, do not belong to you, or are sold.'
                ]);
            }
            $selectedSwineIds = $validSwineIds;
        }
        
        // Check if there are any active swine to assign expenses to
        if (empty($selectedSwineIds)) {
            $errorMessage = 'Cannot add expense: No active swine selected.';
            if ($filteredOutCount > 0) {
                $errorMessage .= ' ' . $filteredOutCount . ' sold swine(s) were excluded.';
            }
            return redirect()->back()->withErrors(['error' => $errorMessage]);
        }
        
        // Create the expense data array
        $expenseData = [
            'owner_id' => $userId,
            'swine_group_id' => $groupId,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'quantity' => $validated['quantity'] ?? null,
            'unit' => $validated['unit'] ?? null,
            'amount' => $validated['amount'],
            'date' => $validated['date'],
        ];
        
        \Illuminate\Support\Facades\Log::info('Store Expense - Creating expense with data:', $expenseData);
        
        // Create the expense
        $expense = \App\Models\Expense::create($expenseData);
        
        \Illuminate\Support\Facades\Log::info('Store Expense - Created expense:', $expense->toArray());
        
        // Assign to selected swines (only active ones)
        if (!empty($selectedSwineIds)) {
            $share = $validated['amount'] / count($selectedSwineIds);
            
            $swineExpenses = collect($selectedSwineIds)->map(fn($id) => [
                'expense_id' => $expense->id,
                'swine_id' => $id,
                'individual_share' => $share,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();
            
            \App\Models\SwineExpense::insert($swineExpenses);
            
            \Illuminate\Support\Facades\Log::info('Store Expense - Created swine expenses for IDs:', $selectedSwineIds);
        }
        
        $successMessage = 'Expense recorded successfully!';
        if ($filteredOutCount > 0) {
            $successMessage .= ' ' . $filteredOutCount . ' sold swine(s) were excluded from expense sharing.';
        }
        
        return redirect()->back()->with('success', $successMessage);
        
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Store Expense Error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return redirect()->back()->withErrors(['error' => 'Failed to save expense: ' . $e->getMessage()]);
    }
}

public function update(ExpenseRequest $request, Expense $expense)
{
    try {
        $userId = auth()->id();
        
        \Illuminate\Support\Facades\Log::info('Update Expense - Request Data:', $request->all());
        
        $validated = $request->validated();
        
        $swineIds = $validated['swine_ids'] ?? [];
        $groupId = $validated['group_id'] ?? $request->input('group_id');
        
        // Ensure group_id is properly set
        if ($groupId === 'null' || $groupId === 'none' || $groupId === '') {
            $groupId = null;
        }
        
        if ($groupId) {
            $groupId = (int) $groupId;
        }
        
        // Filter out sold swine
        $filteredOutCount = 0;
        if (!empty($swineIds)) {
            $activeSwineIds = \App\Models\Swine\Swine::where('owner_id', $userId)
                ->whereIn('id', $swineIds)
                ->where('status', '!=', 'sold')
                ->pluck('id')
                ->toArray();
            
            $filteredOutCount = count($swineIds) - count($activeSwineIds);
            $swineIds = $activeSwineIds;
        }
        
        \Illuminate\Support\Facades\Log::info('Update Expense - Final Group ID:', ['group_id' => $groupId]);
        
        if ($groupId) {
            $groupSwineIds = \App\Models\Swine\SwineGroup::find($groupId)
                ->swine()
                ->where('swine.owner_id', $userId)
                ->where('swine.status', '!=', 'sold')
                ->pluck('swine.id')
                ->toArray();
            
            // Only keep selected swine that belong to the group and are not sold
            $swineIds = array_intersect($swineIds, $groupSwineIds);
        }
        
        // Validate that all swine IDs belong to the user and are not sold
        if (!empty($swineIds)) {
            $validSwineIds = \App\Models\Swine\Swine::where('owner_id', $userId)
                ->whereIn('id', $swineIds)
                ->where('status', '!=', 'sold')
                ->pluck('id')
                ->toArray();
            
            if (count($validSwineIds) !== count($swineIds)) {
                return redirect()->back()->withErrors([
                    'error' => 'Some swine IDs are invalid, do not belong to you, or are sold.'
                ]);
            }
            $swineIds = $validSwineIds;
        }
        
        // Update the expense
        $expense->update([
            'swine_group_id' => $groupId,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'quantity' => $validated['quantity'] ?? null,
            'unit' => $validated['unit'] ?? null,
            'amount' => $validated['amount'],
            'date' => $validated['date'],
        ]);
        
        \Illuminate\Support\Facades\Log::info('Update Expense - Updated expense:', $expense->toArray());
        
        // Update swine shares (only for active swine)
        \App\Models\SwineExpense::where('expense_id', $expense->id)->delete();
        
        if (!empty($swineIds)) {
            $share = $validated['amount'] / count($swineIds);
            
            $swineExpenses = collect($swineIds)->map(fn($id) => [
                'expense_id' => $expense->id,
                'swine_id' => $id,
                'individual_share' => $share,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();
            
            \App\Models\SwineExpense::insert($swineExpenses);
        }
        
        $successMessage = 'Expense updated successfully!';
        if ($filteredOutCount > 0) {
            $successMessage .= ' ' . $filteredOutCount . ' sold swine(s) were excluded from expense sharing.';
        }
        
        return redirect()->back()->with('success', $successMessage);
        
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Update Expense Error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return redirect()->back()->withErrors(['error' => 'Failed to update expense: ' . $e->getMessage()]);
    }
}



    /** Delete expense */
   public function destroy(Expense $expense)
{
    try {
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully.'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete expense.',
            'error' => $e->getMessage()
        ], 500);
    }
}

}

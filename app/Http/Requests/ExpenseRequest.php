<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => 'required|string|in:feed,medicine,labor,utilities,maintenance,equipment,transportation,other',
            'description' => 'nullable|string|max:500',
            'amount' => 'required|numeric|min:0.01',
            'quantity' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'date' => 'required|date',
            'group_id' => 'nullable|integer|exists:swine_groups,id',
            'swine_ids' => 'nullable|array',
            'swine_ids.*' => 'integer|exists:swine,id',
        ];
    }

    public function messages(): array
    {
        return [
            'category.required' => 'Please select a category for the expense.',
            'amount.required' => 'Please enter the total amount of the expense.',
            'amount.min' => 'The amount must be at least 0.01.',
            'date.required' => 'Please select the expense date.',
        ];
    }
    
    protected function prepareForValidation()
    {
        // Ensure group_id is properly cast
        $groupId = $this->input('group_id');
        
        $this->merge([
            'group_id' => $groupId && $groupId !== 'null' && $groupId !== 'none' 
                ? (int) $groupId 
                : null,
            'swine_ids' => $this->input('swine_ids', []),
        ]);
    }
}
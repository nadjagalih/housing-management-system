<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'     => ['required', 'in:gaji_satpam,token_listrik,perbaikan_jalan,perbaikan_selokan,other'],
            'description'  => ['required', 'string', 'max:255'],
            'amount'       => ['required', 'integer', 'min:1'],
            'expense_date' => ['required', 'date'],
            'month'        => ['required', 'integer', 'min:1', 'max:12'],
            'year'         => ['required', 'integer', 'min:2020'],
            'is_recurring' => ['sometimes', 'boolean'],
            'notes'        => ['nullable', 'string'],
        ];
    }
}

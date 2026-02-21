# 🛠️ Backend Implementation Guide — Laravel 10

> **Stack:** Laravel 10 · MySQL 8 · Laravel Sanctum
> Ikuti urutan pengerjaan berikut agar tidak ada dependency yang terlewat.

---

## Urutan Implementasi

```
1. Setup Project & Konfigurasi
2. Migrations
3. Models & Relasi
4. Seeders
5. Auth (Sanctum)
6. Form Requests (Validasi)
7. API Resources (JSON Transformer)
8. Services (Business Logic)
9. Controllers
10. Routes
```

---

## 1. Setup Project

### 1.1 Buat project Laravel 10

```bash
composer create-project laravel/laravel:^10.0 rt-management-backend
cd rt-management-backend
```

### 1.2 Install Laravel Sanctum

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### 1.3 Konfigurasi `.env`

```env
APP_NAME="RT Management"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rt_management
DB_USERNAME=root
DB_PASSWORD=your_password

FILESYSTEM_DISK=public
```

### 1.4 Konfigurasi CORS

Edit `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### 1.5 Konfigurasi Sanctum di `app/Http/Kernel.php`

Pastikan middleware Sanctum aktif di group `api`:

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

---

## 2. Migrations

Jalankan dalam urutan berikut karena ada foreign key dependency.

### 2.1 Users Table

```bash
php artisan make:migration create_users_table
```

> ℹ️ Table `users` sudah dibuat default oleh Laravel. Cukup modifikasi migration yang ada di `database/migrations/`.

```php
// database/migrations/xxxx_create_users_table.php
public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name', 100);
        $table->string('email', 150)->unique();
        $table->string('password');
        $table->enum('role', ['admin', 'resident'])->default('admin');
        $table->rememberToken();
        $table->timestamps();
    });
}
```

### 2.2 Houses Table

```bash
php artisan make:migration create_houses_table
```

```php
// database/migrations/xxxx_create_houses_table.php
public function up(): void
{
    Schema::create('houses', function (Blueprint $table) {
        $table->id();
        $table->string('house_number', 20)->unique();
        $table->string('block', 10)->nullable();
        $table->text('address');
        $table->enum('status', ['occupied', 'empty'])->default('empty');
        $table->enum('house_type', ['permanent', 'flexible'])->default('permanent');
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}
```

### 2.3 Residents Table

```bash
php artisan make:migration create_residents_table
```

```php
// database/migrations/xxxx_create_residents_table.php
public function up(): void
{
    Schema::create('residents', function (Blueprint $table) {
        $table->id();
        $table->string('full_name', 150);
        $table->string('ktp_photo')->nullable();
        $table->enum('resident_type', ['permanent', 'contract'])->default('permanent');
        $table->string('phone_number', 20);
        $table->enum('marital_status', ['married', 'single'])->default('single');
        $table->boolean('is_active')->default(true);
        $table->softDeletes();   // deleted_at — untuk soft delete
        $table->timestamps();
    });
}
```

### 2.4 House Residents Table (Pivot + History)

```bash
php artisan make:migration create_house_residents_table
```

```php
// database/migrations/xxxx_create_house_residents_table.php
public function up(): void
{
    Schema::create('house_residents', function (Blueprint $table) {
        $table->id();
        $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
        $table->foreignId('resident_id')->constrained('residents')->cascadeOnDelete();
        $table->date('start_date');
        $table->date('end_date')->nullable();       // null = masih aktif menghuni
        $table->boolean('is_active')->default(true);
        $table->integer('contract_duration')->nullable(); // dalam bulan, untuk tipe kontrak
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}
```

### 2.5 Payment Types Table

```bash
php artisan make:migration create_payment_types_table
```

```php
// database/migrations/xxxx_create_payment_types_table.php
public function up(): void
{
    Schema::create('payment_types', function (Blueprint $table) {
        $table->id();
        $table->string('name', 50);               // satpam, kebersihan
        $table->decimal('amount', 10, 2);
        $table->text('description')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}
```

### 2.6 Payments Table

```bash
php artisan make:migration create_payments_table
```

```php
// database/migrations/xxxx_create_payments_table.php
public function up(): void
{
    Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('house_id')->constrained('houses');
        $table->foreignId('resident_id')->constrained('residents');
        $table->foreignId('payment_type_id')->constrained('payment_types');
        $table->decimal('amount', 10, 2);
        $table->tinyInteger('month');              // 1-12
        $table->smallInteger('year');
        $table->integer('paid_months')->default(1); // untuk bayar tahunan
        $table->enum('status', ['paid', 'unpaid'])->default('unpaid');
        $table->date('payment_date')->nullable();
        $table->date('due_date')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();

        // Mencegah duplikat tagihan bulan yang sama
        $table->unique(['house_id', 'payment_type_id', 'month', 'year'], 'unique_payment_per_month');
    });
}
```

### 2.7 Expenses Table

```bash
php artisan make:migration create_expenses_table
```

```php
// database/migrations/xxxx_create_expenses_table.php
public function up(): void
{
    Schema::create('expenses', function (Blueprint $table) {
        $table->id();
        $table->enum('category', [
            'gaji_satpam',
            'token_listrik',
            'perbaikan_jalan',
            'perbaikan_selokan',
            'other'
        ]);
        $table->text('description');
        $table->decimal('amount', 10, 2);
        $table->date('expense_date');
        $table->tinyInteger('month');
        $table->smallInteger('year');
        $table->boolean('is_recurring')->default(false);
        $table->string('receipt_photo')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}
```

### Jalankan semua migrasi

```bash
php artisan migrate
```

---

## 3. Models & Relasi

### 3.1 User Model

```php
// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'password' => 'hashed',
    ];
}
```

### 3.2 House Model

```php
// app/Models/House.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    protected $fillable = [
        'house_number', 'block', 'address',
        'status', 'house_type', 'notes'
    ];

    // Semua record penghuni (termasuk history)
    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    // Hanya penghuni yang aktif saat ini
    public function activeResident()
    {
        return $this->hasOne(HouseResident::class)
                    ->where('is_active', true)
                    ->with('resident');
    }

    // Semua record pembayaran
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
```

### 3.3 Resident Model

```php
// app/Models/Resident.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Resident extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name', 'ktp_photo', 'resident_type',
        'phone_number', 'marital_status', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    // Relasi ke rumah yang sedang dihuni (aktif)
    public function currentHouse()
    {
        return $this->hasOneThrough(
            House::class,
            HouseResident::class,
            'resident_id',
            'id',
            'id',
            'house_id'
        )->where('house_residents.is_active', true);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
```

### 3.4 HouseResident Model

```php
// app/Models/HouseResident.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HouseResident extends Model
{
    protected $fillable = [
        'house_id', 'resident_id', 'start_date',
        'end_date', 'is_active', 'contract_duration', 'notes'
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }
}
```

### 3.5 PaymentType Model

```php
// app/Models/PaymentType.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentType extends Model
{
    protected $fillable = ['name', 'amount', 'description', 'is_active'];

    protected $casts = [
        'amount'    => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
```

### 3.6 Payment Model

```php
// app/Models/Payment.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'house_id', 'resident_id', 'payment_type_id',
        'amount', 'month', 'year', 'paid_months',
        'status', 'payment_date', 'due_date', 'notes'
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'payment_date' => 'date',
        'due_date'     => 'date',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function paymentType(): BelongsTo
    {
        return $this->belongsTo(PaymentType::class);
    }
}
```

### 3.7 Expense Model

```php
// app/Models/Expense.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'category', 'description', 'amount',
        'expense_date', 'month', 'year',
        'is_recurring', 'receipt_photo', 'notes'
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'expense_date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
```

---

## 4. Seeders

### 4.1 UserSeeder

```php
// database/seeders/UserSeeder.php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Admin RT',
            'email'    => 'admin@rt.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);
    }
}
```

### 4.2 PaymentTypeSeeder

```php
// database/seeders/PaymentTypeSeeder.php
<?php

namespace Database\Seeders;

use App\Models\PaymentType;
use Illuminate\Database\Seeder;

class PaymentTypeSeeder extends Seeder
{
    public function run(): void
    {
        PaymentType::insert([
            [
                'name'        => 'satpam',
                'amount'      => 100000,
                'description' => 'Iuran keamanan satpam perumahan',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'kebersihan',
                'amount'      => 15000,
                'description' => 'Iuran kebersihan dan sampah',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ]);
    }
}
```

### 4.3 HouseSeeder

```php
// database/seeders/HouseSeeder.php
<?php

namespace Database\Seeders;

use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        $houses = [];

        // 15 rumah permanent (blok A & B)
        for ($i = 1; $i <= 8; $i++) {
            $houses[] = [
                'house_number' => 'A' . $i,
                'block'        => 'A',
                'address'      => 'Jl. Perumahan Elite Blok A No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'permanent',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }
        for ($i = 1; $i <= 7; $i++) {
            $houses[] = [
                'house_number' => 'B' . $i,
                'block'        => 'B',
                'address'      => 'Jl. Perumahan Elite Blok B No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'permanent',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // 5 rumah flexible (blok C)
        for ($i = 1; $i <= 5; $i++) {
            $houses[] = [
                'house_number' => 'C' . $i,
                'block'        => 'C',
                'address'      => 'Jl. Perumahan Elite Blok C No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'flexible',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        House::insert($houses);
    }
}
```

### 4.4 DatabaseSeeder

```php
// database/seeders/DatabaseSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PaymentTypeSeeder::class,
            HouseSeeder::class,
        ]);
    }
}
```

### Jalankan seeder

```bash
php artisan db:seed
# atau fresh migrate + seed sekaligus
php artisan migrate:fresh --seed
```

---

## 5. Auth (Sanctum)

### AuthController

```php
// app/Http/Controllers/Api/AuthController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        $user  = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
```

### LoginRequest

```php
// app/Http/Requests/Auth/LoginRequest.php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email'    => 'required|email',
            'password' => 'required|string',
        ];
    }
}
```

---

## 6. Form Requests (Validasi)

### StoreHouseRequest

```php
// app/Http/Requests/House/StoreHouseRequest.php
public function rules(): array
{
    return [
        'house_number' => 'required|string|max:20|unique:houses,house_number',
        'block'        => 'nullable|string|max:10',
        'address'      => 'required|string',
        'house_type'   => 'required|in:permanent,flexible',
        'notes'        => 'nullable|string',
    ];
}
```

### UpdateHouseRequest

```php
// app/Http/Requests/House/UpdateHouseRequest.php
public function rules(): array
{
    return [
        'house_number' => 'sometimes|string|max:20|unique:houses,house_number,' . $this->route('id'),
        'block'        => 'nullable|string|max:10',
        'address'      => 'sometimes|string',
        'house_type'   => 'sometimes|in:permanent,flexible',
        'notes'        => 'nullable|string',
    ];
}
```

### AssignResidentRequest

```php
// app/Http/Requests/House/AssignResidentRequest.php
public function rules(): array
{
    return [
        'resident_id'       => 'required|exists:residents,id',
        'start_date'        => 'required|date',
        'contract_duration' => 'nullable|integer|min:1',
        'notes'             => 'nullable|string',
    ];
}
```

### UnassignResidentRequest

```php
// app/Http/Requests/House/UnassignResidentRequest.php
public function rules(): array
{
    return [
        'end_date' => 'required|date',
        'notes'    => 'nullable|string',
    ];
}
```

### StoreResidentRequest

```php
// app/Http/Requests/Resident/StoreResidentRequest.php
public function rules(): array
{
    return [
        'full_name'      => 'required|string|max:150',
        'ktp_photo'      => 'required|image|mimes:jpg,jpeg,png|max:2048',
        'resident_type'  => 'required|in:permanent,contract',
        'phone_number'   => 'required|string|max:20',
        'marital_status' => 'required|in:married,single',
    ];
}
```

### UpdateResidentRequest

```php
// app/Http/Requests/Resident/UpdateResidentRequest.php
public function rules(): array
{
    return [
        'full_name'      => 'sometimes|string|max:150',
        'ktp_photo'      => 'sometimes|image|mimes:jpg,jpeg,png|max:2048',
        'resident_type'  => 'sometimes|in:permanent,contract',
        'phone_number'   => 'sometimes|string|max:20',
        'marital_status' => 'sometimes|in:married,single',
    ];
}
```

### GenerateMonthlyRequest

```php
// app/Http/Requests/Payment/GenerateMonthlyRequest.php
public function rules(): array
{
    return [
        'month' => 'required|integer|between:1,12',
        'year'  => 'required|integer|min:2000|max:2100',
    ];
}
```

### StorePaymentRequest

```php
// app/Http/Requests/Payment/StorePaymentRequest.php
public function rules(): array
{
    return [
        'house_id'        => 'required|exists:houses,id',
        'resident_id'     => 'required|exists:residents,id',
        'payment_type_id' => 'required|exists:payment_types,id',
        'month'           => 'required|integer|between:1,12',
        'year'            => 'required|integer|min:2000',
        'paid_months'     => 'nullable|integer|min:1|max:12',
        'payment_date'    => 'required|date',
        'notes'           => 'nullable|string',
    ];
}
```

### MarkPaidRequest

```php
// app/Http/Requests/Payment/MarkPaidRequest.php
public function rules(): array
{
    return [
        'payment_date' => 'required|date',
        'notes'        => 'nullable|string',
    ];
}
```

### StoreExpenseRequest

```php
// app/Http/Requests/Expense/StoreExpenseRequest.php
public function rules(): array
{
    return [
        'category'     => 'required|in:gaji_satpam,token_listrik,perbaikan_jalan,perbaikan_selokan,other',
        'description'  => 'required|string',
        'amount'       => 'required|numeric|min:0',
        'expense_date' => 'required|date',
        'month'        => 'required|integer|between:1,12',
        'year'         => 'required|integer|min:2000',
        'is_recurring' => 'nullable|boolean',
        'notes'        => 'nullable|string',
    ];
}
```

---

## 7. API Resources (JSON Transformer)

### HouseResource

```php
// app/Http/Resources/HouseResource.php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HouseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'house_number'    => $this->house_number,
            'block'           => $this->block,
            'address'         => $this->address,
            'status'          => $this->status,
            'house_type'      => $this->house_type,
            'notes'           => $this->notes,
            'active_resident' => $this->whenLoaded('activeResident', function () {
                $hr = $this->activeResident;
                return $hr ? new ResidentResource($hr->resident) : null;
            }),
        ];
    }
}
```

### ResidentResource

```php
// app/Http/Resources/ResidentResource.php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ResidentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'full_name'      => $this->full_name,
            'ktp_photo_url'  => $this->ktp_photo
                                    ? asset('storage/' . $this->ktp_photo)
                                    : null,
            'resident_type'  => $this->resident_type,
            'phone_number'   => $this->phone_number,
            'marital_status' => $this->marital_status,
            'is_active'      => $this->is_active,
            'current_house'  => $this->whenLoaded('currentHouse', function () {
                return $this->currentHouse ? [
                    'id'           => $this->currentHouse->id,
                    'house_number' => $this->currentHouse->house_number,
                    'block'        => $this->currentHouse->block,
                ] : null;
            }),
        ];
    }
}
```

### PaymentResource

```php
// app/Http/Resources/PaymentResource.php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'house'        => $this->whenLoaded('house', fn() => [
                'id'           => $this->house->id,
                'house_number' => $this->house->house_number,
            ]),
            'resident'     => $this->whenLoaded('resident', fn() => [
                'id'        => $this->resident->id,
                'full_name' => $this->resident->full_name,
            ]),
            'payment_type' => $this->whenLoaded('paymentType', fn() => [
                'id'     => $this->paymentType->id,
                'name'   => $this->paymentType->name,
                'amount' => $this->paymentType->amount,
            ]),
            'amount'       => $this->amount,
            'month'        => $this->month,
            'year'         => $this->year,
            'paid_months'  => $this->paid_months,
            'status'       => $this->status,
            'payment_date' => $this->payment_date?->format('Y-m-d'),
            'due_date'     => $this->due_date?->format('Y-m-d'),
            'notes'        => $this->notes,
        ];
    }
}
```

### ExpenseResource

```php
// app/Http/Resources/ExpenseResource.php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'category'     => $this->category,
            'description'  => $this->description,
            'amount'       => $this->amount,
            'expense_date' => $this->expense_date?->format('Y-m-d'),
            'month'        => $this->month,
            'year'         => $this->year,
            'is_recurring' => $this->is_recurring,
            'notes'        => $this->notes,
        ];
    }
}
```

---

## 8. Services (Business Logic)

### HouseService

```php
// app/Services/HouseService.php
<?php

namespace App\Services;

use App\Models\House;
use App\Models\HouseResident;

class HouseService
{
    public function assignResident(House $house, array $data): HouseResident
    {
        // Nonaktifkan penghuni lama jika ada
        HouseResident::where('house_id', $house->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'end_date'  => now()->toDateString(),
            ]);

        // Assign penghuni baru
        $houseResident = HouseResident::create([
            'house_id'          => $house->id,
            'resident_id'       => $data['resident_id'],
            'start_date'        => $data['start_date'],
            'contract_duration' => $data['contract_duration'] ?? null,
            'notes'             => $data['notes'] ?? null,
            'is_active'         => true,
        ]);

        // Update status rumah
        $house->update(['status' => 'occupied']);

        return $houseResident;
    }

    public function unassignResident(House $house, array $data): void
    {
        HouseResident::where('house_id', $house->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'end_date'  => $data['end_date'],
                'notes'     => $data['notes'] ?? null,
            ]);

        $house->update(['status' => 'empty']);
    }
}
```

### PaymentService

```php
// app/Services/PaymentService.php
<?php

namespace App\Services;

use App\Models\House;
use App\Models\Payment;
use App\Models\PaymentType;
use Carbon\Carbon;

class PaymentService
{
    /**
     * Generate tagihan bulanan untuk semua penghuni aktif.
     * Idempotent: skip jika tagihan sudah ada.
     */
    public function generateMonthly(int $month, int $year): array
    {
        $generated = 0;
        $skipped   = 0;

        // Ambil semua rumah yang sedang dihuni
        $occupiedHouses = House::where('status', 'occupied')
            ->with(['activeResident.resident'])
            ->get();

        $paymentTypes = PaymentType::where('is_active', true)->get();

        foreach ($occupiedHouses as $house) {
            $activeResident = $house->activeResident;
            if (!$activeResident || !$activeResident->resident) continue;

            $residentId = $activeResident->resident_id;
            $dueDate    = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            foreach ($paymentTypes as $type) {
                // Cek apakah tagihan sudah ada (idempotent)
                $exists = Payment::where([
                    'house_id'        => $house->id,
                    'payment_type_id' => $type->id,
                    'month'           => $month,
                    'year'            => $year,
                ])->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Payment::create([
                    'house_id'        => $house->id,
                    'resident_id'     => $residentId,
                    'payment_type_id' => $type->id,
                    'amount'          => $type->amount,
                    'month'           => $month,
                    'year'            => $year,
                    'paid_months'     => 1,
                    'status'          => 'unpaid',
                    'due_date'        => $dueDate,
                ]);

                $generated++;
            }
        }

        return compact('generated', 'skipped');
    }

    /**
     * Catat pembayaran manual.
     * Jika paid_months > 1, tandai tagihan bulan-bulan berikutnya sebagai lunas.
     */
    public function storePayment(array $data): Payment
    {
        $paidMonths = $data['paid_months'] ?? 1;

        // Update atau buat record untuk bulan pertama
        $payment = Payment::updateOrCreate(
            [
                'house_id'        => $data['house_id'],
                'payment_type_id' => $data['payment_type_id'],
                'month'           => $data['month'],
                'year'            => $data['year'],
            ],
            [
                'resident_id'  => $data['resident_id'],
                'amount'       => $data['amount'] ?? PaymentType::find($data['payment_type_id'])->amount,
                'paid_months'  => $paidMonths,
                'status'       => 'paid',
                'payment_date' => $data['payment_date'],
                'notes'        => $data['notes'] ?? null,
            ]
        );

        // Jika bayar lebih dari 1 bulan, tandai bulan-bulan berikutnya
        if ($paidMonths > 1) {
            $startDate = Carbon::create($data['year'], $data['month'], 1);

            for ($i = 1; $i < $paidMonths; $i++) {
                $nextDate = $startDate->copy()->addMonths($i);

                Payment::updateOrCreate(
                    [
                        'house_id'        => $data['house_id'],
                        'payment_type_id' => $data['payment_type_id'],
                        'month'           => $nextDate->month,
                        'year'            => $nextDate->year,
                    ],
                    [
                        'resident_id'  => $data['resident_id'],
                        'amount'       => $payment->amount,
                        'paid_months'  => 1,
                        'status'       => 'paid',
                        'payment_date' => $data['payment_date'],
                        'notes'        => 'Tercover dari pembayaran ' . $data['month'] . '/' . $data['year'],
                    ]
                );
            }
        }

        return $payment;
    }
}
```

### ReportService

```php
// app/Services/ReportService.php
<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;

class ReportService
{
    public function getDashboard(): array
    {
        $now   = now();
        $month = $now->month;
        $year  = $now->year;

        $totalPemasukan  = Payment::where('status', 'paid')
                                  ->where('month', $month)->where('year', $year)
                                  ->sum('amount');

        $totalPengeluaran = Expense::where('month', $month)->where('year', $year)
                                   ->sum('amount');

        return [
            'houses' => [
                'total'    => House::count(),
                'occupied' => House::where('status', 'occupied')->count(),
                'empty'    => House::where('status', 'empty')->count(),
            ],
            'residents' => [
                'total'     => Resident::where('is_active', true)->count(),
                'permanent' => Resident::where('resident_type', 'permanent')->where('is_active', true)->count(),
                'contract'  => Resident::where('resident_type', 'contract')->where('is_active', true)->count(),
            ],
            'current_month' => [
                'month_label'        => $now->locale('id')->isoFormat('MMMM YYYY'),
                'pemasukan'          => $totalPemasukan,
                'pengeluaran'        => $totalPengeluaran,
                'saldo'              => $totalPemasukan - $totalPengeluaran,
                'tagihan_lunas'      => Payment::where('status', 'paid')->where('month', $month)->where('year', $year)->count(),
                'tagihan_belum_lunas' => Payment::where('status', 'unpaid')->where('month', $month)->where('year', $year)->count(),
            ],
        ];
    }

    public function getSummary(int $year): array
    {
        $months     = ['Januari','Februari','Maret','April','Mei','Juni',
                       'Juli','Agustus','September','Oktober','November','Desember'];
        $data       = [];
        $totalIn    = 0;
        $totalOut   = 0;

        for ($m = 1; $m <= 12; $m++) {
            $pemasukan   = Payment::where('status', 'paid')->where('month', $m)->where('year', $year)->sum('amount');
            $pengeluaran = Expense::where('month', $m)->where('year', $year)->sum('amount');

            $data[] = [
                'month'             => $m,
                'month_label'       => $months[$m - 1],
                'total_pemasukan'   => (float) $pemasukan,
                'total_pengeluaran' => (float) $pengeluaran,
                'saldo'             => (float) ($pemasukan - $pengeluaran),
            ];

            $totalIn  += $pemasukan;
            $totalOut += $pengeluaran;
        }

        return [
            'year'           => $year,
            'data'           => $data,
            'annual_summary' => [
                'total_pemasukan'   => (float) $totalIn,
                'total_pengeluaran' => (float) $totalOut,
                'saldo_akhir'       => (float) ($totalIn - $totalOut),
            ],
        ];
    }
}
```

---

## 9. Controllers

### HouseController

```php
// app/Http/Controllers/Api/HouseController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\House\AssignResidentRequest;
use App\Http\Requests\House\StoreHouseRequest;
use App\Http\Requests\House\UnassignResidentRequest;
use App\Http\Requests\House\UpdateHouseRequest;
use App\Http\Resources\HouseResource;
use App\Models\House;
use App\Services\HouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseController extends Controller
{
    public function __construct(private HouseService $houseService) {}

    public function index(Request $request): JsonResponse
    {
        $query = House::with('activeResident.resident');

        if ($request->status) $query->where('status', $request->status);
        if ($request->type)   $query->where('house_type', $request->type);

        $houses = $query->orderBy('house_number')->get();

        return response()->json([
            'data' => HouseResource::collection($houses),
            'meta' => [
                'total'    => $houses->count(),
                'occupied' => $houses->where('status', 'occupied')->count(),
                'empty'    => $houses->where('status', 'empty')->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $house = House::with([
            'activeResident.resident',
            'houseResidents.resident',
        ])->findOrFail($id);

        // Ambil history pembayaran per bulan
        $paymentHistory = $house->payments()
            ->with(['resident', 'paymentType'])
            ->orderByDesc('year')->orderByDesc('month')
            ->get()
            ->groupBy(fn($p) => $p->year . '-' . str_pad($p->month, 2, '0', STR_PAD_LEFT))
            ->map(function ($payments, $key) {
                [$year, $month] = explode('-', $key);
                return [
                    'month'    => (int) $month,
                    'year'     => (int) $year,
                    'resident' => ['full_name' => optional($payments->first()->resident)->full_name],
                    'payments' => $payments->map(fn($p) => [
                        'type'   => $p->paymentType->name,
                        'status' => $p->status,
                        'amount' => $p->amount,
                    ])->values(),
                ];
            })->values();

        return response()->json([
            'data' => [
                'id'              => $house->id,
                'house_number'    => $house->house_number,
                'block'           => $house->block,
                'address'         => $house->address,
                'status'          => $house->status,
                'house_type'      => $house->house_type,
                'notes'           => $house->notes,
                'active_resident' => $house->activeResident?->resident,
                'resident_history' => $house->houseResidents->map(fn($hr) => [
                    'resident'   => ['full_name' => $hr->resident->full_name],
                    'start_date' => $hr->start_date?->format('Y-m-d'),
                    'end_date'   => $hr->end_date?->format('Y-m-d'),
                    'is_active'  => $hr->is_active,
                ]),
                'payment_history' => $paymentHistory,
            ],
        ]);
    }

    public function store(StoreHouseRequest $request): JsonResponse
    {
        $house = House::create($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil ditambahkan.',
            'data'    => new HouseResource($house),
        ], 201);
    }

    public function update(UpdateHouseRequest $request, int $id): JsonResponse
    {
        $house = House::findOrFail($id);
        $house->update($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil diperbarui.',
            'data'    => new HouseResource($house),
        ]);
    }

    public function assignResident(AssignResidentRequest $request, int $id): JsonResponse
    {
        $house        = House::findOrFail($id);
        $houseResident = $this->houseService->assignResident($house, $request->validated());

        return response()->json([
            'message' => 'Penghuni berhasil di-assign.',
            'data'    => $houseResident,
        ]);
    }

    public function unassignResident(UnassignResidentRequest $request, int $id): JsonResponse
    {
        $house = House::findOrFail($id);
        $this->houseService->unassignResident($house, $request->validated());

        return response()->json(['message' => 'Penghuni berhasil dilepas dari rumah.']);
    }
}
```

### ResidentController

```php
// app/Http/Controllers/Api/ResidentController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Http\Resources\ResidentResource;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Resident::with('currentHouse');

        if ($request->type)   $query->where('resident_type', $request->type);
        if ($request->search) $query->where('full_name', 'like', '%' . $request->search . '%');

        $residents = $query->where('is_active', true)->orderBy('full_name')->get();

        return response()->json([
            'data' => ResidentResource::collection($residents),
            'meta' => [
                'total'     => $residents->count(),
                'permanent' => $residents->where('resident_type', 'permanent')->count(),
                'contract'  => $residents->where('resident_type', 'contract')->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $resident = Resident::with([
            'currentHouse',
            'houseResidents.house',
        ])->findOrFail($id);

        return response()->json([
            'data' => (new ResidentResource($resident))->additional([
                'house_history' => $resident->houseResidents->map(fn($hr) => [
                    'house'      => ['house_number' => $hr->house->house_number],
                    'start_date' => $hr->start_date?->format('Y-m-d'),
                    'end_date'   => $hr->end_date?->format('Y-m-d'),
                    'is_active'  => $hr->is_active,
                ]),
            ]),
        ]);
    }

    public function store(StoreResidentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo'] = $request->file('ktp_photo')
                ->store('ktp', 'public');
        }

        $resident = Resident::create($data);

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan.',
            'data'    => new ResidentResource($resident),
        ], 201);
    }

    public function update(UpdateResidentRequest $request, int $id): JsonResponse
    {
        $resident = Resident::findOrFail($id);
        $data     = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            // Hapus foto lama
            if ($resident->ktp_photo) {
                Storage::disk('public')->delete($resident->ktp_photo);
            }
            $data['ktp_photo'] = $request->file('ktp_photo')
                ->store('ktp', 'public');
        }

        $resident->update($data);

        return response()->json([
            'message' => 'Data penghuni berhasil diperbarui.',
            'data'    => new ResidentResource($resident),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $resident = Resident::findOrFail($id);

        // Cegah delete jika masih aktif di rumah
        $isActive = $resident->houseResidents()
                             ->where('is_active', true)
                             ->exists();

        if ($isActive) {
            return response()->json([
                'message' => 'Penghuni masih aktif menghuni rumah. Lepas dari rumah terlebih dahulu.'
            ], 422);
        }

        $resident->update(['is_active' => false]);
        $resident->delete(); // soft delete

        return response()->json(['message' => 'Penghuni berhasil dinonaktifkan.']);
    }
}
```

### PaymentController

```php
// app/Http/Controllers/Api/PaymentController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\GenerateMonthlyRequest;
use App\Http\Requests\Payment\MarkPaidRequest;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['house', 'resident', 'paymentType']);

        if ($request->month)    $query->where('month', $request->month);
        if ($request->year)     $query->where('year', $request->year);
        if ($request->status)   $query->where('status', $request->status);
        if ($request->house_id) $query->where('house_id', $request->house_id);

        $payments = $query->orderByDesc('year')->orderByDesc('month')->get();

        return response()->json([
            'data'    => PaymentResource::collection($payments),
            'summary' => [
                'total_tagihan' => $payments->count(),
                'lunas'         => $payments->where('status', 'paid')->count(),
                'belum_lunas'   => $payments->where('status', 'unpaid')->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $payment = Payment::with(['house', 'resident', 'paymentType'])->findOrFail($id);
        return response()->json(['data' => new PaymentResource($payment)]);
    }

    public function generateMonthly(GenerateMonthlyRequest $request): JsonResponse
    {
        $result = $this->paymentService->generateMonthly(
            $request->month,
            $request->year
        );

        return response()->json([
            'message'   => "Tagihan bulan {$request->month}/{$request->year} berhasil digenerate.",
            'generated' => $result['generated'],
            'skipped'   => $result['skipped'],
        ], 201);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $payment = $this->paymentService->storePayment($request->validated());

        return response()->json([
            'message' => 'Pembayaran berhasil dicatat.',
            'data'    => new PaymentResource($payment->load(['house', 'resident', 'paymentType'])),
        ], 201);
    }

    public function markPaid(MarkPaidRequest $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $payment->update([
            'status'       => 'paid',
            'payment_date' => $request->payment_date,
            'notes'        => $request->notes,
        ]);

        return response()->json(['message' => 'Tagihan berhasil ditandai lunas.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status === 'paid') {
            return response()->json([
                'message' => 'Tagihan yang sudah lunas tidak bisa dihapus.'
            ], 422);
        }

        $payment->delete();
        return response()->json(['message' => 'Data pembayaran berhasil dihapus.']);
    }
}
```

### ExpenseController

```php
// app/Http/Controllers/Api/ExpenseController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->month)    $query->where('month', $request->month);
        if ($request->year)     $query->where('year', $request->year);
        if ($request->category) $query->where('category', $request->category);

        $expenses = $query->orderByDesc('expense_date')->get();

        return response()->json([
            'data'    => ExpenseResource::collection($expenses),
            'summary' => ['total_pengeluaran' => $expenses->sum('amount')],
        ]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create($request->validated());
        return response()->json([
            'message' => 'Pengeluaran berhasil dicatat.',
            'data'    => new ExpenseResource($expense),
        ], 201);
    }

    public function update(StoreExpenseRequest $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->update($request->validated());
        return response()->json([
            'message' => 'Pengeluaran berhasil diperbarui.',
            'data'    => new ExpenseResource($expense),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Expense::findOrFail($id)->delete();
        return response()->json(['message' => 'Pengeluaran berhasil dihapus.']);
    }
}
```

### ReportController

```php
// app/Http/Controllers/Api/ReportController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function dashboard(): JsonResponse
    {
        return response()->json($this->reportService->getDashboard());
    }

    public function summary(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;
        return response()->json($this->reportService->getSummary($year));
    }

    public function monthlyDetail(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        $months = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];

        $payments = Payment::with(['house', 'resident', 'paymentType'])
            ->where('month', $month)->where('year', $year)
            ->where('status', 'paid')->get();

        $expenses = Expense::where('month', $month)->where('year', $year)->get();

        return response()->json([
            'month'      => $month,
            'year'       => $year,
            'month_label' => $months[$month - 1] . ' ' . $year,
            'pemasukan'  => [
                'total' => $payments->sum('amount'),
                'items' => $payments->map(fn($p) => [
                    'house'    => $p->house->house_number,
                    'resident' => $p->resident->full_name,
                    'type'     => $p->paymentType->name,
                    'amount'   => $p->amount,
                    'status'   => $p->status,
                ]),
            ],
            'pengeluaran' => [
                'total' => $expenses->sum('amount'),
                'items' => $expenses->map(fn($e) => [
                    'category'    => $e->category,
                    'description' => $e->description,
                    'amount'      => $e->amount,
                ]),
            ],
            'saldo' => $payments->sum('amount') - $expenses->sum('amount'),
        ]);
    }

    public function unpaid(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        $unpaidPayments = Payment::with(['house', 'resident', 'paymentType'])
            ->where('month', $month)->where('year', $year)
            ->where('status', 'unpaid')->get()
            ->groupBy('house_id');

        $result = $unpaidPayments->map(function ($payments) {
            $first = $payments->first();
            return [
                'house'           => ['house_number' => $first->house->house_number],
                'resident'        => [
                    'full_name'    => $first->resident->full_name,
                    'phone_number' => $first->resident->phone_number,
                ],
                'unpaid'          => $payments->map(fn($p) => [
                    'type'   => $p->paymentType->name,
                    'amount' => $p->amount,
                ])->values(),
                'total_tunggakan' => $payments->sum('amount'),
            ];
        })->values();

        return response()->json([
            'data'            => $result,
            'total_tunggakan' => $result->sum('total_tunggakan'),
        ]);
    }
}
```

---

## 10. Routes

```php
// routes/api.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Public\PublicResidentController;

Route::prefix('v1')->group(function () {

    // === PUBLIC ===
    Route::post('auth/login', [AuthController::class, 'login']);

    // Portal warga (opsional)
    Route::prefix('public')->group(function () {
        Route::get('residents',              [PublicResidentController::class, 'index']);
        Route::get('residents/{house_number}', [PublicResidentController::class, 'show']);
    });

    // === PROTECTED ===
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me',     [AuthController::class, 'me']);

        // Houses
        Route::apiResource('houses', HouseController::class)->except(['destroy']);
        Route::post('houses/{id}/assign-resident',   [HouseController::class, 'assignResident']);
        Route::post('houses/{id}/unassign-resident', [HouseController::class, 'unassignResident']);

        // Residents
        Route::apiResource('residents', ResidentController::class);

        // Payment Types
        Route::get('payment-types',       [PaymentTypeController::class, 'index']);
        Route::put('payment-types/{id}',  [PaymentTypeController::class, 'update']);

        // Payments — generate-monthly harus sebelum apiResource agar tidak tertimpa route {payment}
        Route::post('payments/generate-monthly', [PaymentController::class, 'generateMonthly']);
        Route::apiResource('payments', PaymentController::class)->except(['update']);
        Route::put('payments/{id}/mark-paid',    [PaymentController::class, 'markPaid']);

        // Expenses
        Route::apiResource('expenses', ExpenseController::class);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('dashboard',      [ReportController::class, 'dashboard']);
            Route::get('summary',        [ReportController::class, 'summary']);
            Route::get('monthly-detail', [ReportController::class, 'monthlyDetail']);
            Route::get('unpaid',         [ReportController::class, 'unpaid']);
        });
    });
});
```

> ⚠️ Perhatikan urutan route `payments/generate-monthly` **harus didefinisikan sebelum** `apiResource('payments', ...)`, agar Laravel tidak menganggap `generate-monthly` sebagai `{payment}` ID.

---

## Verifikasi Backend

```bash
# Pastikan semua route terdaftar dengan benar
php artisan route:list

# Jalankan server
php artisan serve
```

Tes endpoint login via curl atau Postman:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rt.com","password":"password"}'
```

---

*Lanjutkan ke Frontend Implementation Guide untuk panduan implementasi sisi React.*

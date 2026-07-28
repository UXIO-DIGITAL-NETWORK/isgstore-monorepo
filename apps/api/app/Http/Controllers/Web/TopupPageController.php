<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PaymentChannel;
use App\Models\Transaction;
use App\Support\OrderForm\OrderFormSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Server-rendered top-up page.
 *
 * This is a thin client over the existing pipeline — it owns no business logic.
 * The catalog (games / denominations / payment methods) is read straight from the
 * models because products, categories and payment_channels have no public API
 * endpoints; the purchase itself goes to the real public POST /api/v1/checkout.
 *
 * Nothing here exposes price_modal, margin, supplier ids, or other customers' data.
 */
class TopupPageController extends Controller
{
    /** Only these payment types can be completed by a guest on this page. */
    private const EXCLUDED_CHANNELS = ['balance'];

    public function index()
    {
        $games = Category::query()
            ->where('status', true)
            ->whereHas('products', fn ($q) => $q->where('status', true)
                ->whereHas('supplierProducts', fn ($sq) => $sq->where('is_active', true))
            )
            ->orderBy('name')
            ->get(['id', 'name', 'sub_name', 'code', 'logo'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'sub_name' => $c->sub_name,
                'code' => $c->code,
                'logo_url' => $this->logoUrl($c->logo),
                'initials' => $this->initials($c->name),
            ])
            ->values();

        $channels = PaymentChannel::query()
            ->where('is_active', true)
            ->whereNotIn('channel_code', self::EXCLUDED_CHANNELS)
            ->orderBy('payment_type')
            // by id, not name — keeps seeder order so the "[SIT]" test channels
            // sort last instead of first.
            ->orderBy('id')
            ->get(['id', 'name', 'channel_code', 'payment_type', 'fee_flat', 'fee_percent', 'min_amount'])
            ->map(fn (PaymentChannel $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'channel_code' => $c->channel_code,
                'payment_type' => $c->payment_type,
                'fee_flat' => (int) $c->fee_flat,
                'fee_percent' => (float) $c->fee_percent,
                'min_amount' => (int) $c->min_amount,
            ])
            ->values();

        return view('topup', [
            'games' => $games,
            'channels' => $channels,
        ]);
    }

    /**
     * Denominations + the order-form schema for one game.
     */
    public function products(Category $category): JsonResponse
    {
        $products = $category->products()
            ->where('status', true)
            ->whereHas('supplierProducts', fn ($q) => $q->where('is_active', true))
            ->with('subCategory:id,name')
            ->orderBy('price_member')
            ->get(['id', 'sub_category_id', 'name', 'code', 'price_member'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'code' => $p->code,
                // Guests are charged price_member — see CheckoutAction::process().
                'price' => (int) $p->price_member,
                'group' => $p->subCategory?->name ?? 'Lainnya',
            ])
            ->values();

        return response()->json([
            'game' => ['id' => $category->id, 'name' => $category->name],
            'fields' => $this->resolveFormFields($category),
            'products' => $products,
        ]);
    }

    /**
     * Receipt lookup for invoices this browser created (kept in localStorage).
     *
     * Returns a deliberately narrow projection: no guest_contact, no target_uid,
     * no margin/supplier data. Invoice numbers carry six random characters, so
     * they are not enumerable.
     */
    public function orders(Request $request): JsonResponse
    {
        $invoices = collect(explode(',', (string) $request->query('invoices', '')))
            ->map(fn ($i) => trim($i))
            ->filter()
            ->unique()
            ->take(20)
            ->values();

        if ($invoices->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $orders = Transaction::query()
            ->whereIn('invoice_number', $invoices)
            ->with('product:id,name')
            ->latest('id')
            ->get(['id', 'invoice_number', 'product_id', 'amount_total', 'status', 'sn', 'created_at'])
            ->map(fn (Transaction $t) => [
                'invoice_number' => $t->invoice_number,
                'product_name' => $t->product?->name,
                'amount_total' => (int) $t->amount_total,
                'status' => $t->status?->value,
                'sn' => $t->sn,
                'created_at' => $t->created_at?->toIso8601String(),
            ])
            ->values();

        return response()->json(['data' => $orders]);
    }

    /**
     * Which identity fields this game asks for.
     *
     * Only the first two are usable: checkout accepts target_uid and target_server
     * and nothing else, so field #1 maps to target_uid and field #2 to target_server.
     */
    private function resolveFormFields(Category $category): array
    {
        // Configured schema wins. This is also what stops a configured game (MLBB)
        // rendering the fabricated Zone 1-5 dropdown seeded into server_categories.
        if ($schema = OrderFormSchema::forCategory($category)) {
            return $schema->toClientArray();
        }

        // Fallback: server_categories is what the seed data actually populates
        // (User ID / Zone ID / Player ID / Nomor HP), with options for MLBB zones.
        $serverFields = $category->serverCategories()
            ->with('options:id,server_category_id,name,value')
            ->orderBy('id')
            ->get()
            ->map(fn ($sc) => $this->clientField([
                'key' => Str::slug($sc->name, '_'),
                'label' => $sc->name,
                'required' => true,
                'type' => $sc->options->isNotEmpty() ? 'select' : 'text',
                'options' => $sc->options
                    ->map(fn ($o) => ['label' => $o->name, 'value' => (string) $o->value])
                    ->values()
                    ->all(),
            ]))
            ->values()
            ->all();

        if (! empty($serverFields)) {
            return array_slice($serverFields, 0, OrderFormSchema::MAX_FIELDS);
        }

        return [$this->clientField([
            'key' => 'user_id',
            'label' => 'User ID',
            'required' => true,
            'type' => 'text',
        ])];
    }

    /**
     * Pad a fallback field out to the same shape OrderFormField::toClientArray()
     * emits, so the page's renderer only ever sees one contract.
     */
    private function clientField(array $field): array
    {
        return $field + [
            'min_length' => null,
            'max_length' => null,
            'pattern' => null,
            'options' => [],
            'placeholder' => null,
            'help' => null,
        ];
    }

    /**
     * Public-disk logo URL, or null when the file is missing / storage isn't linked
     * so the page can fall back to an initials tile instead of a broken image.
     */
    private function logoUrl(?string $logo): ?string
    {
        if (! $logo) {
            return null;
        }

        if (Str::startsWith($logo, ['http://', 'https://'])) {
            return $logo;
        }

        return Storage::disk('public')->exists($logo)
            ? Storage::disk('public')->url($logo)
            : null;
    }

    private function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)))
            ->filter()
            ->take(2)
            ->map(fn ($w) => Str::upper(Str::substr($w, 0, 1)))
            ->implode('');
    }
}

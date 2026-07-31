<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PaymentChannel;
use App\Models\Transaction;
use App\Support\Storefront\Catalog;
use App\Support\Storefront\MediaUrl;
use App\Support\Storefront\OrderFormFields;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $games = Catalog::sellableGames()
            ->orderBy('name')
            ->get(['id', 'name', 'sub_name', 'code', 'logo'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'sub_name' => $c->sub_name,
                'code' => $c->code,
                'logo_url' => MediaUrl::for($c->logo),
                'initials' => Catalog::initials($c->name),
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
        $products = Catalog::productsFor($category)
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
            'fields' => OrderFormFields::for($category),
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
}

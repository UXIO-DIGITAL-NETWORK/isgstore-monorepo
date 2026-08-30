<?php

namespace App\Actions\Checkout;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Actions\Storefront\ValidateGameIdAction;
use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Actions\Uxiotopup\ProcessUxiotopupTransactionAction;
use App\DTOs\Checkout\CheckoutDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Promo;
use App\Models\PromoRedemption;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use App\Support\Payment\DefaultMerchant;
use App\Support\Pricing\RolePrice;
use App\Support\Promo\PromoResolver;
use App\Support\Wallet\WalletLedger;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutAction
{
    public function __construct(
        private readonly ProcessUxiotopupTransactionAction $uxiotopupAction,
        private readonly CreateActivityLogAction $logAction,
        private readonly MonetapayService $monetapayService,
        private readonly SendTransactionReceiptAction $sendReceiptAction,
        private readonly SettleMerchantTransactionAction $settleAction,
        private readonly ValidateGameIdAction $validateGameIdAction
    ) {}

    public function execute(CheckoutDTO $dto): array
    {
        // Duplicate-submit guard: an identical checkout within 15s (double-tap,
        // client retry) is rejected instead of creating a second transaction.
        // Cache::add is atomic; the key is released on failure so the customer
        // can retry immediately after a rejected attempt.
        $identity = $dto->userId ?? $dto->guestContact ?? request()?->ip() ?? 'anon';
        $dedupeKey = 'checkout:dedupe:'.md5($identity.'|'.$dto->productId.'|'.$dto->paymentChannelId.'|'.$dto->targetUid.'|'.$dto->targetServer);

        if (! Cache::add($dedupeKey, 1, 15)) {
            throw new Exception('Permintaan duplikat terdeteksi. Mohon tunggu beberapa detik sebelum mencoba lagi.');
        }

        try {
            return $this->process($dto);
        } catch (Exception $e) {
            Cache::forget($dedupeKey);
            throw $e;
        }
    }

    private function process(CheckoutDTO $dto): array
    {
        // ── 1. Resolve entities (reads only — no transaction, no lock held) ──
        $user = $dto->userId ? User::with('role')->find($dto->userId) : null;
        $product = Product::with([
            'supplierProducts' => fn ($q) => $q->where('is_active', true),
            'category',
            'subCategory',
        ])->findOrFail($dto->productId);

        if (! $product->status) {
            throw new Exception('Produk sedang tidak tersedia.');
        }

        $channel = PaymentChannel::where('is_active', true)->findOrFail($dto->paymentChannelId);

        // Only VA / e-wallet / QRIS are offered; `balance` is the member
        // wallet (a different, allowed path below). Reject anything else even
        // if a stray active row is targeted directly — the list already hides
        // these, this stops a hand-crafted request.
        if ($channel->channel_code !== 'balance'
            && ! in_array($channel->payment_type, PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES, true)) {
            throw new Exception('Metode pembayaran ini tidak tersedia. Silakan pilih VA, E-Wallet, atau QRIS.');
        }

        // ── 2. Guest guards ──────────────────────────────────────────────────
        if (! $user && $channel->channel_code === 'balance') {
            throw new Exception('Saldo internal hanya untuk member. Silakan login atau pilih metode pembayaran lain.');
        }
        if (! $user && empty($dto->guestContact)) {
            throw new Exception('Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.');
        }

        // ── 3. Role-based price ──────────────────────────────────────────────
        // Shared with the public catalog so the quoted price and the billed
        // price come from one implementation.
        $sellingPrice = RolePrice::for($product, $user);

        // ── 4. Supplier & margin guard ───────────────────────────────────────
        $activeSupplier = $product->supplierProducts->first();
        if (! $activeSupplier) {
            throw new Exception('Produk sedang tidak tersedia (tidak ada supplier aktif).');
        }
        $margin = $sellingPrice - $activeSupplier->price;
        if ($margin < 0) {
            throw new Exception('Transaksi dibatalkan otomatis: harga modal supplier sedang naik.');
        }

        // ── 4b. Promo (resolve only — validate + discount) ───────────────────
        // The quota lock + redemption happens later, inside the write
        // transaction; here we only price the order. Re-resolved rather than
        // trusting whatever the client was quoted.
        $discount = 0;

        if ($dto->promoCode) {
            $result = PromoResolver::resolve($dto->promoCode, $sellingPrice, $user);

            if (! $result->valid) {
                throw new Exception($result->message);
            }

            // The discount comes out of margin, so a code worth more than
            // the margin would sell below cost. Refuse rather than quietly
            // honour less than the customer was promised — either outcome
            // is wrong, but only one of them loses money silently.
            if ($result->discount > $margin) {
                throw new Exception('Kode promo tidak dapat digunakan untuk produk ini.');
            }

            $discount = $result->discount;
            $sellingPrice -= $discount;
            $margin -= $discount;
        }

        // ── 5. Fee & total ───────────────────────────────────────────────────
        // Computed on the discounted price: the customer pays the fee on what
        // they are actually charged. The per-channel fee IS the "Biaya Admin"
        // the customer is shown — the markup lives in the channel's own
        // fee_flat/fee_percent, and there is no second global markup on top.
        // Kita's profit is this fee net of the gateway's real cut (see
        // SettleMerchantTransactionAction). Defaults to 0, so an unconfigured
        // channel charges exactly the product price.
        $feePercent = max(0, min(100, (float) $channel->fee_percent));
        $channelFee = $channel->fee_flat + (int) round($sellingPrice * ($feePercent / 100));
        $adminFee = $channelFee;
        $grossAmount = $sellingPrice + $adminFee;

        // The gateway's cut of the whole amount the customer pays, frozen now
        // rather than read from Monetapay's callback. Monetapay charges a flat
        // fee on VA/retail and a percent on QRIS/e-wallet — a channel carries
        // one or the other. Kita's profit is the admin fee net of this, so
        // settlement (SettleMerchantTransactionAction) reads it straight off the
        // payment row.
        $gatewayPercent = max(0, min(100, (float) $channel->gateway_fee_percent));
        $gatewayFee = (int) $channel->gateway_fee_flat + (int) round($grossAmount * ($gatewayPercent / 100));

        // Tax (PPN) is levied on the channel fee only and is kita's expense — it
        // reduces the platform profit at settlement, it is NOT added to what the
        // customer pays, so $grossAmount is deliberately left unchanged. Frozen
        // here so a later rate change never rewrites a booked transaction.
        $taxPercent = max(0, min(100, (float) $channel->tax_percent));
        $taxAmount = $channelFee > 0 ? (int) round($channelFee * ($taxPercent / 100)) : 0;

        if ($grossAmount < $channel->min_amount) {
            throw new Exception(
                'Total tagihan Rp '.number_format($grossAmount).
                ' kurang dari minimum pembayaran Rp '.number_format($channel->min_amount)
            );
        }

        // ── 6. Identifiers + frozen nickname ─────────────────────────────────
        $invoiceNumber = 'INV-'.date('Ymd').'-'.strtoupper(Str::random(6));
        $referenceId = 'PAY-'.$invoiceNumber.'-01';

        // Freeze the checked username. The client normally echoes it back, but
        // if it didn't, fall back to the name a recent "Cek Username" already
        // resolved (cache-only — never charges a new lookup) so the admin
        // record still carries it.
        $targetNickname = $dto->targetNickname
            ?: ($product->category
                ? $this->validateGameIdAction->cachedNickname($product->category, (string) $dto->targetUid, $dto->targetServer)
                : null);

        // ── 7. External gateway call ─────────────────────────────────────────
        // Kept out of the DB transaction so the HTTP round-trip never holds a
        // lock across the network; a gateway failure therefore persists nothing.
        // The one exception is a PROMO checkout: there the call is made *inside*
        // the transaction, after the promo row is locked and re-validated, so a
        // lost quota race can never mint a gateway order the local rows then roll
        // back — the losing racer fails the recheck before it ever calls the
        // gateway. Balance (wallet) never calls the gateway at all.
        $paymentInstructions = null;
        $pgTransactionId = null;

        $callGateway = function () use (
            $channel, $referenceId, $grossAmount, $sellingPrice, $user, $dto, $product,
            &$paymentInstructions, &$pgTransactionId,
        ): void {
            if ($channel->payment_type === 'payment_link') {
                $extra = $channel->extra_config ?? [];

                $plResponse = $this->monetapayService->createPaymentLink([
                    'mch_order_no' => $referenceId,
                    'amount' => (string) $grossAmount,
                    'currency' => 'IDR',
                    'regular_bank_codes' => $extra['regular_bank_codes'] ?? 'BNI',
                    'ewallet_bank_codes' => $extra['ewallet_bank_codes'] ?? 'DANA',
                    'qris_bank_code' => $extra['qris_bank_code'] ?? 'QRIS',
                    'terminal_type' => $extra['terminal_type'] ?? 'WAP',
                    'fixed_bank_code' => $extra['fixed_bank_code'] ?? '0',
                    'account_bank_code' => $extra['account_bank_code'] ?? '',
                    'sender_name' => $extra['sender_name'] ?? config('app.name'),
                    'account_name' => $user?->name ?? 'Guest',
                    'account_phone' => $user?->phone ?? $dto->guestContact ?? '',
                    'expire_seconds' => '36000',
                    'success_redirect_url' => config('services.monetapay.success_redirect_url'),
                    'failed_redirect_url' => config('services.monetapay.failed_redirect_url', ''),
                    'product_id' => (string) $product->id,
                    'product_name' => $product->name,
                    'product_category' => $product->category?->name ?? 'General',
                    'product_sub_category' => $product->subCategory?->name ?? '',
                    'product_description' => $product->name,
                    'product_price' => $sellingPrice,
                    'product_quantity' => 1,
                    'product_type' => 'PRODUCT',
                ]);

                if (($plResponse['code'] ?? -1) !== 0) {
                    throw new Exception('Payment Link creation failed: '.($plResponse['message'] ?? 'Unknown error'));
                }

                $plData = $plResponse['data'] ?? [];
                $paymentInstructions = array_filter([
                    'order_no' => $plData['order_no'] ?? null,
                    'checkout_url' => $plData['checkout_url'] ?? null,
                ]);
                $pgTransactionId = (string) ($plData['id'] ?? null);

                return;
            }

            $monetapayResponse = $this->monetapayService->createTransaction(
                referenceId: $referenceId,
                amount: $grossAmount,
                paymentType: $channel->payment_type,
                channelCode: $channel->channel_code,
                customerData: [
                    'customer_name' => $user?->name ?? 'Guest',
                    'customer_email' => $user?->email ?? 'guest@example.com',
                    'customer_phone' => $user?->phone ?? $dto->guestContact,
                    'is_single_use' => $channel->is_single_use ? '1' : '0',
                    'product_id' => (string) $product->id,
                    'product_name' => $product->name,
                    'product_price' => (string) $sellingPrice,
                    'product_category' => $product->category?->name ?? 'General',
                ]
            );

            $pgData = $monetapayResponse['data'] ?? [];
            $paymentInstructions = array_filter([
                'order_no' => $pgData['order_no'] ?? null,
                'qr_string' => $pgData['qr_string'] ?? null,
                'virtual_account' => $pgData['virtual_account'] ?? null,
                'bank_code' => $pgData['bank_code'] ?? null,
                'is_single_use' => $channel->payment_type === 'virtual_account'
                                        ? (bool) $channel->is_single_use
                                        : null,
            ], fn ($value) => $value !== null);
            $pgTransactionId = $pgData['order_no'] ?? null;
        };

        $isExternal = $channel->channel_code !== 'balance';
        // Defer the gateway call into the transaction only for a promo checkout,
        // so the quota lock is reserved before the order is minted.
        $gatewayInsideTx = $isExternal && (bool) $dto->promoCode;

        if ($isExternal && ! $gatewayInsideTx) {
            $callGateway();
        }

        // ── 8. Persist in one short transaction ──────────────────────────────
        $transactionStatus = TransactionStatus::PENDING;

        DB::transaction(function () use (
            $dto, $user, $product, $channel, $activeSupplier, $invoiceNumber, $referenceId,
            $targetNickname, $discount, $sellingPrice, $adminFee, $channelFee, $gatewayFee,
            $taxAmount, $taxPercent, $margin, $grossAmount, $callGateway, $gatewayInsideTx,
            &$paymentInstructions, &$pgTransactionId, &$transactionStatus,
        ) {
            // Promo: lock the row so two concurrent redemptions cannot both slip
            // past a quota of one, and re-validate under the lock (a slot may
            // have been taken since the pricing resolve above). The pre-computed
            // discount/amounts are kept — this is a quota gate, not a re-price.
            $promo = null;
            if ($dto->promoCode) {
                $promo = Promo::whereRaw('UPPER(code) = ?', [strtoupper(trim($dto->promoCode))])
                    ->lockForUpdate()
                    ->first();

                $recheck = PromoResolver::resolve($dto->promoCode, $sellingPrice + $discount, $user);
                if (! $recheck->valid) {
                    throw new Exception($recheck->message);
                }
            }

            // A promo checkout mints the gateway order here — under the promo
            // lock, after the quota recheck passed — so a losing racer (which
            // threw above) never creates an orphaned gateway order.
            if ($gatewayInsideTx) {
                $callGateway();
            }

            $transaction = Transaction::create([
                'transaction_type' => 'prepaid',
                'invoice_number' => $invoiceNumber,
                'user_id' => $user?->id,
                // The "client" that owns the sold product — settlement credits
                // them their net. Products carry no owner, so fall back to the
                // single default client merchant; that attribution is what makes
                // the sale appear in the payment-page feeds and settle at PAID.
                'merchant_id' => $product->merchant_id ?? DefaultMerchant::id(),
                'payment_channel_id' => $channel->id,
                'guest_contact' => $user ? null : $dto->guestContact,
                // Stored for everyone (guest + member): the receipt destination and
                // an order-tracking key. `locale` drives the receipt email language.
                'contact_email' => $dto->email,
                'locale' => $dto->locale ?? $user?->locale ?? 'id',
                'product_id' => $product->id,
                'supplier_id' => $activeSupplier->supplier_id,
                'target_uid' => $dto->targetUid,
                'target_server' => $dto->targetServer,
                'target_nickname' => $targetNickname,
                'promo_id' => $promo?->id,
                'amount_base' => $sellingPrice,
                'amount_fee' => $adminFee,
                'tax_amount' => $taxAmount,
                'tax_percent' => $taxPercent,
                'channel_fee' => $channelFee,
                // Always 0 now. The column is kept so historical rows — written
                // while a global markup existed — stay reconstructable.
                'admin_markup' => 0,
                'discount_amount' => $discount,
                'amount_total' => $grossAmount,
                'margin' => $margin,
                'status' => TransactionStatus::PENDING,
            ]);

            if ($promo) {
                PromoRedemption::create([
                    'promo_id' => $promo->id,
                    'user_id' => $user?->id,
                    'transaction_id' => $transaction->id,
                    'code_used' => $promo->code,
                    'discount_amount' => $discount,
                ]);

                // The redemption rows are the source of truth for quota; this
                // counter is the denormalised copy the admin list reads.
                $promo->increment('used_count');
            }

            $payment = Payment::create([
                'transaction_id' => $transaction->id,
                'payment_channel_id' => $channel->id,
                'reference_id' => $referenceId,
                'gross_amount' => $grossAmount,
                'admin_fee' => $adminFee,
                'channel_fee' => $channelFee,
                'admin_markup' => 0,
                'gateway_fee' => $gatewayFee,
                'tax_amount' => $taxAmount,
                'tax_percent' => $taxPercent,
                // Instructions/reference already obtained from the gateway above
                // (null for the balance path). Persisted so the invoice page can
                // re-render the QR/VA/link after a refresh.
                'pg_transaction_id' => $pgTransactionId,
                'payment_data' => $paymentInstructions ?: null,
                'status' => PaymentStatus::PENDING,
            ]);

            if ($channel->channel_code === 'balance') {
                // ── Balance path ─────────────────────────────────────────────
                // Pessimistic lock: re-fetch the user row FOR UPDATE inside the
                // open transaction so concurrent balance checkouts serialize.
                // Without this, two requests could both read the same balance,
                // both pass the guard, and both decrement (TOCTOU double-spend).
                $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

                if ($lockedUser->balance < $grossAmount) {
                    throw new Exception('Saldo tidak mencukupi. Sisa saldo: Rp '.number_format($lockedUser->balance));
                }

                // Through the ledger, not a raw decrement: the refund credit is
                // recorded as a `refund` mutation, and a statement showing money
                // coming back with nothing having gone out is worse than no
                // statement at all. WalletLedger re-locks the same row (already
                // held here) and writes the before/after figures.
                WalletLedger::record(
                    user: $lockedUser->id,
                    amount: -$grossAmount,
                    type: 'purchase',
                    reference: $transaction->invoice_number,
                    description: "Pembelian {$transaction->invoice_number}",
                );

                $payment->update(['status' => PaymentStatus::SUCCESS, 'paid_at' => now()]);

                // Balance channel has no external gateway cost, so kita keeps
                // the full admin fee (gateway_fee stays 0). Credit the merchant
                // and record kita's markup — no-op if platform-owned.
                $this->settleAction->execute($transaction);

                // uxiotopup fulfilment stays inside the transaction so an
                // infrastructure *exception* rolls the wallet charge back with
                // it; the lock held is the buyer's own row (per-user contention),
                // not the shared promo row. (A FAILED_PROVIDER *result* — uxiotopup
                // "cancel"/"refund" — is a normal return, not an exception, so it
                // commits; refunding that case is unchanged by this refactor.)
                $transaction = $this->uxiotopupAction->execute($transaction);
                $transactionStatus = $transaction->status; // COMPLETED / PROCESSING / FAILED_PROVIDER

                // Fulfilled synchronously from balance — email the receipt now.
                // Queued mail participates in this DB transaction, so it is only
                // delivered if the checkout commits.
                if ($transactionStatus === TransactionStatus::COMPLETED) {
                    $this->sendReceiptAction->execute($transaction);
                }
            }

            // ── Activity log ─────────────────────────────────────────────────
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $user?->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Checkout {$invoiceNumber} — {$product->name}".(! $user ? ' (Guest)' : ''),
            ));
        });

        // ── 9. Response ──────────────────────────────────────────────────────
        return [
            'invoice_number' => $invoiceNumber,
            'reference_id' => $referenceId,
            'product' => [
                'name' => $product->name,
                'price' => $sellingPrice,
            ],
            'payment' => [
                'channel' => $channel->name,
                'type' => $channel->payment_type,
                'amount' => $grossAmount,
                'admin_fee' => $adminFee, // "Biaya Admin" = the channel's fee
                'status' => $transactionStatus,
                'instructions' => $paymentInstructions ?: null,
            ],
        ];
    }
}

<?php

namespace Database\Seeders;

use App\Actions\Service\ConfirmServiceInvoiceAction;
use App\DTOs\Service\ConfirmServiceInvoiceDTO;
use App\Enums\RoleType;
use App\Enums\ServiceInvoiceStatus;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceInstallationStep;
use App\Models\ServiceInvoice;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo data for the payment page, so its screens have something to show.
 *
 * Deliberately NOT registered in DatabaseSeeder — run it explicitly:
 *
 *     php artisan db:seed --class=PaymentPageDemoSeeder
 *
 * It claims real catalogue rows for a merchant, which is exactly the mutation
 * that must never reach production. Guarded twice (the environment check below
 * and the exclusion from DatabaseSeeder) because either alone is one careless
 * edit away from failing.
 */
class PaymentPageDemoSeeder extends Seeder
{
    private const STATUSES = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PAID', 'PENDING', 'FAILED_PROVIDER'];

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Demo seeder skipped in production.');

            return;
        }

        $merchant = User::whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', [RoleType::PAYMENT_ADMIN->value]))
            ->orderBy('id')
            ->first();

        if (! $merchant) {
            $this->command?->error('No payment-admin user found. Run UserSeeder first.');

            return;
        }

        $products = $this->claimProducts($merchant);

        if ($products->isEmpty()) {
            $this->command?->error('No products available to attribute to the merchant.');

            return;
        }

        $this->seedSales($merchant, $products);
        $this->seedServiceBills($merchant);

        $this->command?->info("Demo data ready for {$merchant->email}.");
    }

    /**
     * The missing link: nothing in this codebase ever sets `products.merchant_id`,
     * so without this a real checkout still writes `transactions.merchant_id = null`
     * and the client's Transaksi page stays empty forever.
     */
    private function claimProducts(User $merchant)
    {
        Product::whereNull('merchant_id')->limit(6)->update(['merchant_id' => $merchant->id]);

        return Product::where('merchant_id', $merchant->id)->limit(6)->get();
    }

    private function seedSales(User $merchant, $products): void
    {
        $channel = PaymentChannel::where('is_active', true)->first()
            ?? PaymentChannel::factory()->create(['name' => 'QRIS', 'channel_code' => 'qris']);

        foreach (range(0, 11) as $i) {
            $product = $products[$i % $products->count()];
            $base = (int) ($product->price_member ?: 20000);
            $channelFee = 1000;
            $status = self::STATUSES[$i % count(self::STATUSES)];
            $createdAt = now()->subDays(30 - ($i * 2))->setTime(9 + ($i % 8), 15);

            $transaction = Transaction::create([
                'transaction_type' => 'prepaid',
                'invoice_number' => 'INV-'.$createdAt->format('Ymd').'-'.strtoupper(Str::random(6)),
                'merchant_id' => $merchant->id,
                'product_id' => $product->id,
                'payment_channel_id' => $channel->id,
                'target_uid' => (string) fake()->numberBetween(10000000, 99999999),
                'amount_base' => $base,
                'amount_fee' => $channelFee,
                'channel_fee' => $channelFee,
                'admin_markup' => 0,
                'amount_total' => $base + $channelFee,
                'margin' => (int) round($base * 0.15),
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            Payment::create([
                'transaction_id' => $transaction->id,
                'payment_channel_id' => $channel->id,
                'reference_id' => 'PAY-'.$transaction->invoice_number.'-01',
                'gross_amount' => $base + $channelFee,
                'admin_fee' => $channelFee,
                'channel_fee' => $channelFee,
                'admin_markup' => 0,
                // Non-zero so platform_profit is not trivially equal to the fee.
                'gateway_fee' => $status === 'PENDING' ? 0 : 700,
                'status' => $status === 'PENDING' ? '1' : '3',
                'paid_at' => $status === 'PENDING' ? null : $createdAt,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }

    private function seedServiceBills(User $merchant): void
    {
        $services = Service::orderBy('sort_order')->take(4)->get();

        if ($services->count() < 3) {
            $this->command?->warn('Fewer than 3 services seeded; run ServiceSeeder for the full demo.');
        }

        $confirm = app(ConfirmServiceInvoiceAction::class);

        // Two paid ones — driven through the real action so the subscription and
        // its installation arrive by the same code path production uses.
        foreach ($services->take(2) as $service) {
            $invoice = $this->bill($merchant, $service, ServiceInvoiceStatus::WAITING_CONFIRMATION, now()->subDays(9));
            $confirm->execute(new ConfirmServiceInvoiceDTO($invoice->id, $merchant->id));
        }

        if ($services->count() > 2) {
            $this->bill($merchant, $services[2], ServiceInvoiceStatus::UNPAID, now()->subDay());
        }

        if ($services->count() > 3) {
            $this->bill($merchant, $services[3], ServiceInvoiceStatus::WAITING_CONFIRMATION, now()->subDays(2));
        }

        $this->seedInstallationDetail($merchant);
    }

    private function bill(User $merchant, Service $service, ServiceInvoiceStatus $status, $createdAt): ServiceInvoice
    {
        return ServiceInvoice::create([
            'invoice_number' => 'SINV-'.$createdAt->format('Ym').'-'.strtoupper(Str::random(6)),
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'service_name' => $service->name,
            'amount' => (int) $service->price,
            'duration_days' => (int) $service->duration_days,
            'status' => $status,
            'due_at' => $createdAt->copy()->addDays(3),
            'proof_path' => $status === ServiceInvoiceStatus::WAITING_CONFIRMATION
                ? 'service-invoices/proofs/demo-bukti.jpg'
                : null,
            'proof_uploaded_at' => $status === ServiceInvoiceStatus::WAITING_CONFIRMATION ? $createdAt : null,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    /** A half-finished install on the first service, with one secret. */
    private function seedInstallationDetail(User $merchant): void
    {
        $installation = ServiceInstallation::where('merchant_id', $merchant->id)->orderBy('id')->first();

        if (! $installation || $installation->steps()->exists()) {
            return;
        }

        $installation->update([
            'starts_at' => now()->subDays(6),
            'ends_at' => now()->addDay(),
            'notes' => 'Menunggu whitelist IP dari sisi klien.',
        ]);

        $steps = [
            ['Verifikasi akun', true],
            ['Pembuatan API key', true],
            ['Konfigurasi callback', false],
            ['Uji transaksi', false],
        ];

        foreach ($steps as $i => [$title, $done]) {
            ServiceInstallationStep::create([
                'service_installation_id' => $installation->id,
                'title' => $title,
                'sort_order' => $i + 1,
                'completed_at' => $done ? now()->subDays(5 - $i) : null,
            ]);
        }

        $details = [
            ['Username', 'uxio-prod', false],
            ['Webhook URL', 'https://api.uxio.test/callback/digiflazz', false],
            ['API Key', 'sk_live_'.Str::random(24), true],
        ];

        foreach ($details as $i => [$label, $value, $secret]) {
            ServiceInstallationDetail::create([
                'service_installation_id' => $installation->id,
                'label' => $label,
                'value' => $value,
                'is_secret' => $secret,
                'sort_order' => $i + 1,
            ]);
        }
    }
}

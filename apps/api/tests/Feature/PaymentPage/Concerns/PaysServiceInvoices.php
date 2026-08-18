<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage\Concerns;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

/**
 * Shared setup for the service-billing tests: the two roles, a gateway that
 * answers, and the two-line "subscribe and open payment" a client performs.
 */
trait PaysServiceInvoices
{
    protected function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    protected function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    protected function qrisChannel(array $overrides = []): PaymentChannel
    {
        return $this->channel(['payment_type' => 'qris', 'channel_code' => 'qris', 'name' => 'QRIS'], $overrides);
    }

    protected function vaChannel(array $overrides = []): PaymentChannel
    {
        return $this->channel(
            ['payment_type' => 'virtual_account', 'channel_code' => 'bca_va', 'name' => 'BCA Virtual Account'],
            $overrides,
        );
    }

    /**
     * `channel_code` is unique, so asking for the same method twice in one test
     * has to return the same row rather than collide — several tests subscribe
     * more than once.
     */
    private function channel(array $defaults, array $overrides): PaymentChannel
    {
        $attributes = array_merge($defaults, $overrides);

        return PaymentChannel::firstOrCreate(
            ['channel_code' => $attributes['channel_code']],
            PaymentChannel::factory()->make($attributes)->getAttributes(),
        );
    }

    /**
     * Stand in for Monetapay. `preventStrayRequests` makes an unfaked call a
     * test failure rather than a real network hit.
     */
    protected function fakeGateway(array $data = ['order_no' => 'MP-1', 'qr_string' => '000201-QR']): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => $data])]);
    }

    /** The client's whole purchase: issue the bill and open its payment. */
    protected function subscribe(User $merchant, Service $service, ?PaymentChannel $channel = null): ServiceInvoice
    {
        $channel ??= $this->qrisChannel();

        Sanctum::actingAs($merchant);

        $response = $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $channel->id,
        ])->assertCreated();

        return ServiceInvoice::findOrFail($response->json('data.id'));
    }
}

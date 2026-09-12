<?php

namespace Tests\Feature\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsTransactionStatusAction;
use App\Actions\Uxiolabs\SendUxiolabsStatusNotificationAction;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The supplier half of the operational channel.
 *
 * Monetapay announced every payment it took; fulfilment announced nothing
 * unless the supplier callback happened to fire. So the channel read "💳
 * Pembayaran Diterima" and then went silent — and an operator could not tell a
 * delivered order from one that died on the supplier's side without opening the
 * admin panel and looking it up by hand.
 *
 * What made that gap wide rather than narrow: the callback is the *unreliable*
 * path. `PollUxiolabsStatusJob` exists precisely because it cannot be trusted,
 * which means the one path that reported to Discord was the one least likely to
 * be the one that resolved the order.
 */
class ProviderStatusLogTest extends TestCase
{
    use RefreshDatabase;

    private const HOOK = 'https://discord.test/hook';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.discord.webhook_log_url' => self::HOOK,
            'services.uxiolabs.callback_ips' => '127.0.0.1',
        ]);
    }

    /** Supplier answers `$status`; Discord accepts anything. */
    private function fakeSupplier(string $status, string $sn = 'SN-OK'): void
    {
        Http::fake([
            'api.uxiotopup.id/*' => Http::response([
                'status' => true,
                'data' => ['status' => $status, 'keterangan' => $sn],
            ]),
            'discord.test/*' => Http::response([], 204),
        ]);
    }

    /** @return array<int,array<string,mixed>> the embeds actually posted to Discord */
    private function embeds(): array
    {
        $embeds = [];

        foreach (Http::recorded() as [$request]) {
            if (str_contains($request->url(), 'discord.test')) {
                $embeds[] = $request['embeds'][0];
            }
        }

        return $embeds;
    }

    /** @return array<int,string> */
    private function titles(): array
    {
        return array_column($this->embeds(), 'title');
    }

    private function field(array $embed, string $name): ?string
    {
        foreach ($embed['fields'] ?? [] as $f) {
            if ($f['name'] === $name) {
                return $f['value'];
            }
        }

        return null;
    }

    // ── The gap that started this ───────────────────────────────────────────

    public function test_an_order_resolved_by_polling_is_announced(): void
    {
        // The path most orders actually finish on, and the one that used to
        // report nothing at all. A customer paid, the supplier delivered, and
        // the channel never said so.
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-1',
        ]);

        $this->fakeSupplier('success');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $this->assertSame(['[UXIOLABS] ✅ Topup Berhasil'], $this->titles());
        $this->assertSame(
            'Polling status',
            $this->field($this->embeds()[0], '📡 Sumber'),
            'The channel must say how we learned it — "the callback told us" and "we went and asked" are different facts.'
        );
    }

    public function test_a_failed_order_resolved_by_polling_is_announced(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-2',
        ]);

        $this->fakeSupplier('cancel');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $this->assertSame(['[UXIOLABS] ❌ Topup Gagal'], $this->titles());
    }

    // ── Not becoming the next flood ─────────────────────────────────────────

    public function test_the_callback_and_the_poll_racing_the_same_move_announce_once(): void
    {
        // Both are *meant* to run — either may be the one that survives — so
        // the dedupe has to live below them rather than in a choice of which to
        // keep. Announcing per writer would double every fulfilment.
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-3',
        ]);

        $this->fakeSupplier('success');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $this->postJson('/api/v1/uxiolabs/callback', [
            'id' => 'UX-3',
            'idtrx' => $transaction->invoice_number,
            'keterangan' => 'SN-OK',
            'status' => 'success',
        ])->assertOk();

        $this->assertSame(['[UXIOLABS] ✅ Topup Berhasil'], $this->titles());
    }

    public function test_a_poll_that_finds_no_movement_says_nothing(): void
    {
        // The supplier re-reports `processing` for as long as an order is in
        // flight, and the poll chain asks every few seconds. A message per poll
        // is what buried the signal the last time.
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-4',
        ]);

        $this->fakeSupplier('processing');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);
        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $this->assertSame([], $this->titles());
    }

    // ── Source labelling ────────────────────────────────────────────────────

    public function test_an_admins_manual_check_is_labelled_as_one(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-5',
        ]);

        $this->fakeSupplier('success');

        app(CheckUxiolabsTransactionStatusAction::class)->execute(
            $transaction->invoice_number,
            SendUxiolabsStatusNotificationAction::SOURCE_MANUAL,
        );

        $this->assertSame('Cek manual admin', $this->field($this->embeds()[0], '📡 Sumber'));
    }

    public function test_the_callback_is_labelled_as_the_callback(): void
    {
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        Http::fake(['discord.test/*' => Http::response([], 204)]);

        $this->postJson('/api/v1/uxiolabs/callback', [
            'id' => 'UX-6',
            'idtrx' => $transaction->invoice_number,
            'keterangan' => 'SN-OK',
            'status' => 'success',
        ])->assertOk();

        $this->assertSame(['[UXIOLABS] ✅ Topup Berhasil'], $this->titles());
        $this->assertSame('Callback supplier', $this->field($this->embeds()[0], '📡 Sumber'));
    }

    // ── The handoff ─────────────────────────────────────────────────────────

    public function test_the_handoff_carries_the_suppliers_own_order_id(): void
    {
        // `supplier_trx_id` is the only key that opens the order on the
        // supplier's dashboard, and it reaches the channel nowhere else.
        $announce = app(SendUxiolabsStatusNotificationAction::class);

        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-7',
            'supplier_status' => 'pending',
        ]);

        Http::fake(['discord.test/*' => Http::response([], 204)]);

        $announce->handoff($transaction);

        $this->assertSame(['[UXIOLABS] 🚀 Order Diteruskan ke Supplier'], $this->titles());
        $this->assertSame('`UX-7`', $this->field($this->embeds()[0], '🆔 ID Supplier'));
    }

    public function test_a_handoff_with_no_supplier_id_says_so_rather_than_going_blank(): void
    {
        // The duplicate-idtrx shape: the supplier holds the order but never gave
        // its id back, so only the callback can finish it. An operator who can
        // see that in the channel knows not to wait for a poll that cannot run.
        $announce = app(SendUxiolabsStatusNotificationAction::class);

        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => null,
        ]);

        Http::fake(['discord.test/*' => Http::response([], 204)]);

        $announce->handoff($transaction);

        $this->assertSame('*Belum diberikan supplier*', $this->field($this->embeds()[0], '🆔 ID Supplier'));
    }

    public function test_a_repeated_handoff_for_one_order_is_announced_once(): void
    {
        // ProcessUxiolabsTopup retries three times, and a retry that reaches the
        // supplier again is still the same order being handed over.
        $announce = app(SendUxiolabsStatusNotificationAction::class);
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        Http::fake(['discord.test/*' => Http::response([], 204)]);

        $announce->handoff($transaction);
        $announce->handoff($transaction);

        $this->assertCount(1, $this->titles());
    }

    // ── Shape ───────────────────────────────────────────────────────────────

    public function test_a_status_embed_reads_like_the_monetapay_ones(): void
    {
        // The two halves of one order's life land in the same channel minutes
        // apart. Matching field names is what lets an operator read them as one
        // story instead of two systems reporting separately.
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-8',
        ]);

        $this->fakeSupplier('success', 'SN-XYZ');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $embed = $this->embeds()[0];

        $this->assertSame('`'.$transaction->invoice_number.'`', $this->field($embed, '🧾 Invoice'));
        $this->assertNotNull($this->field($embed, '🛒 Produk'));
        $this->assertNotNull($this->field($embed, '📱 Target'));
        $this->assertSame('~~PROCESSING~~ ➔ **COMPLETED**', $this->field($embed, '📊 Status'));
        $this->assertSame('`SN-XYZ`', $this->field($embed, '🔑 Serial Number'));
    }

    public function test_it_stays_silent_outside_production_like_every_other_notice(): void
    {
        // The environment guard belongs to DiscordWebhookService and this class
        // must not have found a way around it.
        app()['env'] = 'local';

        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UX-9',
        ]);

        $this->fakeSupplier('success');

        app(CheckUxiolabsTransactionStatusAction::class)->execute($transaction->invoice_number);

        $this->assertSame([], $this->titles());
        $this->assertSame(
            TransactionStatus::COMPLETED,
            $transaction->fresh()->status,
            'Silence in the channel must not mean the order stopped being fulfilled.'
        );
    }
}

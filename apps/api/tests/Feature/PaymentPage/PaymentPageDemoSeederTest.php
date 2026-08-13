<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Product;
use App\Models\Role;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\PaymentPageDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentPageDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    private function scene(): User
    {
        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
            'email' => 'client@example.com',
        ]);
        Product::factory()->count(6)->create(['merchant_id' => null]);
        Service::factory()->count(4)->create();

        return $merchant;
    }

    public function test_it_gives_the_client_sales_and_service_bills(): void
    {
        $merchant = $this->scene();

        $this->seed(PaymentPageDemoSeeder::class);

        // The missing link: without owned products, a sale can never be
        // attributed and the client's Transaksi page stays empty forever.
        $this->assertGreaterThan(0, Product::where('merchant_id', $merchant->id)->count());

        $this->assertDatabaseCount('transactions', 12);
        $this->assertSame(12, Transaction::where('merchant_id', $merchant->id)->count());
        $this->assertDatabaseCount('service_invoices', 4);
        // Two confirmed bills, driven through the real action.
        $this->assertDatabaseCount('service_subscriptions', 2);
        $this->assertDatabaseCount('service_installations', 2);
        $this->assertDatabaseCount('service_installation_steps', 4);
        $this->assertDatabaseCount('service_installation_details', 3);
    }

    /**
     * The blast radius is a write to real catalogue rows, so the seeder carries
     * its own guard rather than relying on `db:seed`'s production prompt — this
     * invokes the class directly to prove that guard, not the command's.
     */
    public function test_it_is_a_no_op_in_production(): void
    {
        $merchant = $this->scene();
        app()->detectEnvironment(fn () => 'production');

        (new PaymentPageDemoSeeder)->setContainer(app())->run();

        $this->assertDatabaseCount('transactions', 0);
        $this->assertSame(0, Product::where('merchant_id', $merchant->id)->count());
    }

    public function test_running_it_twice_does_not_duplicate_the_installation_checklist(): void
    {
        $this->scene();

        $this->seed(PaymentPageDemoSeeder::class);
        $this->seed(PaymentPageDemoSeeder::class);

        // Installations are per (client, service), so the second run reuses them.
        $this->assertDatabaseCount('service_installations', 2);
        $this->assertDatabaseCount('service_installation_steps', 4);
    }
}

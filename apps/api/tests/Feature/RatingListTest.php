<?php

namespace Tests\Feature;

use App\Enums\TransactionStatus;
use App\Models\Product;
use App\Models\Rating;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RatingListTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_it_requires_admin(): void
    {
        $this->getJson('/api/v1/ratings')->assertUnauthorized();
    }

    public function test_it_lists_member_and_guest_ratings_with_product(): void
    {
        $this->actingAsAdmin();

        $product = Product::factory()->create(['name' => 'Mobile Legends 100 Diamond']);

        $memberRole = Role::factory()->create(['name' => 'Member']);
        $member = User::factory()->create(['role_id' => $memberRole->id, 'name' => 'Budi']);
        $memberTx = Transaction::factory()->create([
            'user_id' => $member->id,
            'product_id' => $product->id,
            'status' => TransactionStatus::COMPLETED,
        ]);
        Rating::create(['transaction_id' => $memberTx->id, 'user_id' => $member->id, 'rating' => 5, 'comment' => 'Mantap']);

        $guestTx = Transaction::factory()->create([
            'user_id' => null,
            'product_id' => $product->id,
            'status' => TransactionStatus::COMPLETED,
        ]);
        Rating::create(['transaction_id' => $guestTx->id, 'user_id' => null, 'guest_name' => 'Guest K48213', 'rating' => 4, 'comment' => 'Cepat']);

        $response = $this->getJson('/api/v1/ratings')->assertOk();

        // Newest first (guest was created last).
        $rows = collect($response->json('data.data'));
        $this->assertCount(2, $rows);

        $guest = $rows->firstWhere('rating', 4);
        $this->assertNull($guest['user_id']);
        $this->assertSame('Guest K48213', $guest['guest_name']);
        $this->assertSame('Mobile Legends 100 Diamond', $guest['transaction']['product']['name']);

        $memberRow = $rows->firstWhere('rating', 5);
        $this->assertSame($member->id, $memberRow['user_id']);
        $this->assertSame('Budi', $memberRow['user']['name']);
    }
}

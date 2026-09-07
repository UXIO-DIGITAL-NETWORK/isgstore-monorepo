<?php

namespace Tests\Feature\Storefront;

use App\Enums\TransactionStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Rating;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestTransactionRatingTest extends TestCase
{
    use RefreshDatabase;

    private function completedGuestTransaction(?Category $game = null): Transaction
    {
        $game ??= Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $game->id]);

        // Factory defaults user_id to null — a guest transaction.
        return Transaction::factory()->create([
            'product_id' => $product->id,
            'status' => TransactionStatus::COMPLETED,
        ]);
    }

    public function test_guest_can_rate_a_completed_order_and_gets_a_generated_name(): void
    {
        $transaction = $this->completedGuestTransaction();

        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", [
            'rating' => 5,
            'comment' => 'Mantap, cepat!',
        ])
            ->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJson(fn ($json) => $json->where('data.guest_name', fn ($n) => (bool) preg_match('/^Guest [A-Z]\d{5}$/', $n))->etc());

        $rating = Rating::where('transaction_id', $transaction->id)->first();
        $this->assertNotNull($rating);
        $this->assertNull($rating->user_id);
        $this->assertSame(5, $rating->rating);
        $this->assertMatchesRegularExpression('/^Guest [A-Z]\d{5}$/', $rating->guest_name);
    }

    public function test_it_rejects_a_member_owned_invoice(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $member = User::factory()->create(['role_id' => $role->id]);
        $product = Product::factory()->create();
        $transaction = Transaction::factory()->create([
            'user_id' => $member->id,
            'product_id' => $product->id,
            'status' => TransactionStatus::COMPLETED,
        ]);

        // A member's invoice is indistinguishable from one that does not exist.
        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 5])
            ->assertStatus(422);

        $this->assertDatabaseCount('ratings', 0);
    }

    public function test_it_rejects_an_unfinished_transaction(): void
    {
        $transaction = Transaction::factory()->create([
            'product_id' => Product::factory(),
            'status' => TransactionStatus::PENDING,
        ]);

        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 4])
            ->assertStatus(422);
    }

    public function test_it_rejects_a_second_rating_for_the_same_order(): void
    {
        $transaction = $this->completedGuestTransaction();

        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 5])->assertCreated();
        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 1])->assertStatus(422);

        $this->assertDatabaseCount('ratings', 1);
    }

    public function test_it_validates_the_rating_value(): void
    {
        $transaction = $this->completedGuestTransaction();

        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 6])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rating');
    }

    public function test_the_guest_name_shows_verbatim_on_the_public_reviews_list(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $transaction = $this->completedGuestTransaction($game);

        $this->postJson("/api/v1/transactions/{$transaction->invoice_number}/rating", ['rating' => 5, 'comment' => 'ok'])
            ->assertCreated();

        $guestName = Rating::where('transaction_id', $transaction->id)->value('guest_name');

        $this->getJson("/api/v1/games/{$game->slug}/reviews")
            ->assertOk()
            ->assertJsonPath('data.reviews.data.0.author', $guestName);
    }
}

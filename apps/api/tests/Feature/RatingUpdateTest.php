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

/**
 * Admin moderation of customer reviews.
 *
 * `ratings.user_id` became nullable when guest reviews landed, but the update
 * request still required it and had no `comment` field at all — so a guest
 * review could not be edited, and no review's text could be corrected.
 */
class RatingUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function completedTransaction(?int $userId = null): Transaction
    {
        return Transaction::factory()->create([
            'user_id' => $userId,
            'product_id' => Product::factory()->create()->id,
            'status' => TransactionStatus::COMPLETED,
        ]);
    }

    public function test_it_requires_admin(): void
    {
        $transaction = $this->completedTransaction();
        $rating = Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'guest_name' => 'Guest K48213',
            'rating' => 4,
        ]);

        $this->putJson("/api/v1/ratings/{$rating->id}", [
            'transaction_id' => $transaction->id,
            'rating' => 3,
        ])->assertUnauthorized();
    }

    public function test_it_updates_a_guest_rating_without_a_user_id(): void
    {
        $this->actingAsAdmin();

        $transaction = $this->completedTransaction();
        $rating = Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'guest_name' => 'Guest K48213',
            'rating' => 4,
            'comment' => 'Cepat',
        ]);

        $this->putJson("/api/v1/ratings/{$rating->id}", [
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'rating' => 3,
            'comment' => 'Cepat, tapi sempat error',
        ])->assertOk();

        $rating->refresh();
        $this->assertNull($rating->user_id);
        $this->assertSame('Guest K48213', $rating->guest_name);
        $this->assertSame(3, $rating->rating);
        $this->assertSame('Cepat, tapi sempat error', $rating->comment);
    }

    public function test_it_persists_the_comment_on_a_member_rating(): void
    {
        $this->actingAsAdmin();

        $memberRole = Role::factory()->create(['name' => 'Member']);
        $member = User::factory()->create(['role_id' => $memberRole->id]);
        $transaction = $this->completedTransaction($member->id);

        $rating = Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => $member->id,
            'rating' => 5,
            'comment' => 'Mantap',
        ]);

        $this->putJson("/api/v1/ratings/{$rating->id}", [
            'transaction_id' => $transaction->id,
            'user_id' => $member->id,
            'rating' => 5,
            'comment' => 'Mantap sekali',
        ])->assertOk()->assertJsonPath('data.comment', 'Mantap sekali');

        $this->assertSame('Mantap sekali', $rating->refresh()->comment);
    }

    public function test_it_rejects_a_comment_over_the_limit(): void
    {
        $this->actingAsAdmin();

        $transaction = $this->completedTransaction();
        $rating = Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'rating' => 4,
        ]);

        $this->putJson("/api/v1/ratings/{$rating->id}", [
            'transaction_id' => $transaction->id,
            'rating' => 4,
            'comment' => str_repeat('a', 1001),
        ])->assertStatus(422)->assertJsonValidationErrors('comment');
    }

    public function test_it_deletes_a_rating(): void
    {
        $this->actingAsAdmin();

        $transaction = $this->completedTransaction();
        $rating = Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'rating' => 1,
            'comment' => 'spam spam spam',
        ]);

        $this->deleteJson("/api/v1/ratings/{$rating->id}")->assertOk();

        $this->assertDatabaseMissing('ratings', ['id' => $rating->id]);
    }
}

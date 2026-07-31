<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Category;
use App\Models\Rating;
use App\Support\Storefront\Mask;
use Illuminate\Database\Eloquent\Builder;

/**
 * Customer reviews for one game, plus the star breakdown shown beside them.
 *
 * Reviews are reachable only through a completed transaction, so a rating here
 * is always attached to a real purchase of a real product in this category.
 */
class ListGameReviewsAction
{
    /** @return array{summary: array<string, mixed>, reviews: array<string, mixed>} */
    public function execute(Category $game, int $perPage = 5): array
    {
        $scoped = fn () => Rating::query()->whereHas(
            'transaction',
            fn (Builder $q) => $q->whereHas('product', fn (Builder $p) => $p->where('category_id', $game->id))
        );

        $counts = $scoped()
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        $total = (int) $counts->sum();
        $sum = $counts->reduce(fn (int $carry, int $count, int $stars) => $carry + ($stars * $count), 0);

        $reviews = $scoped()
            ->with(['user:id,name,username', 'transaction:id,product_id,target_uid', 'transaction.product:id,name'])
            ->latest('id')
            ->paginate($perPage)
            ->through(fn (Rating $rating) => [
                'id' => $rating->id,
                'author' => Mask::name($rating->user?->username ?: $rating->user?->name),
                'rating' => (int) $rating->rating,
                'comment' => $rating->comment,
                'masked_user_id' => Mask::gameId($rating->transaction?->target_uid),
                'product' => $rating->transaction?->product?->name,
                'created_at' => $rating->created_at?->toIso8601String(),
            ]);

        return [
            'summary' => [
                'average' => $total > 0 ? round($sum / $total, 1) : 0.0,
                'total' => $total,
                'breakdown' => collect(range(5, 1))
                    ->map(fn (int $stars) => [
                        'stars' => $stars,
                        'count' => (int) ($counts[$stars] ?? 0),
                        'percentage' => $total > 0 ? (int) round(($counts[$stars] ?? 0) / $total * 100) : 0,
                    ])
                    ->all(),
            ],
            'reviews' => $reviews,
        ];
    }
}

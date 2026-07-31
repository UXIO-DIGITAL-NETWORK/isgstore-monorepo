<?php

namespace App\Actions\Content;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Content\FaqDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Faq;
use Illuminate\Support\Facades\Auth;

class SaveFaqAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(FaqDTO $dto, ?Faq $faq = null): Faq
    {
        $attributes = [
            'question' => $dto->question,
            'answer' => $dto->answer,
            'group' => $dto->group,
            'locale' => $dto->locale,
            'sort_order' => $dto->sortOrder,
            'is_active' => $dto->isActive,
        ];

        if ($faq === null) {
            $faq = Faq::create($attributes);
            $verb = 'created';
        } else {
            $faq->update($attributes);
            $verb = 'updated';
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin {$verb} FAQ: {$dto->question}",
        ));

        return $faq->fresh();
    }
}

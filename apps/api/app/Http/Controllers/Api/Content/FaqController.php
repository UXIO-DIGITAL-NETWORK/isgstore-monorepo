<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Content\SaveFaqAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Content\FaqRequest;
use App\Http\Resources\Api\Content\FaqResource;
use App\Models\Faq;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $faqs = Faq::query()
            ->when($search, fn ($q) => $q->where('question', 'like', "%{$search}%"))
            ->when($request->query('locale'), fn ($q, $locale) => $q->where('locale', $locale))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate($perPage);

        return $this->paginatedResponse(FaqResource::collection($faqs), 'FAQs retrieved successfully');
    }

    public function store(FaqRequest $request, SaveFaqAction $action)
    {
        return $this->successResponse(new FaqResource($action->execute($request->toDTO())), 'FAQ created successfully', 201);
    }

    public function show(Faq $faq)
    {
        return $this->successResponse(new FaqResource($faq), 'FAQ retrieved successfully');
    }

    public function update(FaqRequest $request, Faq $faq, SaveFaqAction $action)
    {
        return $this->successResponse(new FaqResource($action->execute($request->toDTO(), $faq)), 'FAQ updated successfully');
    }

    public function destroy(Faq $faq, DeleteContentAction $action)
    {
        $action->execute($faq, "FAQ: {$faq->question}");

        return $this->successResponse(null, 'FAQ deleted successfully');
    }
}

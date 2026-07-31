<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Content\SaveTestimonialAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Content\TestimonialRequest;
use App\Http\Resources\Api\Content\TestimonialResource;
use App\Models\Testimonial;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $testimonials = Testimonial::query()
            ->when($search, fn ($q) => $q->where('author_name', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate($perPage);

        return $this->paginatedResponse(
            TestimonialResource::collection($testimonials),
            'Testimonials retrieved successfully'
        );
    }

    public function store(TestimonialRequest $request, SaveTestimonialAction $action)
    {
        return $this->successResponse(
            new TestimonialResource($action->execute($request->toDTO())),
            'Testimonial created successfully',
            201
        );
    }

    public function show(Testimonial $testimonial)
    {
        return $this->successResponse(new TestimonialResource($testimonial), 'Testimonial retrieved successfully');
    }

    public function update(TestimonialRequest $request, Testimonial $testimonial, SaveTestimonialAction $action)
    {
        return $this->successResponse(
            new TestimonialResource($action->execute($request->toDTO(), $testimonial)),
            'Testimonial updated successfully'
        );
    }

    public function destroy(Testimonial $testimonial, DeleteContentAction $action)
    {
        $action->execute($testimonial, "testimonial by: {$testimonial->author_name}", 'avatar_path');

        return $this->successResponse(null, 'Testimonial deleted successfully');
    }
}

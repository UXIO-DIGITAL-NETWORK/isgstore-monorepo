<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Content\SavePageAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Content\PageRequest;
use App\Http\Resources\Api\Content\PageResource;
use App\Models\Page;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $pages = Page::query()
            ->when($search, fn ($q) => $q->where(
                fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")
            ))
            ->when($request->query('locale'), fn ($q, $locale) => $q->where('locale', $locale))
            ->orderBy('slug')
            ->paginate($perPage);

        return $this->paginatedResponse(PageResource::collection($pages), 'Pages retrieved successfully');
    }

    public function store(PageRequest $request, SavePageAction $action)
    {
        return $this->successResponse(new PageResource($action->execute($request->toDTO())), 'Page created successfully', 201);
    }

    public function show(Page $page)
    {
        return $this->successResponse(new PageResource($page), 'Page retrieved successfully');
    }

    public function update(PageRequest $request, Page $page, SavePageAction $action)
    {
        return $this->successResponse(new PageResource($action->execute($request->toDTO(), $page)), 'Page updated successfully');
    }

    public function destroy(Page $page, DeleteContentAction $action)
    {
        $action->execute($page, "page: {$page->title}");

        return $this->successResponse(null, 'Page deleted successfully');
    }
}

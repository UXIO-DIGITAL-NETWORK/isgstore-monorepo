<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Article\CreateArticleAction;
use App\Actions\Article\DeleteArticleAction;
use App\Actions\Article\GetArticlesAction;
use App\Actions\Article\UpdateArticleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Http\Resources\Api\Article\ArticleResource;
use App\Models\Article;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetArticlesAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $categoryId = $request->query('article_category_id');
        $published = $request->query('is_published');

        $articles = $action->execute(
            $perPage,
            $request->query('search'),
            $categoryId !== null ? (int) $categoryId : null,
            $request->query('type'),
            $request->query('locale'),
            $published !== null ? filter_var($published, FILTER_VALIDATE_BOOLEAN) : null,
        );

        return $this->paginatedResponse(ArticleResource::collection($articles), 'Articles retrieved successfully');
    }

    public function store(StoreArticleRequest $request, CreateArticleAction $action)
    {
        $article = $action->execute($request->toDTO());

        return $this->successResponse(new ArticleResource($article), 'Article created successfully', 201);
    }

    public function show(Article $article)
    {
        return $this->successResponse(
            new ArticleResource($article->load('articleCategory')),
            'Article retrieved successfully'
        );
    }

    public function update(UpdateArticleRequest $request, Article $article, UpdateArticleAction $action)
    {
        $article = $action->execute($article, $request->toDTO());

        return $this->successResponse(new ArticleResource($article), 'Article updated successfully');
    }

    public function destroy(Article $article, DeleteArticleAction $action)
    {
        $action->execute($article);

        return $this->successResponse(null, 'Article deleted successfully');
    }
}

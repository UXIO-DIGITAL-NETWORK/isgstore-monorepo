<?php

namespace App\Http\Controllers\Api;

use App\Actions\Banner\CreateBannerAction;
use App\Actions\Banner\DeleteBannerAction;
use App\Actions\Banner\GetBannersAction;
use App\Actions\Banner\UpdateBannerAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Banner\StoreBannerRequest;
use App\Http\Requests\Banner\UpdateBannerRequest;
use App\Http\Resources\Api\Banner\BannerResource;
use App\Models\Banner;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetBannersAction $action)
    {
        $banners = $action->execute((int) $request->query('per_page', 15));

        return $this->paginatedResponse(BannerResource::collection($banners), 'Banners retrieved successfully');
    }

    public function store(StoreBannerRequest $request, CreateBannerAction $action)
    {
        $banner = $action->execute($request->toDTO());

        return $this->successResponse(
            new BannerResource($banner->load('category')),
            'Banner created successfully',
            201
        );
    }

    public function show(Banner $banner)
    {
        return $this->successResponse(
            new BannerResource($banner->load('category')),
            'Banner retrieved successfully'
        );
    }

    public function update(UpdateBannerRequest $request, Banner $banner, UpdateBannerAction $action)
    {
        $banner = $action->execute($banner, $request->toDTO());

        return $this->successResponse(
            new BannerResource($banner->load('category')),
            'Banner updated successfully'
        );
    }

    public function destroy(Banner $banner, DeleteBannerAction $action)
    {
        $action->execute($banner);

        return $this->successResponse(null, 'Banner deleted successfully');
    }
}

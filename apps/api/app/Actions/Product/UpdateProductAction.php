<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Product\UpdateProductDTO;
use App\Models\Product;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateProductAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(Product $product, UpdateProductDTO $dto): Product
    {
        // Keep the existing artwork when no new file is uploaded — an edit that
        // only changes the price must not blank the image. Mirrors
        // UpdateSubCategoryAction.
        $logoPath = $product->logo;

        if ($dto->logo instanceof UploadedFile) {
            if ($logoPath) {
                Storage::disk('public')->delete($logoPath);
            }
            $logoPath = $this->images->store($dto->logo, 'products/logos');
        }

        $product->update([
            'category_id' => $dto->categoryId,
            'sub_category_id' => $dto->subCategoryId,
            'name' => $dto->name,
            'sub_name' => $dto->subName,
            'code' => $dto->code,
            'logo' => $logoPath,
            'description' => $dto->description,
            'validasi_nickname' => $dto->validasiNickname,
            'access' => $dto->access,
            'tag' => $dto->tag,
            'is_available' => $dto->isAvailable,
            'price_modal' => $dto->priceModal,
            'price_member' => $dto->priceMember,
            'price_vip' => $dto->priceVip,
            'price_reseller' => $dto->priceReseller,
            'price_agent' => $dto->priceAgent,
            'status' => $dto->status,
            'point_percent' => $dto->pointPercent,
            'point_flat' => $dto->pointFlat,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Product: {$product->name}"
        ));

        return $product->fresh();
    }
}

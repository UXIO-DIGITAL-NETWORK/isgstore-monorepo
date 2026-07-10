<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Product\CreateProductDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class CreateProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateProductDTO $dto): Product
    {
        $product = Product::create([
            'category_id' => $dto->categoryId,
            'sub_category_id' => $dto->subCategoryId,
            'name' => $dto->name,
            'code' => $dto->code,
            'price_modal' => $dto->priceModal,
            'price_member' => $dto->priceMember,
            'price_vip' => $dto->priceVip,
            'price_reseller' => $dto->priceReseller,
            'price_agent' => $dto->priceAgent,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Product: {$product->name}"
        ));

        return $product;
    }
}

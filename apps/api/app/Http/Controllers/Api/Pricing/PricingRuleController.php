<?php

namespace App\Http\Controllers\Api\Pricing;

use App\Actions\Pricing\CreatePricingRuleAction;
use App\Actions\Pricing\DeletePricingRuleAction;
use App\Actions\Pricing\UpdatePricingRuleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pricing\StorePricingRuleRequest;
use App\Http\Requests\Pricing\UpdatePricingRuleRequest;
use App\Models\PricingRule;
use App\Traits\ApiResponse;

class PricingRuleController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->successResponse(
            PricingRule::with('category:id,name,code')->orderBy('category_id')->orderBy('role')->get(),
            'Pricing rules retrieved successfully'
        );
    }

    public function store(StorePricingRuleRequest $request, CreatePricingRuleAction $action)
    {
        $rule = $action->execute($request->toDTO());

        return $this->successResponse($rule->load('category:id,name,code'), 'Pricing rule created successfully', 201);
    }

    public function show(PricingRule $pricingRule)
    {
        return $this->successResponse(
            $pricingRule->load('category:id,name,code'),
            'Pricing rule retrieved successfully'
        );
    }

    public function update(UpdatePricingRuleRequest $request, PricingRule $pricingRule, UpdatePricingRuleAction $action)
    {
        $rule = $action->execute($pricingRule, $request->toDTO());

        return $this->successResponse($rule->load('category:id,name,code'), 'Pricing rule updated successfully');
    }

    public function destroy(PricingRule $pricingRule, DeletePricingRuleAction $action)
    {
        $action->execute($pricingRule);

        return $this->successResponse(null, 'Pricing rule deleted successfully');
    }
}

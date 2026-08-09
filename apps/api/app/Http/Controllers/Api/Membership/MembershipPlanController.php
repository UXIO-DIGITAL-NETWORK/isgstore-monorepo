<?php

namespace App\Http\Controllers\Api\Membership;

use App\Actions\Membership\CreateMembershipPlanAction;
use App\Actions\Membership\DeleteMembershipPlanAction;
use App\Actions\Membership\UpdateMembershipPlanAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Membership\StoreMembershipPlanRequest;
use App\Http\Requests\Membership\UpdateMembershipPlanRequest;
use App\Http\Resources\Api\Membership\MembershipPlanResource;
use App\Models\MembershipPlan;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));

        $plans = MembershipPlan::query()
            ->when($request->query('search'), fn ($q, $search) => $q->where('code', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate($perPage);

        return $this->paginatedResponse(MembershipPlanResource::collection($plans), 'Membership plans retrieved successfully');
    }

    public function store(StoreMembershipPlanRequest $request, CreateMembershipPlanAction $action)
    {
        $plan = $action->execute($request->validated());

        return $this->successResponse(new MembershipPlanResource($plan), 'Membership plan created successfully', 201);
    }

    public function show(MembershipPlan $membershipPlan)
    {
        return $this->successResponse(new MembershipPlanResource($membershipPlan), 'Membership plan retrieved successfully');
    }

    public function update(UpdateMembershipPlanRequest $request, MembershipPlan $membershipPlan, UpdateMembershipPlanAction $action)
    {
        $plan = $action->execute($membershipPlan, $request->validated());

        return $this->successResponse(new MembershipPlanResource($plan), 'Membership plan updated successfully');
    }

    public function destroy(MembershipPlan $membershipPlan, DeleteMembershipPlanAction $action)
    {
        $action->execute($membershipPlan);

        return $this->successResponse(null, 'Membership plan deleted successfully');
    }
}

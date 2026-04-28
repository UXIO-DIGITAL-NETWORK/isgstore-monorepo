<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Models\Order;
use App\Http\Resources\Api\Order\OrderResource;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Actions\Order\GetOrdersAction;
use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\UpdateOrderAction;
use App\Actions\Order\DeleteOrderAction;

class OrderController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetOrdersAction $action)
    {
        $perPage = $request->query('per_page', 15);
        $orders = $action->execute((int) $perPage);
        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request, CreateOrderAction $action)
    {
        $order = $action->execute($request->toDTO());
        return $this->success(
            new OrderResource($order->load(['user', 'product', 'supplier', 'payment'])),
            'Order created successfully',
            201
        );
    }

    public function show(Order $order)
    {
        return $this->success(
            new OrderResource($order->load(['user', 'product', 'supplier', 'payment'])),
            'Order retrieved successfully'
        );
    }

    public function update(UpdateOrderRequest $request, Order $order, UpdateOrderAction $action)
    {
        $order = $action->execute($order, $request->toDTO());
        return $this->success(
            new OrderResource($order->load(['user', 'product', 'supplier', 'payment'])),
            'Order updated successfully'
        );
    }

    public function destroy(Order $order, DeleteOrderAction $action)
    {
        $action->execute($order);
        return $this->success(null, 'Order deleted successfully');
    }
}

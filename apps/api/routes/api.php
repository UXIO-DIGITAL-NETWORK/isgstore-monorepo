<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\User\SyncTimezoneController;

// System Routes
Route::get('/ping', function () {
    return response()->json(['status' => 'success', 'message' => 'pong']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'success', 'message' => 'ok']);
});

// Authentication Routes
Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refreshToken']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Protected Routes (Requires Auth)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // User Info (Current Auth User)
    Route::get('/user', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    });

    // CRUD Users
    Route::prefix('users')->group(function () {
        Route::patch('/sync-timezone', SyncTimezoneController::class);
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

});

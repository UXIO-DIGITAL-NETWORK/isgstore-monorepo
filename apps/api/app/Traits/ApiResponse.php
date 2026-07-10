<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    public function successResponse($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success', // Parameter status yang diminta
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    public function errorResponse(string $message = 'Error', int $code = 500, $data = null): JsonResponse
    {
        return response()->json([
            'status' => 'error', // Parameter status untuk error
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    public function validationErrorResponse($errors, string $message = 'Validation Error'): JsonResponse
    {
        return response()->json([
            'status' => 'fail',
            'code' => 422,
            'message' => $message,
            'errors' => $errors,
        ], 422);
    }
}

<?php

namespace App\Actions\Digiflazz;

use App\DTOs\Digiflazz\CheckBillDTO;
use App\Services\DigiflazzService;
use Illuminate\Support\Str;

class CheckDigiflazzBillAction
{
    public function __construct(private readonly DigiflazzService $digiflazzService) {}

    public function execute(CheckBillDTO $dto): array
    {
        // Inquiry ref_id is ephemeral — not persisted in our DB.
        // Digiflazz needs it for tracking but we don't create a Transaction yet.
        $inquiryRefId = 'INQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $data = $this->digiflazzService->checkBill(
            $dto->buyerSkuCode,
            $dto->customerNo,
            $inquiryRefId
        );

        return [
            'customer_no'   => $data['customer_no']   ?? $dto->customerNo,
            'customer_name' => $data['customer_name'] ?? null,
            'period'        => $data['period']        ?? null,
            'nominal'       => $data['nominal']       ?? null,
            'admin'         => $data['admin']         ?? null,
            'total_bayar'   => $data['total_bayar']   ?? null,
            'product_name'  => $data['product_name']  ?? null,
            'tr_id'         => $data['tr_id']         ?? null,
            'inquiry_ref'   => $inquiryRefId,
        ];
    }
}

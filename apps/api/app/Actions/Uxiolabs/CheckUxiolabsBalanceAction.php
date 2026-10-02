<?php

namespace App\Actions\Uxiolabs;

use App\Contracts\SupplierGateway;

class CheckUxiolabsBalanceAction
{
    public function __construct(private readonly SupplierGateway $uxiolabsService) {}

    public function execute(): array
    {
        return $this->uxiolabsService->getBalance();
    }
}

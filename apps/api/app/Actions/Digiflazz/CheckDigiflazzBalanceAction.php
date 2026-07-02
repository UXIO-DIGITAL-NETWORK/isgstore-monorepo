<?php

namespace App\Actions\Digiflazz;

use App\Services\DigiflazzService;

class CheckDigiflazzBalanceAction
{
    public function __construct(private readonly DigiflazzService $digiflazzService) {}

    public function execute(): array
    {
        return $this->digiflazzService->getBalance();
    }
}

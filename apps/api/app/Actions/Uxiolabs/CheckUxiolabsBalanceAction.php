<?php

namespace App\Actions\Uxiolabs;

use App\Services\UxiolabsService;

class CheckUxiolabsBalanceAction
{
    public function __construct(private readonly UxiolabsService $uxiolabsService) {}

    public function execute(): array
    {
        return $this->uxiolabsService->getBalance();
    }
}

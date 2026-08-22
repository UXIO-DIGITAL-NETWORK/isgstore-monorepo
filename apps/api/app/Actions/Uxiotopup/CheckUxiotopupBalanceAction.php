<?php

namespace App\Actions\Uxiotopup;

use App\Services\UxiotopupService;

class CheckUxiotopupBalanceAction
{
    public function __construct(private readonly UxiotopupService $uxiotopupService) {}

    public function execute(): array
    {
        return $this->uxiotopupService->getBalance();
    }
}

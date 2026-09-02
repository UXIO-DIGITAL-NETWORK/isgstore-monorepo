<?php

declare(strict_types=1);

namespace App\DTOs\Report;

readonly class ReportSummaryDTO
{
    /**
     * @param  string|null  $dateFrom  Y-m-d. IGNORED unless $period is 'custom' — the
     *                                 period name is the single source of truth for the
     *                                 window, so a stray date param can never widen a
     *                                 'daily' request.
     * @param  string|null  $dateTo  Y-m-d, inclusive. Same rule as $dateFrom.
     */
    public function __construct(
        public string $period,
        public ?string $dateFrom,
        public ?string $dateTo,
        public string $timezone,
    ) {}

    public static function fromValidated(array $validated, string $timezone): self
    {
        $period = $validated['period'] ?? 'daily';

        return new self(
            period: $period,
            dateFrom: $period === 'custom' ? ($validated['date_from'] ?? null) : null,
            dateTo: $period === 'custom' ? ($validated['date_to'] ?? null) : null,
            timezone: $timezone,
        );
    }
}

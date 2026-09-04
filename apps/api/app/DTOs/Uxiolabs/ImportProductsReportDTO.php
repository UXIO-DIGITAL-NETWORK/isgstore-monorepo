<?php

namespace App\DTOs\Uxiolabs;

readonly class ImportProductsReportDTO
{
    /**
     * @param  array<int,array{row:int,buyer_sku_code:string,status:string,message:string}>  $results
     */
    public function __construct(
        public int $totalRows,
        public int $created,
        public int $failed,
        public array $results,
    ) {}

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'total_rows' => $this->totalRows,
            'created' => $this->created,
            'failed' => $this->failed,
            'results' => $this->results,
        ];
    }
}

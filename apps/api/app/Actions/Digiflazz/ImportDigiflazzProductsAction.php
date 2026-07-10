<?php

namespace App\Actions\Digiflazz;

use App\DTOs\Digiflazz\CreateDigiflazzProductDTO;
use App\DTOs\Digiflazz\ImportProductsReportDTO;
use App\Exceptions\DigiflazzProductException;
use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Bulk-create Digiflazz products from the uploaded Excel template.
 *
 * Columns are matched by HEADER NAME (row 1), not position, so admins can
 * reorder columns. Each row runs in its own transaction (inside
 * CreateDigiflazzProductAction) with its own try/catch — one bad row never
 * aborts the batch. Blank prices fall back to PricingService defaults.
 */
class ImportDigiflazzProductsAction
{
    private const MAX_ROWS = 500;

    private const HEADERS = [
        'buyer_sku_code', 'category_code', 'name', 'code',
        'price_member', 'price_vip', 'price_reseller', 'price_agent', 'status',
    ];

    public function __construct(
        private readonly CreateDigiflazzProductAction $createAction
    ) {}

    public function execute(string $filePath, string $type): ImportProductsReportDTO
    {
        $rows = $this->readRows($filePath);

        if (count($rows) > self::MAX_ROWS) {
            throw new DigiflazzProductException(
                'Maksimal '.self::MAX_ROWS.' baris per file. File ini berisi '.count($rows).' baris.'
            );
        }

        $categoriesByCode = Category::all(['id', 'code'])->keyBy('code');

        $results = [];
        $created = 0;
        $failed = 0;

        foreach ($rows as $excelRowNumber => $row) {
            $sku = trim((string) ($row['buyer_sku_code'] ?? ''));

            $outcome = $this->importRow($row, $type, $categoriesByCode);

            $results[] = [
                'row' => $excelRowNumber,
                'buyer_sku_code' => $sku !== '' ? $sku : '-',
                'status' => $outcome === null ? 'created' : 'failed',
                'message' => $outcome ?? 'Produk berhasil dibuat',
            ];

            $outcome === null ? $created++ : $failed++;
        }

        return new ImportProductsReportDTO(
            totalRows: count($rows),
            created: $created,
            failed: $failed,
            results: $results,
        );
    }

    /**
     * @param  array<string,mixed>  $row
     * @param  Collection<string,Category>  $categoriesByCode
     * @return string|null null on success, otherwise the failure message
     */
    private function importRow(array $row, string $type, $categoriesByCode): ?string
    {
        $validator = Validator::make($row, [
            'buyer_sku_code' => ['required', 'string', 'max:255'],
            'category_code' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255'],
            'price_member' => ['nullable', 'integer', 'min:0'],
            'price_vip' => ['nullable', 'integer', 'min:0'],
            'price_reseller' => ['nullable', 'integer', 'min:0'],
            'price_agent' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return implode(' ', $validator->errors()->all());
        }

        $category = $categoriesByCode->get(trim((string) $row['category_code']));

        if (! $category) {
            return "category_code '{$row['category_code']}' tidak dikenal.";
        }

        try {
            $this->createAction->execute(new CreateDigiflazzProductDTO(
                buyerSkuCode: trim((string) $row['buyer_sku_code']),
                type: $type,
                categoryId: $category->id,
                name: filled($row['name'] ?? null) ? trim((string) $row['name']) : null,
                code: filled($row['code'] ?? null) ? trim((string) $row['code']) : null,
                priceMember: filled($row['price_member'] ?? null) ? (int) $row['price_member'] : null,
                priceVip: filled($row['price_vip'] ?? null) ? (int) $row['price_vip'] : null,
                priceReseller: filled($row['price_reseller'] ?? null) ? (int) $row['price_reseller'] : null,
                priceAgent: filled($row['price_agent'] ?? null) ? (int) $row['price_agent'] : null,
                status: filled($row['status'] ?? null) && (bool) $row['status'],
            ));
        } catch (DigiflazzProductException $e) {
            return $e->getMessage();
        } catch (\Throwable $e) {
            return 'Kesalahan tak terduga: '.$e->getMessage();
        }

        return null;
    }

    /**
     * Read data rows keyed by header name; array key = Excel row number.
     *
     * @return array<int,array<string,mixed>>
     */
    private function readRows(string $filePath): array
    {
        $sheet = IOFactory::load($filePath)->getSheet(0);
        $raw = $sheet->toArray(null, true, true, false);

        if ($raw === [] || $raw[0] === null) {
            throw new DigiflazzProductException('File kosong atau tidak memiliki baris header.');
        }

        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $raw[0]);

        if (! in_array('buyer_sku_code', $headers, true)) {
            throw new DigiflazzProductException(
                "Header 'buyer_sku_code' tidak ditemukan di baris 1. Gunakan template resmi."
            );
        }

        $rows = [];

        foreach (array_slice($raw, 1, null, true) as $index => $cells) {
            $row = [];
            foreach ($headers as $col => $header) {
                if (in_array($header, self::HEADERS, true)) {
                    $row[$header] = $cells[$col] ?? null;
                }
            }

            // Skip fully empty rows (common at the bottom of edited sheets)
            if (trim((string) ($row['buyer_sku_code'] ?? '')) === ''
                && collect($row)->every(fn ($v) => $v === null || trim((string) $v) === '')) {
                continue;
            }

            $rows[$index + 1] = $row; // +1: toArray() is 0-indexed, Excel rows are 1-indexed
        }

        return $rows;
    }
}

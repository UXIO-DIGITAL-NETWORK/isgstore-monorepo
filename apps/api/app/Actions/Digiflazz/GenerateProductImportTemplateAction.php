<?php

namespace App\Actions\Digiflazz;

use App\Models\Category;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Build the downloadable Excel template for bulk Digiflazz product import.
 * Sheet "Produk" holds the headers + one example row; sheet "Petunjuk" holds
 * instructions and a live list of valid category codes from the database.
 */
class GenerateProductImportTemplateAction
{
    private const HEADERS = [
        'buyer_sku_code', 'category_code', 'name', 'code',
        'price_member', 'price_vip', 'price_reseller', 'price_agent', 'status',
    ];

    public function execute(): string
    {
        $spreadsheet = new Spreadsheet;

        // ── Sheet 1: Produk ──────────────────────────────────────────
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Produk');
        $sheet->fromArray([self::HEADERS], null, 'A1');
        $sheet->fromArray([[
            'ml5', 'mlbb', 'Mobile Legends 5 Diamond', 'ml5',
            12000, 11500, 11000, 10500, 1,
        ]], null, 'A2');

        $headerStyle = $sheet->getStyle('A1:I1');
        $headerStyle->getFont()->setBold(true);
        $headerStyle->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('DBEAFE');

        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }

        // ── Sheet 2: Petunjuk ────────────────────────────────────────
        $guide = $spreadsheet->createSheet();
        $guide->setTitle('Petunjuk');

        $lines = [
            ['PETUNJUK IMPORT PRODUK DIGIFLAZZ'],
            [''],
            ['1. Isi sheet "Produk" mulai baris 2. HAPUS baris contoh (ml5) sebelum upload.'],
            ['2. Kolom wajib: buyer_sku_code (kode SKU dari Digiflazz) dan category_code (lihat daftar di bawah).'],
            ['3. Kolom opsional: name (default: nama produk dari Digiflazz), code (default: sama dengan buyer_sku_code).'],
            ['4. Harga (price_member, price_vip, price_reseller, price_agent): boleh dikosongkan —'],
            ['   sistem menghitung otomatis dari harga modal Digiflazz memakai aturan markup (Pricing Rules).'],
            ['5. status: 1 = langsung aktif di storefront, 0 atau kosong = nonaktif (disembunyikan sampai diaktifkan admin).'],
            ['6. Maksimal 500 baris per file. Baris yang gagal dilaporkan satu per satu — baris lain tetap diproses.'],
            ['7. Harga modal TIDAK diisi di sini — selalu diambil langsung dari price list Digiflazz saat import.'],
            [''],
            ['DAFTAR CATEGORY_CODE YANG VALID:'],
            [''],
        ];

        $guide->fromArray($lines, null, 'A1');
        $guide->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $guide->getStyle('A12')->getFont()->setBold(true);

        $row = count($lines) + 1;
        foreach (Category::orderBy('code')->get(['code', 'name']) as $category) {
            $guide->setCellValue("A{$row}", $category->code);
            $guide->setCellValue("B{$row}", $category->name);
            $row++;
        }

        $guide->getColumnDimension('A')->setWidth(30);
        $guide->getColumnDimension('B')->setWidth(40);

        $spreadsheet->setActiveSheetIndex(0);

        // ── Serialize to bytes ───────────────────────────────────────
        $stream = fopen('php://temp', 'r+');
        (new Xlsx($spreadsheet))->save($stream);
        rewind($stream);
        $bytes = (string) stream_get_contents($stream);
        fclose($stream);

        return $bytes;
    }
}

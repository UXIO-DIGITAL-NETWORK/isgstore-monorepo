<?php

namespace Tests\Feature\Digiflazz;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class ImportDigiflazzProductsTest extends TestCase
{
    use RefreshDatabase;

    private const HEADERS = [
        'buyer_sku_code', 'category_code', 'name', 'code',
        'price_member', 'price_vip', 'price_reseller', 'price_agent', 'status',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.digiflazz.username' => 'testuser',
            'services.digiflazz.key' => 'testkey',
        ]);

        Supplier::factory()->create(['name' => 'Digiflazz']);
        Category::factory()->create(['code' => 'mlbb']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function fakePriceList(array $items): void
    {
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);
    }

    private function prepaidItem(string $sku, int $price = 10000): array
    {
        return [
            'product_name' => strtoupper($sku).' Product',
            'brand' => 'MOBILE LEGENDS',
            'price' => $price,
            'buyer_sku_code' => $sku,
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ];
    }

    /**
     * @param  array<int,array<int,mixed>>  $dataRows
     */
    private function makeXlsxUpload(array $dataRows): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->fromArray([self::HEADERS, ...$dataRows]);

        $path = tempnam(sys_get_temp_dir(), 'imp').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return new UploadedFile(
            $path,
            'import.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true // test mode
        );
    }

    public function test_import_requires_authentication(): void
    {
        $this->postJson('/api/v1/digiflazz/products/import')->assertUnauthorized();
        $this->getJson('/api/v1/digiflazz/products/import-template')->assertUnauthorized();
    }

    public function test_template_download_returns_valid_xlsx_with_expected_headers(): void
    {
        $this->actingAsAdmin();

        $response = $this->get('/api/v1/digiflazz/products/import-template');

        $response->assertOk();
        $response->assertHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        // Round-trip: the downloaded bytes must be a readable workbook with our headers
        $path = tempnam(sys_get_temp_dir(), 'tpl').'.xlsx';
        file_put_contents($path, $response->getContent());

        $sheet = IOFactory::load($path)->getSheetByName('Produk');
        $this->assertNotNull($sheet);
        $this->assertSame(self::HEADERS, array_map(
            fn ($col) => $sheet->getCell($col.'1')->getValue(),
            range('A', 'I')
        ));

        $this->assertNotNull(IOFactory::load($path)->getSheetByName('Petunjuk'));
        unlink($path);
    }

    public function test_import_creates_products_with_blank_prices_defaulted_from_pricing_rules(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem('ml5')]);

        $file = $this->makeXlsxUpload([
            ['ml5', 'mlbb', '', '', '', '', '', '', '1'],
        ]);

        $this->post('/api/v1/digiflazz/products/import', ['file' => $file, 'type' => 'prepaid'])
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.failed', 0)
            ->assertJsonPath('data.results.0.status', 'created');

        $product = Product::where('code', 'ml5')->firstOrFail();
        $this->assertSame(10000, (int) $product->price_modal);
        $this->assertSame(12000, (int) $product->price_member); // built-in 20% default
        $this->assertTrue((bool) $product->status);
    }

    public function test_import_uses_explicit_prices_when_provided(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem('ml5')]);

        $file = $this->makeXlsxUpload([
            ['ml5', 'mlbb', 'Custom Name', 'custom-code', 15000, 14000, 13000, 12000, ''],
        ]);

        $this->post('/api/v1/digiflazz/products/import', ['file' => $file, 'type' => 'prepaid'])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $product = Product::where('code', 'custom-code')->firstOrFail();
        $this->assertSame('Custom Name', $product->name);
        $this->assertSame(15000, (int) $product->price_member);
        $this->assertFalse((bool) $product->status); // blank status = hidden
    }

    public function test_import_reports_failed_rows_without_aborting_good_ones(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem('ml5')]);

        $file = $this->makeXlsxUpload([
            ['ml5', 'mlbb', '', '', '', '', '', '', '1'],          // good
            ['unknown-sku', 'mlbb', '', '', '', '', '', '', ''],   // not in price list
            ['ml10', 'no-such-category', '', '', '', '', '', '', ''], // bad category
        ]);

        $response = $this->post('/api/v1/digiflazz/products/import', ['file' => $file, 'type' => 'prepaid'])
            ->assertOk()
            ->assertJsonPath('data.total_rows', 3)
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.failed', 2);

        $this->assertDatabaseCount('products', 1);

        $results = collect($response->json('data.results'));
        $this->assertSame('failed', $results->firstWhere('buyer_sku_code', 'unknown-sku')['status']);
        $this->assertStringContainsString(
            'tidak dikenal',
            $results->firstWhere('buyer_sku_code', 'ml10')['message']
        );
    }

    public function test_import_rejects_file_without_expected_header(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([]);

        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->fromArray([['wrong', 'headers'], ['a', 'b']]);
        $path = tempnam(sys_get_temp_dir(), 'bad').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $file = new UploadedFile($path, 'bad.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $this->post('/api/v1/digiflazz/products/import', ['file' => $file, 'type' => 'prepaid'])
            ->assertUnprocessable();
    }
}

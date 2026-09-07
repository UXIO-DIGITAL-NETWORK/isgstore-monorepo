<?php

namespace Tests\Feature\Uxiolabs;

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

class ImportUxiolabsProductsTest extends TestCase
{
    use RefreshDatabase;

    private const HEADERS = [
        'buyer_sku_code', 'category_code', 'name', 'code',
        'price_member', 'price_vip', 'price_reseller', 'price_agent', 'status',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);

        Supplier::factory()->create(['name' => 'Uxiolabs']);
        Category::factory()->create(['code' => 'mlbb']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function fakePriceList(array $items): void
    {
        Http::fake(['*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => $items])]);
    }

    private function serviceItem(string $id, int $harga = 10000): array
    {
        return [
            'id' => $id,
            'nama_layanan' => strtoupper($id).' Product',
            'kategori' => 'Mobile Legends',
            'harga' => $harga,
            'harga_gold' => $harga - 200,
            'harga_silver' => $harga - 100,
            'harga_pro' => $harga - 300,
            'status' => 'aktif',
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
        $this->postJson('/api/v1/uxiolabs/products/import')->assertUnauthorized();
        $this->getJson('/api/v1/uxiolabs/products/import-template')->assertUnauthorized();
    }

    public function test_template_download_returns_valid_xlsx_with_expected_headers(): void
    {
        $this->actingAsAdmin();

        $response = $this->get('/api/v1/uxiolabs/products/import-template');

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
        $this->fakePriceList([$this->serviceItem('ML5')]);

        $file = $this->makeXlsxUpload([
            ['ML5', 'mlbb', '', '', '', '', '', '', '1'],
        ]);

        $this->post('/api/v1/uxiolabs/products/import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.failed', 0)
            ->assertJsonPath('data.results.0.status', 'created');

        $product = Product::where('code', 'ML5')->firstOrFail();
        $this->assertSame(10000, (int) $product->price_modal);
        $this->assertSame(12000, (int) $product->price_member); // built-in 20% default
        $this->assertTrue((bool) $product->status);
    }

    public function test_import_uses_explicit_prices_when_provided(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem('ML5')]);

        $file = $this->makeXlsxUpload([
            ['ML5', 'mlbb', 'Custom Name', 'custom-code', 15000, 14000, 13000, 12000, ''],
        ]);

        $this->post('/api/v1/uxiolabs/products/import', ['file' => $file])
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
        $this->fakePriceList([$this->serviceItem('ML5')]);

        $file = $this->makeXlsxUpload([
            ['ML5', 'mlbb', '', '', '', '', '', '', '1'],          // good
            ['unknown-service', 'mlbb', '', '', '', '', '', '', ''],   // not in price list
            ['ML10', 'no-such-category', '', '', '', '', '', '', ''], // bad category
        ]);

        $response = $this->post('/api/v1/uxiolabs/products/import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.total_rows', 3)
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.failed', 2);

        $this->assertDatabaseCount('products', 1);

        $results = collect($response->json('data.results'));
        $this->assertSame('failed', $results->firstWhere('buyer_sku_code', 'unknown-service')['status']);
        $this->assertStringContainsString(
            'tidak dikenal',
            $results->firstWhere('buyer_sku_code', 'ML10')['message']
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

        $this->post('/api/v1/uxiolabs/products/import', ['file' => $file])
            ->assertUnprocessable();
    }
}

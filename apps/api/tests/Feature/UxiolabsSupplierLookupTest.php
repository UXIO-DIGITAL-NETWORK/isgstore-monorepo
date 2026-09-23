<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Support\Uxiolabs\UxiolabsSupplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * One row, two spellings.
 *
 * `suppliers.name` is the key the whole provider pipeline resolves on, and it has
 * been renamed twice. The migrations and the code do not deploy in the same
 * instant, so a lookup that recognised only the newest name would 500 the price
 * checker for the length of a deploy — and the two NAME comparisons outside a
 * query (the balance probe and the Integration card) fail silently instead.
 */
class UxiolabsSupplierLookupTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('supplierNames')]
    public function test_the_row_is_found_under_either_name(string $name): void
    {
        $supplier = Supplier::factory()->create(['name' => $name]);

        $this->assertSame($supplier->id, UxiolabsSupplier::id());
        $this->assertSame($supplier->id, UxiolabsSupplier::model()?->id);
        $this->assertSame($supplier->id, UxiolabsSupplier::modelOrFail()->id);
        $this->assertTrue(UxiolabsSupplier::isNamed($name));
    }

    public function test_a_missing_supplier_still_reports_absent(): void
    {
        $this->assertNull(UxiolabsSupplier::model());
        $this->assertNull(UxiolabsSupplier::id());
        $this->assertFalse(UxiolabsSupplier::isNamed(null));
        $this->assertFalse(UxiolabsSupplier::isNamed('Some Other Supplier'));
    }

    /** @return array<string,array<int,string>> */
    public static function supplierNames(): array
    {
        return [
            'the current name' => [UxiolabsSupplier::NAME],
            'the name it carried before the rename' => [UxiolabsSupplier::LEGACY_NAME],
        ];
    }
}

<?php

namespace Tests\Unit;

use App\Support\Payment\MonetapayContractFees;
use PHPUnit\Framework\TestCase;

class MonetapayContractFeesTest extends TestCase
{
    public function test_percent_channel_uses_the_checkout_formula(): void
    {
        // The worked example: 0.7% × 63.000 = 441.
        $this->assertSame(441, MonetapayContractFees::expectedGatewayFee('qris', 63000));
        $this->assertSame(441, MonetapayContractFees::expectedGatewayFee('gopay', 63000));
    }

    public function test_flat_channel_is_amount_independent(): void
    {
        $this->assertSame(1900, MonetapayContractFees::expectedGatewayFee('mandiri_va', 10000));
        $this->assertSame(1900, MonetapayContractFees::expectedGatewayFee('mandiri_va', 5_000_000));
        $this->assertSame(1500, MonetapayContractFees::expectedGatewayFee('bni_va', 25000));
        $this->assertSame(4300, MonetapayContractFees::expectedGatewayFee('alfamart', 100000));
    }

    public function test_unknown_channel_is_not_in_the_contract(): void
    {
        $this->assertFalse(MonetapayContractFees::has('nonexistent_va'));
        $this->assertNull(MonetapayContractFees::expectedGatewayFee('nonexistent_va', 50000));
        $this->assertTrue(MonetapayContractFees::has('dana'));
        // BCA VA is not offered by this site's gateway: no rate to compare
        // against, and nothing for the Hub sync to treat as activatable.
        $this->assertFalse(MonetapayContractFees::has('bca_va'));
        $this->assertNull(MonetapayContractFees::expectedGatewayFee('bca_va', 50000));
    }

    public function test_contract_rates_match_the_agreement(): void
    {
        $this->assertSame(1.6, MonetapayContractFees::percentFor('dana'));
        $this->assertSame(1.8, MonetapayContractFees::percentFor('ovo'));
        $this->assertSame(2.1, MonetapayContractFees::percentFor('shopeepay'));
        $this->assertSame(1500, MonetapayContractFees::flatFor('danamon_va'));
        // Settlement timing is captured as reference, even though unused for now.
        $this->assertSame(0, MonetapayContractFees::settlementDays('bri_va'));
        $this->assertSame(3, MonetapayContractFees::settlementDays('indomaret'));
        $this->assertSame(2, MonetapayContractFees::settlementDays('shopeepay'));
    }
}

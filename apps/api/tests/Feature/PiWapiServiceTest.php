<?php

namespace Tests\Feature;

use App\Services\PiWapiService;
use App\Support\Phone;
use Exception;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PiWapiServiceTest extends TestCase
{
    private function configure(): void
    {
        config([
            'services.piwapi.api_url' => 'https://piwapi.test/send',
            'services.piwapi.account' => 'acc-1',
            'services.piwapi.secret' => 'sec-1',
        ]);
    }

    public function test_send_document_posts_a_document_message(): void
    {
        $this->configure();
        Http::fake(['https://piwapi.test/send' => Http::response(['status' => 200, 'data' => ['messageId' => 99]], 200)]);

        $result = app(PiWapiService::class)->sendDocument(
            '+6281234567890',
            'https://app.test/api/v1/invoices/INV-1/download',
            'Invoice-INV-1.pdf',
            'Halo',
        );

        $this->assertSame(99, $result['data']['messageId']);

        Http::assertSent(function ($request) {
            $body = $request->body();

            return $request->url() === 'https://piwapi.test/send'
                && $request->method() === 'POST'
                && str_contains($body, 'document')          // type=document + document_type
                && str_contains($body, '+6281234567890')     // recipient
                && str_contains($body, 'Invoice-INV-1.pdf'); // document_name
        });
    }

    public function test_send_document_throws_on_http_failure(): void
    {
        $this->configure();
        Http::fake(['https://piwapi.test/send' => Http::response(['error' => 'boom'], 500)]);

        $this->expectException(Exception::class);
        app(PiWapiService::class)->sendDocument('+6281234567890', 'https://app.test/x.pdf', 'x.pdf', 'hi');
    }

    public function test_send_document_throws_when_body_is_not_success(): void
    {
        $this->configure();
        Http::fake(['https://piwapi.test/send' => Http::response(['status' => 400, 'message' => 'Invalid number'], 200)]);

        $this->expectException(Exception::class);
        app(PiWapiService::class)->sendDocument('+6281234567890', 'https://app.test/x.pdf', 'x.pdf', 'hi');
    }

    public function test_is_configured_reflects_credentials(): void
    {
        config(['services.piwapi.account' => '', 'services.piwapi.secret' => '']);
        $this->assertFalse(app(PiWapiService::class)->isConfigured());

        $this->configure();
        $this->assertTrue(app(PiWapiService::class)->isConfigured());
    }

    #[DataProvider('phoneCases')]
    public function test_phone_normalises_to_e164(?string $raw, ?string $expected): void
    {
        $this->assertSame($expected, Phone::toE164($raw));
    }

    public static function phoneCases(): array
    {
        return [
            'local zero prefix' => ['081234567890', '+6281234567890'],
            'with country code' => ['6281234567890', '+6281234567890'],
            'plus and spaces' => ['+62 812-3456-7890', '+6281234567890'],
            'bare national' => ['81234567890', '+6281234567890'],
            'too short' => ['123', null],
            'empty' => ['', null],
            'null' => [null, null],
        ];
    }
}

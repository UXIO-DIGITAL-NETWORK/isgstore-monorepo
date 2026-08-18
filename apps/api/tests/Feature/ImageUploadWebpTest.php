<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The optimiser is actually wired into the upload endpoints.
 *
 * Its behaviour is pinned in Tests\Unit\ImageOptimizerTest; this one only
 * proves an upload arriving over HTTP goes through it and that the converted
 * path is what reaches the database.
 */
class ImageUploadWebpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_an_upload_through_the_api_lands_as_webp(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));

        $logo = $this->postJson('/api/v1/sub-categories', [
            'category_id' => Category::factory()->create()->id,
            'name' => 'Diamonds',
            'logo' => UploadedFile::fake()->image('logo.jpg', 2400, 2400),
            'status' => true,
        ])->assertCreated()->json('data.logo');

        $this->assertStringEndsWith('.webp', (string) $logo);
        $this->assertSame([1920, 1920], $this->dimensions((string) $logo));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** @return array{0: int, 1: int} */
    private function dimensions(string $path): array
    {
        $image = imagecreatefromstring(Storage::disk('public')->get($path));
        $size = [imagesx($image), imagesy($image)];
        imagedestroy($image);

        return $size;
    }
}

<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Content\SettingResource;
use App\Models\Setting;
use App\Services\ImageOptimizer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Settings are edited as one grouped form, not row by row, so this controller
 * is deliberately not a resource controller: a flat list plus a bulk write.
 */
class SettingController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $settings = Setting::query()
            ->when($request->query('group'), fn ($q, $group) => $q->where('group', $group))
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return $this->successResponse(SettingResource::collection($settings), 'Settings retrieved successfully');
    }

    /**
     * Bulk upsert of `{key: value}`.
     *
     * Unknown keys are ignored rather than created: a settings key implies a
     * type and a group that only a migration or seeder can supply, and
     * inventing one from a stray request would leave a typed-as-string row the
     * UI cannot render.
     */
    public function update(Request $request, CreateActivityLogAction $activityLogAction)
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $updated = [];

        DB::transaction(function () use ($validated, &$updated) {
            foreach ($validated['settings'] as $key => $value) {
                $setting = Setting::where('key', $key)->first();

                if (! $setting) {
                    continue;
                }

                $setting->update([
                    'value' => is_array($value) ? json_encode($value) : (is_bool($value) ? ($value ? '1' : '0') : $value),
                ]);

                $updated[] = $key;
            }
        });

        $activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            message: 'Admin updated settings: '.(implode(', ', $updated) ?: 'none'),
        ));

        $settings = Setting::orderBy('group')->orderBy('key')->get();

        return $this->successResponse(SettingResource::collection($settings), 'Settings updated successfully');
    }

    /**
     * Image-typed settings (logo, favicon, OG image) need a file endpoint.
     *
     * The allowed formats are scoped to the setting being replaced rather than
     * shared across all of them. Only the logo accepts an animated GIF: no
     * link-preview scraper animates an OG image, and a GIF favicon behaves
     * unpredictably across browsers — allowing them everywhere would just move
     * the problem into a support ticket.
     */
    public function upload(Request $request, ImageOptimizer $images)
    {
        $key = (string) $request->input('key');

        $validated = $request->validate([
            'key' => ['required', 'string', 'exists:settings,key'],
            'file' => ['required', 'image', 'mimes:'.$this->allowedMimes($key), 'max:'.$this->maxKilobytes($request)],
        ]);

        $setting = Setting::where('key', $validated['key'])->firstOrFail();

        if ($setting->value && Storage::disk('public')->exists($setting->value)) {
            Storage::disk('public')->delete($setting->value);
        }

        // SVG and ICO pass through the optimiser untouched — a favicon and a
        // vector logo must keep their format.
        $setting->update(['value' => $images->store($request->file('file'), 'settings')]);

        return $this->successResponse(new SettingResource($setting->fresh()), 'Setting file uploaded successfully');
    }

    /** Formats this particular setting may be replaced with. */
    private function allowedMimes(string $key): string
    {
        $base = 'jpeg,png,jpg,webp,svg,ico';

        return $key === 'logo' ? $base.',gif' : $base;
    }

    /**
     * An animated GIF is the one upload that reaches disk uncompressed —
     * `ImageOptimizer` deliberately refuses to re-encode it, because GD cannot
     * write animated WebP and converting would silently keep a single frame.
     * A GIF worth animating is routinely 1–5 MB, so holding it to the 2 MB
     * ceiling meant for compressible rasters would reject every real one.
     */
    private function maxKilobytes(Request $request): int
    {
        $file = $request->file('file');

        return $file && strtolower((string) $file->getClientOriginalExtension()) === 'gif'
            ? 5120
            : 2048;
    }
}

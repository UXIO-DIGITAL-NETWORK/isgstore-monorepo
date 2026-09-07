<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\MemberApiCredential;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Member API credentials for the integration page.
 *
 * Only a hash is stored, so the secret is returned **once**, at creation or
 * regeneration, and can never be read back. That is a deliberate trade: a key
 * the server can re-display is a key the server is storing in plaintext.
 */
class ApiCredentialController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $credentials = MemberApiCredential::where('user_id', $request->user()->id)
            ->whereNull('revoked_at')
            ->latest('id')
            ->get()
            ->map(fn (MemberApiCredential $credential) => $this->project($credential));

        return $this->successResponse([
            'credentials' => $credentials,
            'callback_url' => $credentials->first()['callback_url'] ?? null,
            'whitelist_ips' => $credentials->first()['whitelist_ips'] ?? [],
        ], 'API credentials retrieved successfully');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        [$plain, $credential] = $this->issue($request->user()->id, $validated['name'] ?? 'Default');

        return $this->successResponse(
            $this->project($credential) + [
                // Shown once. There is no endpoint that can return this again.
                'secret' => $plain,
            ],
            'API key created. Copy it now — it cannot be shown again.',
            201
        );
    }

    /** Revoke and reissue in one step, since a key cannot be re-read. */
    public function regenerate(Request $request, MemberApiCredential $apiCredential)
    {
        abort_if($apiCredential->user_id !== $request->user()->id, 404);

        $apiCredential->update(['revoked_at' => now()]);

        [$plain, $credential] = $this->issue(
            $request->user()->id,
            $apiCredential->name,
            $apiCredential->callback_url,
            $apiCredential->whitelist_ips ?? [],
        );

        return $this->successResponse(
            $this->project($credential) + ['secret' => $plain],
            'API key regenerated. Copy it now — it cannot be shown again.'
        );
    }

    public function update(Request $request, MemberApiCredential $apiCredential)
    {
        abort_if($apiCredential->user_id !== $request->user()->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'callback_url' => ['nullable', 'url', 'max:255'],
            'whitelist_ips' => ['nullable', 'array', 'max:20'],
            'whitelist_ips.*' => ['ip'],
        ]);

        $apiCredential->update($validated);

        return $this->successResponse($this->project($apiCredential->fresh()), 'API credential updated');
    }

    public function destroy(Request $request, MemberApiCredential $apiCredential)
    {
        abort_if($apiCredential->user_id !== $request->user()->id, 404);

        // Revoked rather than deleted: the audit trail of what was issued to
        // whom outlives the key's usefulness.
        $apiCredential->update(['revoked_at' => now()]);

        return $this->successResponse(null, 'API key revoked');
    }

    /**
     * @return array{0: string, 1: MemberApiCredential}
     */
    private function issue(int $userId, string $name, ?string $callbackUrl = null, array $whitelistIps = []): array
    {
        $plain = 'sk_live_udn_'.Str::lower(Str::random(52));

        $credential = MemberApiCredential::create([
            'user_id' => $userId,
            'name' => $name,
            // Enough of the head to identify the key in a list without
            // revealing anything usable.
            'key_prefix' => substr($plain, 0, 20),
            'key_hash' => hash('sha256', $plain),
            'callback_url' => $callbackUrl,
            'whitelist_ips' => $whitelistIps,
        ]);

        return [$plain, $credential];
    }

    private function project(MemberApiCredential $credential): array
    {
        return [
            'id' => $credential->id,
            'name' => $credential->name,
            // Masked for display: the real key is unrecoverable by design.
            'masked_key' => $credential->key_prefix.str_repeat('•', 24),
            'callback_url' => $credential->callback_url,
            'whitelist_ips' => $credential->whitelist_ips ?? [],
            'last_used_at' => $credential->last_used_at,
            'created_at' => $credential->created_at,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * What is running here, in one unauthenticated read.
 *
 * A deployment has until now been identified only by a commit SHA in a Discord
 * embed, so "which version is this site on?" had no answer an operator could
 * get without shelling into the box. The Hub serves many sites at mixed deploy
 * versions, and a version it cannot read is a version it cannot warn about.
 *
 * Deliberately public and deliberately OPEN while the site is switched off (see
 * EnsureSiteIsServing): a dark site's version is exactly what an operator wants
 * while deciding whether to switch it back on.
 */
class VersionController extends Controller
{
    use ApiResponse;

    public function __invoke(): JsonResponse
    {
        return $this->successResponse([
            'version' => (string) config('version.app'),
            'commit' => (string) config('version.commit'),
            'upstream' => (string) config('version.upstream'),
            'hub_contract' => (string) config('version.hub_contract'),
            'environment' => app()->environment(),
        ], 'Versi situs');
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The release stamp.
 *
 * A deploy sets APP_VERSION/APP_COMMIT from the tag it is shipping; a local
 * checkout sets neither. The endpoint has to reflect both honestly — a version
 * that guesses is worse than an empty one, because the whole point is being
 * able to tell two deploys apart.
 */
class VersionEndpointTest extends TestCase
{
    public function test_it_reports_the_stamped_release(): void
    {
        config([
            'version.app' => 'v1.4.0',
            'version.commit' => 'abcdef1',
            'version.upstream' => 'v1.3.2',
            'version.hub_contract' => 'v1',
        ]);

        $this->getJson('/api/v1/version')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.version', 'v1.4.0')
            ->assertJsonPath('data.commit', 'abcdef1')
            ->assertJsonPath('data.upstream', 'v1.3.2')
            ->assertJsonPath('data.hub_contract', 'v1');
    }

    public function test_an_unstamped_checkout_reports_empty_not_a_guess(): void
    {
        config(['version.app' => '', 'version.commit' => '', 'version.upstream' => '']);

        $this->getJson('/api/v1/version')
            ->assertOk()
            ->assertJsonPath('data.version', '')
            ->assertJsonPath('data.commit', '')
            ->assertJsonPath('data.upstream', '');
    }
}

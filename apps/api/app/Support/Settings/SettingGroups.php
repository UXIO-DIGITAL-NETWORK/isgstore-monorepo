<?php

declare(strict_types=1);

namespace App\Support\Settings;

/**
 * Settings the admin form does not own.
 *
 * The settings page is a generic form over the `settings` table, so without a
 * list like this every row is editable by whoever can reach the endpoint —
 * including rows whose real owner is somewhere else. Two of them are:
 *
 * - `licence` is operational state pushed by the Uxio Hub
 *   (`ApplyHubLicenceAction`) on a one-minute sync. A local edit is silently
 *   reverted on the next pass, and in the meantime `is_serving` decides whether
 *   the storefront answers at all. `SiteLicenceState` already states that
 *   "nothing else may write it"; this is what makes that true.
 * - `pricing` is configured per membership plan on the Pricing Rules screen.
 *   `default_markup_percent` is only the last rung of that chain, and a global
 *   rule lands in exactly the same place through a UI built for it.
 */
final class SettingGroups
{
    /** @var list<string> */
    public const MANAGED_ELSEWHERE = ['licence', 'pricing'];

    public static function isManagedElsewhere(string $group): bool
    {
        return in_array($group, self::MANAGED_ELSEWHERE, true);
    }
}

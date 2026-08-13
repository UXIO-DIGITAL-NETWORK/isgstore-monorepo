<?php

declare(strict_types=1);

namespace App\Actions\Status;

use App\Enums\IncidentSeverity;
use App\Enums\IncidentStatus;
use App\Models\PaymentChannel;
use App\Models\Service;
use App\Models\ServiceIncident;

/**
 * The client-facing "Status Layanan" payload.
 *
 * Two sources merged into one list of components:
 *   - a baseline from configuration — a payment channel or service with
 *     `is_active = false` is `closed`, everything else is `operational`;
 *   - the open incidents kita has written by hand, which override that
 *     baseline with a state derived from their severity.
 *
 * Configuration alone cannot express "up but degraded" and incidents alone
 * cannot express "we turned this off", so neither source is sufficient.
 */
class BuildServiceStatusAction
{
    /** Baseline for something switched off in configuration. */
    private const CLOSED = 'closed';

    private const OPERATIONAL = 'operational';

    /** @return array{overall: string, incidents: list<array<string, mixed>>, components: list<array<string, mixed>>} */
    public function execute(): array
    {
        $incidents = ServiceIncident::query()
            ->where('status', '!=', IncidentStatus::RESOLVED)
            ->with(['service:id,name', 'paymentChannel:id,name'])
            ->orderByDesc('started_at')
            ->get();

        // Keyed "<type>:<id>" so a component can find the incident aimed at it
        // in one lookup rather than scanning the list per row.
        $byTarget = [];
        foreach ($incidents as $incident) {
            $key = $incident->service_id
                ? 'service:'.$incident->service_id
                : 'payment_channel:'.$incident->payment_channel_id;

            // Newest first, so the first one wins and later (older) ones for
            // the same target do not downgrade it.
            $byTarget[$key] ??= $incident;
        }

        $components = [];

        foreach (PaymentChannel::query()->orderBy('name')->get(['id', 'name', 'is_active']) as $channel) {
            $components[] = $this->component('payment_channel', (int) $channel->id, $channel->name, (bool) $channel->is_active, $byTarget);
        }

        foreach (Service::query()->orderBy('sort_order')->orderBy('id')->get(['id', 'name', 'is_active']) as $service) {
            $components[] = $this->component('service', (int) $service->id, $service->name, (bool) $service->is_active, $byTarget);
        }

        return [
            'overall' => $this->overall($components),
            'incidents' => $incidents->map(fn (ServiceIncident $incident) => $this->incident($incident))->all(),
            'components' => $components,
        ];
    }

    /** @return array<string, mixed> */
    private function component(string $type, int $id, string $name, bool $isActive, array $byTarget): array
    {
        $incident = $byTarget[$type.':'.$id] ?? null;

        // A switched-off component reports `closed` even while an incident is
        // open against it: "we turned this off" is the more actionable fact.
        $status = match (true) {
            ! $isActive => self::CLOSED,
            $incident !== null => $this->statusForSeverity($incident->severity),
            default => self::OPERATIONAL,
        };

        return ['type' => $type, 'id' => $id, 'name' => $name, 'status' => $status];
    }

    private function statusForSeverity(?IncidentSeverity $severity): string
    {
        return match ($severity) {
            IncidentSeverity::CRITICAL => 'down',
            default => 'degraded',
        };
    }

    /** @param list<array<string, mixed>> $components */
    private function overall(array $components): string
    {
        $statuses = array_column($components, 'status');

        return match (true) {
            in_array('down', $statuses, true) => 'down',
            in_array('degraded', $statuses, true) => 'degraded',
            in_array(self::CLOSED, $statuses, true) => 'degraded',
            default => self::OPERATIONAL,
        };
    }

    /** @return array<string, mixed> */
    private function incident(ServiceIncident $incident): array
    {
        return [
            'id' => $incident->id,
            'title' => $incident->title,
            'target' => $incident->service_id
                ? ['type' => 'service', 'id' => (int) $incident->service_id, 'name' => $incident->service?->name]
                : ['type' => 'payment_channel', 'id' => (int) $incident->payment_channel_id, 'name' => $incident->paymentChannel?->name],
            'severity' => $incident->severity?->value,
            'status' => $incident->status?->value,
            'message' => $incident->message,
            'started_at' => $incident->started_at?->toIso8601String(),
            'estimated_resolved_at' => $incident->estimated_resolved_at?->toIso8601String(),
        ];
    }
}

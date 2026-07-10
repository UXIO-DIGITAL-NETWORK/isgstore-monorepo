<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Central Discord operational-notification sender.
 *
 * Silently no-ops when services.discord.webhook_log_url is unset and never
 * throws — a broken Discord webhook must not fail the business flow that
 * triggered the notification.
 */
class DiscordWebhookService
{
    public const COLOR_GREEN = 5763719;

    public const COLOR_RED = 15548997;

    public const COLOR_ORANGE = 16744448;

    public const COLOR_YELLOW = 16705372;

    /**
     * @param  array<int,array{name:string,value:string,inline?:bool}>  $fields
     */
    public function sendEmbed(string $title, array $fields = [], int $color = self::COLOR_YELLOW, ?string $description = null): void
    {
        try {
            $webhookUrl = config('services.discord.webhook_log_url');

            if (! $webhookUrl) {
                return;
            }

            $embed = [
                'title' => $title,
                'color' => $color,
                'fields' => $fields,
                'footer' => ['text' => 'Uxio System Auto-Log'],
                'timestamp' => now()->toIso8601String(),
            ];

            if ($description !== null) {
                $embed['description'] = $description;
            }

            Http::post($webhookUrl, ['embeds' => [$embed]]);
        } catch (Throwable $e) {
            Log::error('Discord notification failed: '.$e->getMessage());
        }
    }

    public function sendAlert(string $message): void
    {
        $this->sendEmbed('🚨 System Alert', [], self::COLOR_RED, $message);
    }
}

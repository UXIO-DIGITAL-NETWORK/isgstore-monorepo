<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Runs the Monetapay SIT scenario registry (config/monetapay_sit.php) against a
 * deployed API, fills a COPY of the official template spreadsheet, and emits an
 * HTML report (scenario -> route hit -> file used -> expected vs actual -> result).
 *
 * Live SIT tool — hits the real deployed API (which calls the Monetapay sandbox).
 * Not for CI. Default target: the staging deployment.
 */
class MonetapaySitCommand extends Command
{
    protected $signature = 'monetapay:sit
        {--base=https://api-staging-topup.uxio-dev.web.id : Deployed API base URL (without /api/v1)}
        {--email=admin@example.com : Login email for protected routes}
        {--password=password : Login password}
        {--token= : Use this bearer token instead of logging in}
        {--only= : Comma sheet numbers to run, e.g. 1,2,4,8}
        {--dry-run : List the plan without calling the network}
        {--template=}
        {--out=}
        {--html=}';

    protected $description = 'Run the Monetapay SIT scenarios against the deployed API, fill the spreadsheet, and build an HTML report.';

    /** Sheet number => template sheet name. */
    private const SHEET_NAMES = [
        '1' => 'Balance Inquiry',
        '2' => 'Virtual Account',
        '3' => 'eWallet',
        '4' => 'QRIS',
        '5' => 'Payment Link',
        '6' => 'Subscribe',
        '7' => 'Pay-out Services',
        '8' => 'Account Validation',
    ];

    public function handle(): int
    {
        // The template carries 32 sheets + embedded logos; PhpSpreadsheet needs headroom.
        @ini_set('memory_limit', '2048M');

        $base = rtrim((string) $this->option('base'), '/');
        $api = $base.'/api/v1';
        $template = $this->option('template') ?: storage_path('app/sit/template.xlsx');
        $out = $this->option('out') ?: storage_path('app/sit/Monetapay_SIT_filled.xlsx');
        $html = $this->option('html') ?: storage_path('app/sit/monetapay_sit_report.html');
        $only = $this->option('only') ? array_map('trim', explode(',', (string) $this->option('only'))) : null;
        $dry = (bool) $this->option('dry-run');

        $scenarios = config('monetapay_sit');
        if ($only) {
            $scenarios = array_values(array_filter($scenarios, fn ($s) => in_array(explode('.', $s['no'])[0], $only, true)));
        }

        $this->info(sprintf('Monetapay SIT — %d scenarios against %s', count($scenarios), $api));

        if ($dry) {
            $this->table(['No', 'Sheet', 'Service', 'Exec', 'Route'],
                array_map(fn ($s) => [$s['no'], $s['sheet'], $s['service'], $s['exec'], $s['route'] ?? ''], $scenarios));

            return self::SUCCESS;
        }

        // ── Auth ─────────────────────────────────────────────────────────────
        $token = (string) $this->option('token');
        if ($token === '') {
            $this->line('Logging in…');
            $login = Http::acceptJson()->post("$api/auth/login", [
                'email' => $this->option('email'),
                'password' => $this->option('password'),
            ]);
            $token = data_get($login->json(), 'data.access_token', '');
            if ($token === '') {
                $this->error('Login failed: '.$login->body());

                return self::FAILURE;
            }
        }

        // ── Runtime context for {{placeholders}} ────────────────────────────
        $now = now();
        $ctx = [
            'now' => [
                'month_start' => $now->copy()->startOfMonth()->format('Y-m-d 00:00:00'),
                'today' => $now->format('Y-m-d 00:00:00'),
                'month_start_date' => $now->copy()->startOfMonth()->format('Y-m-d'),
                'today_date' => $now->format('Y-m-d'),
            ],
            'run' => ['uid' => 'SIT'.$now->format('ymdHis')],
        ];

        // ── Execute ──────────────────────────────────────────────────────────
        $results = [];
        foreach ($scenarios as $s) {
            $results[] = $this->runScenario($s, $api, $token, $ctx);
        }

        // ── Outputs ──────────────────────────────────────────────────────────
        // HTML first so a heavy xlsx load can never cost us the report.
        $this->writeHtml($html, $results, $base);
        try {
            $this->fillSpreadsheet($template, $out, $results);
        } catch (\Throwable $e) {
            $this->warn('Spreadsheet fill failed ('.$e->getMessage().'). HTML report still written.');
        }

        // ── Console summary ─────────────────────────────────────────────────
        $counts = array_count_values(array_column($results, 'status'));
        $this->newLine();
        $this->table(['Status', 'Count'], array_map(fn ($k, $v) => [$k, $v], array_keys($counts), $counts));
        $this->info("Filled spreadsheet: $out");
        $this->info("HTML report:        $html");

        return self::SUCCESS;
    }

    /** @return array<string,mixed> */
    private function runScenario(array $s, string $api, string $token, array &$ctx): array
    {
        $base = [
            'no' => $s['no'], 'sheet' => $s['sheet'], 'service' => $s['service'], 'scenario' => $s['scenario'],
            'route' => $s['route'] ?? '', 'files' => implode(', ', $s['files'] ?? []),
            'expect_code' => $s['expect_code'] ?? '', 'expect_http' => $s['expect_http'] ?? '',
            'request' => '', 'response' => '', 'http' => '', 'actual_code' => '',
            'status' => 'SKIP', 'notes' => $s['note'] ?? '',
        ];

        if (($s['exec'] ?? '') === 'not_implemented') {
            return ['status' => 'Skip'] + $base;
        }
        if (($s['exec'] ?? '') === 'manual') {
            return ['status' => 'Skip'] + $base;
        }

        // exec === 'http'
        [$body, $missing] = $this->resolve($s['body'] ?? [], $ctx);
        if ($missing) {
            $base['notes'] = trim(($base['notes'] ? $base['notes'].' | ' : '').'Skipped: missing dependency '.implode(', ', $missing).' (a prior create step did not return an id).');

            return ['status' => 'Skip'] + $base;
        }

        $url = $api.$s['path'];
        $req = Http::acceptJson();
        if (! empty($s['auth'])) {
            $req = $req->withToken($token);
        }

        $base['request'] = "POST $url\n".($s['auth'] ? "Authorization: Bearer <token>\n" : '')
            ."Content-Type: application/json\n\n".json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        try {
            $resp = $req->timeout(60)->retry(2, 800, throw: false)->post($url, $body);
        } catch (\Throwable $e) {
            return ['status' => 'Failed', 'response' => 'Transport error: '.$e->getMessage()] + $base;
        }

        $json = $resp->json();
        $base['http'] = (string) $resp->status();
        $base['response'] = json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: $resp->body();

        // Capture ids for later chained scenarios (only on success).
        if ($resp->successful() && isset($s['capture'])) {
            $vals = [];
            foreach ($s['capture']['from'] as $key => $path) {
                $vals[$key] = data_get($json, $path);
            }
            $ctx[$s['capture']['as']] = $vals;
        }

        // Determine Monetapay business code + pass/fail.
        $actual = data_get($json, 'data.code', data_get($json, 'code'));
        $base['actual_code'] = (string) ($actual ?? '');
        $expect = (string) ($s['expect_code'] ?? '');

        $isCheckout = str_ends_with($s['path'], '/checkout');
        $raw = $base['response'];

        if ($isCheckout) {
            $pass = in_array($expect, ['0', ''], true)
                ? $resp->successful()
                : (! $resp->successful() && $expect !== '' && str_contains($raw, $expect));
        } elseif ($actual !== null && $actual !== '') {
            $pass = (string) $actual === $expect;
        } else {
            // Error envelope / no business code — accept if the expected code appears in the raw body.
            $pass = $expect !== '' && str_contains($raw, $expect);
        }

        $base['status'] = $pass ? 'Passed' : 'Failed';

        return $base;
    }

    /**
     * Replace {{key.field}} tokens from $ctx. Returns [resolvedBody, missingTokens].
     *
     * @return array{0: array<string,mixed>, 1: array<int,string>}
     */
    private function resolve(array $body, array $ctx): array
    {
        $missing = [];
        $out = [];
        foreach ($body as $k => $v) {
            if (is_string($v) && preg_match('/^\{\{(.+)\}\}$/', $v, $m)) {
                $val = data_get($ctx, $m[1]);
                if ($val === null || $val === '') {
                    $missing[] = $m[1];
                    $out[$k] = $v;
                } else {
                    $out[$k] = $val;
                }
            } else {
                $out[$k] = $v;
            }
        }

        return [$out, $missing];
    }

    private function fillSpreadsheet(string $template, string $out, array $results): void
    {
        if (! is_file($template)) {
            $this->warn("Template not found at $template — skipping xlsx fill.");

            return;
        }
        // Load ONLY the sheets we fill. The full 32-sheet template (with embedded
        // logos) otherwise exhausts memory / trips a PhpSpreadsheet load bug.
        $reader = IOFactory::createReader('Xlsx');
        $reader->setLoadSheetsOnly(array_values(self::SHEET_NAMES));
        $ss = $reader->load($template);

        // Build per-sheet row index (col A 'No' => row number), once.
        $rowIndex = [];
        foreach (self::SHEET_NAMES as $name) {
            $sheet = $ss->getSheetByName($name);
            if (! $sheet) {
                continue;
            }
            $map = [];
            $high = $sheet->getHighestDataRow();
            for ($r = 9; $r <= $high; $r++) {
                $no = trim((string) $sheet->getCell("A$r")->getValue());
                if ($no !== '') {
                    $map[$no] = $r;
                }
            }
            $rowIndex[$name] = $map;
        }

        foreach ($results as $res) {
            $sheet = $ss->getSheetByName($res['sheet']);
            $row = $rowIndex[$res['sheet']][$res['no']] ?? null;
            if (! $sheet || ! $row) {
                continue;
            }

            $sheet->setCellValue("G$row", $res['request']);                                  // PostURL/Header/Request
            $sheet->setCellValue("H$row", "HTTP {$res['http']}\n{$res['response']}");        // Response
            $sheet->setCellValue("I$row", $res['status']);                                   // Result
            $note = $res['notes'];
            $note .= "\n[route] {$res['route']}\n[files] {$res['files']}";
            $note .= "\n[expected code] {$res['expect_code']}  [actual code] {$res['actual_code']}";
            $sheet->setCellValue("J$row", trim($note));                                      // Notes
            foreach (['G', 'H', 'J'] as $c) {
                $sheet->getStyle("$c$row")->getAlignment()->setWrapText(true);
            }
        }

        @mkdir(dirname($out), 0775, true);
        IOFactory::createWriter($ss, 'Xlsx')->save($out);
    }

    private function writeHtml(string $path, array $results, string $base): void
    {
        $counts = array_count_values(array_column($results, 'status'));
        $color = [
            'Passed' => '#16a34a',
            'Failed' => '#dc2626',
            'Skip' => '#6b7280',
        ];

        $rows = '';
        foreach ($results as $r) {
            $c = $color[$r['status']] ?? '#374151';
            $rows .= '<tr>'
                .'<td>'.e($r['no']).'</td>'
                .'<td>'.e($r['sheet']).'</td>'
                .'<td>'.e($r['service']).'<br><small>'.e($r['scenario']).'</small></td>'
                .'<td><code>'.e($r['route']).'</code></td>'
                .'<td><small>'.e($r['files']).'</small></td>'
                .'<td style="text-align:center">'.e($r['expect_code']).'</td>'
                .'<td style="text-align:center">'.e($r['actual_code'] ?: '—').' <small>('.e($r['http'] ?: '—').')</small></td>'
                .'<td style="text-align:center;font-weight:700;color:'.$c.'">'.e($r['status']).'</td>'
                .'<td><details><summary>view</summary><pre>'.e($r['request'])."\n--- response ---\n".e($r['response']).'</pre>'
                .($r['notes'] ? '<p><b>Notes:</b> '.e($r['notes']).'</p>' : '').'</details></td>'
                .'</tr>';
        }

        $summary = '';
        foreach (['Passed', 'Failed', 'Skip'] as $k) {
            $summary .= '<span class="pill" style="background:'.($color[$k] ?? '#374151').'">'.$k.': '.($counts[$k] ?? 0).'</span> ';
        }

        $when = now()->toDayDateTimeString();
        $total = count($results);
        $doc = <<<HTML
<!doctype html><html><head><meta charset="utf-8"><title>Monetapay SIT Report</title>
<style>
 body{font:14px/1.5 system-ui,Segoe UI,Roboto,sans-serif;margin:24px;color:#111}
 h1{margin:0 0 4px} .meta{color:#555;margin-bottom:16px}
 .pill{display:inline-block;color:#fff;border-radius:999px;padding:3px 10px;margin:2px;font-size:12px;font-weight:700}
 table{border-collapse:collapse;width:100%;margin-top:14px}
 th,td{border:1px solid #e5e7eb;padding:6px 8px;vertical-align:top;text-align:left}
 th{background:#f3f4f6;position:sticky;top:0}
 code{background:#f3f4f6;padding:1px 4px;border-radius:4px;font-size:12px}
 pre{white-space:pre-wrap;background:#0b1021;color:#d6e2ff;padding:10px;border-radius:6px;max-width:640px;overflow:auto;font-size:12px}
 details summary{cursor:pointer;color:#2563eb}
 small{color:#6b7280}
</style></head><body>
<h1>Monetapay SIT Report</h1>
<div class="meta">Target: <code>$base</code> &middot; Generated: $when &middot; Scenarios: $total</div>
<div>$summary</div>
<table>
<thead><tr><th>No</th><th>Sheet</th><th>Service / Scenario</th><th>Route hit</th><th>File(s) used</th><th>Exp.code</th><th>Actual (HTTP)</th><th>Result</th><th>Evidence</th></tr></thead>
<tbody>$rows</tbody>
</table>
</body></html>
HTML;

        @mkdir(dirname($path), 0775, true);
        file_put_contents($path, $doc);
    }
}

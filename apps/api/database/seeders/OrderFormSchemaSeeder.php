<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ServerCategory;
use App\Models\ServerCategoryOption;
use Illuminate\Database\Seeder;

/**
 * Per-game order form schema + customer_no template.
 *
 * Idempotent and keyed on categories.code, so it is safe to re-run on production.
 * A category not listed here keeps order_form_fields = NULL and therefore keeps
 * the legacy behaviour (uid required, server optional, bare concatenation).
 *
 * NOTE ON MLBB: the zone is a free-text numeric field on purpose. The seeded
 * server_category_options ("Zone 1".."Zone 5" → 2001..2005) are not real MLBB
 * zones — a player's zone is a per-account number read from their own profile —
 * and forcing customers to pick from that list produced wrong ids that only
 * failed at the supplier, after payment.
 */
class OrderFormSchemaSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->schemas() as $code => $schema) {
            Category::where('code', $code)->update(['order_form_fields' => $schema]);
        }

        $this->removeFabricatedMlbbZones();
    }

    /**
     * The seeded "Zone 1".."Zone 5" (2001-2005) options are not real MLBB zones —
     * a player's zone is a per-account number read from their own profile. Remove
     * them so the field can never render as a dropdown again, on any environment.
     */
    private function removeFabricatedMlbbZones(): void
    {
        $mlbb = Category::where('code', 'mlbb')->first();

        if (! $mlbb) {
            return;
        }

        $serverCategoryIds = ServerCategory::where('category_id', $mlbb->id)->pluck('id');

        if ($serverCategoryIds->isNotEmpty()) {
            ServerCategoryOption::whereIn('server_category_id', $serverCategoryIds)->delete();
        }
    }

    private function schemas(): array
    {
        return [
            // Game player IDs carry no length bounds on purpose — digit counts vary
            // between accounts and regions, so only "required" and digits-only are
            // enforced. Fixed-format fields further down (phone, meter) keep theirs.
            'mlbb' => [
                'customer_no_template' => '{user_id}{zone_id}',
                'fields' => [
                    [
                        'key' => 'user_id',
                        'label' => 'User ID',
                        'type' => 'number',
                        'required' => true,
                        'placeholder' => '63193868',
                        'help' => 'Buka profil di game, User ID ada di bawah nama kamu.',
                    ],
                    [
                        'key' => 'zone_id',
                        'label' => 'Zone ID',
                        'type' => 'number',
                        'required' => true,
                        'placeholder' => '2027',
                        'help' => 'Angka di dalam kurung setelah User ID.',
                    ],
                ],
            ],

            'freefire' => [
                'customer_no_template' => '{user_id}',
                'fields' => [
                    [
                        'key' => 'user_id',
                        'label' => 'Player ID',
                        'type' => 'number',
                        'required' => true,
                        'placeholder' => '123456789',
                        'help' => 'Player ID ada di halaman profil Free Fire kamu.',
                    ],
                ],
            ],

            'valorant' => [
                'customer_no_template' => '{riot_id}',
                'fields' => [
                    [
                        'key' => 'riot_id',
                        'label' => 'Riot ID',
                        'type' => 'text',
                        'required' => true,
                        'min_length' => 3,
                        'max_length' => 30,
                        // Riot IDs are Name#Tag.
                        'pattern' => '^[A-Za-z0-9 ._-]{3,20}#[A-Za-z0-9]{3,5}$',
                        'placeholder' => 'NamaKamu#1234',
                        'help' => 'Tulis lengkap dengan tag, contoh: NamaKamu#1234.',
                    ],
                ],
            ],

            'pulsa' => $this->phoneSchema('Nomor HP', 'Nomor tujuan pengisian pulsa.'),
            'data' => $this->phoneSchema('Nomor HP', 'Nomor tujuan paket data.'),
            'telkomsel' => $this->phoneSchema('Nomor HP', 'Nomor Telkomsel tujuan.'),
            'emoney' => $this->phoneSchema('Nomor HP / Akun', 'Nomor terdaftar di aplikasi e-wallet.'),

            'ppob' => [
                'customer_no_template' => '{meter_no}',
                'fields' => [
                    [
                        'key' => 'meter_no',
                        'label' => 'Nomor Meter / ID Pelanggan',
                        'type' => 'number',
                        'required' => true,
                        'min_length' => 10,
                        'max_length' => 16,
                        'placeholder' => '14xxxxxxxxxx',
                        'help' => 'Nomor meter (11 digit) atau ID pelanggan (12 digit).',
                    ],
                ],
            ],
        ];
    }

    private function phoneSchema(string $label, string $help): array
    {
        return [
            'customer_no_template' => '{phone}',
            'fields' => [
                [
                    'key' => 'phone',
                    'label' => $label,
                    'type' => 'number',
                    'required' => true,
                    'min_length' => 9,
                    'max_length' => 15,
                    'placeholder' => '08123456789',
                    'help' => $help,
                ],
            ],
        ];
    }
}

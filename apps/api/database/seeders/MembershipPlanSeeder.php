<?php

namespace Database\Seeders;

use App\Enums\RoleType;
use App\Models\MembershipPlan;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * The three tiers the storefront's upgrade page offers.
 *
 * Each maps to a real role, because roles are what `RolePrice` uses to quote a
 * member — a plan without one would sell nothing. `basic` maps to VIP rather
 * than MEMBER: MEMBER is the free default every registration already gets, so
 * a paid plan granting it would charge for nothing.
 *
 * All three are lifetime (`duration_days` NULL): bought once, never renewed and
 * never expired by `memberships:expire`. The benefit lists say so first — the
 * upgrade page renders them, and nothing else on it mentions a period.
 */
class MembershipPlanSeeder extends Seeder
{
    public function run(): void
    {
        $roleIds = Role::pluck('id', 'name')->mapWithKeys(
            fn ($id, $name) => [strtolower((string) $name) => $id]
        );

        $plans = [
            [
                'code' => 'basic',
                'role' => RoleType::VIP->value,
                'price' => 50000,
                'duration_days' => null, // lifetime
                'is_popular' => false,
                'sort_order' => 0,
                'name' => ['id' => 'Basic', 'en' => 'Basic'],
                'benefits' => [
                    'id' => [
                        'Berlaku selamanya, tanpa perpanjangan',
                        'Harga VIP untuk semua produk',
                        'Riwayat transaksi tanpa batas',
                        'Dukungan pelanggan prioritas',
                    ],
                    'en' => [
                        'Lifetime access, no renewal',
                        'VIP pricing on every product',
                        'Unlimited transaction history',
                        'Priority customer support',
                    ],
                ],
            ],
            [
                'code' => 'platinum',
                'role' => RoleType::RESELLER->value,
                'price' => 150000,
                'duration_days' => null, // lifetime
                'is_popular' => true,
                'sort_order' => 1,
                'name' => ['id' => 'Platinum', 'en' => 'Platinum'],
                'benefits' => [
                    'id' => [
                        'Berlaku selamanya, tanpa perpanjangan',
                        'Harga reseller untuk semua produk',
                        'Riwayat transaksi tanpa batas',
                        'Dukungan pelanggan prioritas',
                        'Akses API untuk integrasi',
                    ],
                    'en' => [
                        'Lifetime access, no renewal',
                        'Reseller pricing on every product',
                        'Unlimited transaction history',
                        'Priority customer support',
                        'API access for integrations',
                    ],
                ],
            ],
            [
                'code' => 'gold',
                'role' => RoleType::AGENT->value,
                'price' => 300000,
                'duration_days' => null, // lifetime
                'is_popular' => false,
                'sort_order' => 2,
                'name' => ['id' => 'Gold', 'en' => 'Gold'],
                'benefits' => [
                    'id' => [
                        'Berlaku selamanya, tanpa perpanjangan',
                        'Harga agen, yang termurah',
                        'Riwayat transaksi tanpa batas',
                        'Dukungan pelanggan prioritas 24/7',
                        'Akses API untuk integrasi',
                        'Manajer akun khusus',
                    ],
                    'en' => [
                        'Lifetime access, no renewal',
                        'Agent pricing — the lowest tier',
                        'Unlimited transaction history',
                        '24/7 priority customer support',
                        'API access for integrations',
                        'Dedicated account manager',
                    ],
                ],
            ],
        ];

        foreach ($plans as $plan) {
            MembershipPlan::updateOrCreate(
                ['code' => $plan['code']],
                [
                    'name' => $plan['name'],
                    'benefits' => $plan['benefits'],
                    'price' => $plan['price'],
                    'duration_days' => $plan['duration_days'],
                    'role_id' => $roleIds[$plan['role']] ?? null,
                    'is_popular' => $plan['is_popular'],
                    'is_active' => true,
                    'sort_order' => $plan['sort_order'],
                ],
            );
        }
    }
}

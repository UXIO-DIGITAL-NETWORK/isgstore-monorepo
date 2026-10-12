import type { MemberActivityLogRow, MemberDashboardData } from "@/features/member-dashboard/services/member.service";
import type { ApiCredentialListResponse, IssuedCredential } from "@/features/member-dashboard/services/integrasi.service";
import type { MemberRefundModel } from "@/features/member-dashboard/services/refund.service";
import type { BalanceMutationModel, TopupResult } from "@/features/member-dashboard/services/wallet.service";
import type { PointsSummary } from "@/features/checkout/hooks/usePointsBalance";
import type { PayoutBank, RefundClaimModel } from "@/features/refund/types/refund.type";
import type { TransactionSummaryModel } from "@/types/models/transaction.model";
import type { User } from "@/types/models/user.model";

import { GAME_LOGO } from "./assets";

export const MOCK_USER: User = {
  id: 1,
  role_id: 2,
  role: "member",
  name: "Budi Santoso",
  username: "budisantoso",
  avatar: null,
  avatar_url: null,
  email: "member@topupgame.test",
  phone: "+6281234567890",
  balance: 250000,
  point: 1250,
  locale: "id",
  timezone: "Asia/Jakarta",
  email_verified_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

export const MOCK_TRANSACTIONS: TransactionSummaryModel[] = [
  { id: 1, invoice_number: "INV-MOCK-0001", service_name: "355 Diamonds", service_detail: "Mobile Legends Indonesia", target: "123456789", target_nickname: "Mock Player", amount: 90000, base: 90000, admin_fee: 0, status: "COMPLETED", payment_method: "qris", payment_channel: "QRIS", game_id: 1, game_name: "Mobile Legends Indonesia", game_slug: "mobile-legends-indonesia", game_logo_url: GAME_LOGO, sn: "SN-MOCK-0001", created_at: "2026-05-01T08:00:00Z" },
  { id: 2, invoice_number: "INV-MOCK-0002", service_name: "8100 UC", service_detail: "PUBG MOBILE Indonesia", target: "512345678", target_nickname: "MockPlayer", amount: 110000, base: 110000, admin_fee: 4000, status: "COMPLETED", payment_method: "virtual_account", payment_channel: "BCA Virtual Account", game_id: 5, game_name: "PUBG MOBILE Indonesia", game_slug: "pubg-mobile", game_logo_url: null, sn: "SN-MOCK-0002", created_at: "2026-04-28T14:30:00Z" },
  { id: 3, invoice_number: "INV-MOCK-0003", service_name: "172 Diamonds", service_detail: "Mobile Legends Indonesia", target: "987654321", target_nickname: "MockPlayer", amount: 45000, base: 45000, admin_fee: 0, status: "PROCESSING", payment_method: "ewallet", payment_channel: "GoPay", game_id: 1, game_name: "Mobile Legends Indonesia", game_slug: "mobile-legends-indonesia", game_logo_url: GAME_LOGO, sn: null, created_at: "2026-04-27T09:10:00Z" },
  { id: 4, invoice_number: "INV-MOCK-0004", service_name: "706 Robux", service_detail: "Roblox Game Indonesia", target: "33445566", target_nickname: "MockBuilder", amount: 180000, base: 180000, admin_fee: 0, status: "PENDING", payment_method: "qris", payment_channel: "QRIS", game_id: 4, game_name: "Roblox Game Indonesia", game_slug: "roblox", game_logo_url: null, sn: null, created_at: "2026-04-27T08:00:00Z" },
  { id: 5, invoice_number: "INV-MOCK-0005", service_name: "355 Diamonds", service_detail: "Mobile Legends Indonesia", target: "123456789", target_nickname: "Mock Player", amount: 90000, base: 90000, admin_fee: 0, status: "FAILED_PROVIDER", payment_method: "ewallet", payment_channel: "DANA", game_id: 1, game_name: "Mobile Legends Indonesia", game_slug: "mobile-legends-indonesia", game_logo_url: GAME_LOGO, sn: null, created_at: "2026-04-20T11:45:00Z" },
  { id: 6, invoice_number: "INV-MOCK-0006", service_name: "172 Diamonds", service_detail: "Mobile Legends Indonesia", target: "123456789", target_nickname: "Mock Player", amount: 45000, base: 45000, admin_fee: 0, status: "COMPLETED", payment_method: "qris", payment_channel: "QRIS", game_id: 1, game_name: "Mobile Legends Indonesia", game_slug: "mobile-legends-indonesia", game_logo_url: GAME_LOGO, sn: "SN-MOCK-0006", created_at: "2026-04-15T16:20:00Z" },
  { id: 7, invoice_number: "INV-MOCK-0007", service_name: "Voucher Rp 100.000", service_detail: "Google Play Voucher", target: "buyer@example.com", target_nickname: null, amount: 102500, base: 102500, admin_fee: 0, status: "REFUNDED", payment_method: "qris", payment_channel: "QRIS", game_id: 11, game_name: "Google Play Voucher", game_slug: "google-play-voucher", game_logo_url: null, sn: null, created_at: "2026-04-10T10:00:00Z" },
  { id: 8, invoice_number: "INV-MOCK-0008", service_name: "74 Diamonds", service_detail: "Mobile Legends Indonesia", target: "123456789", target_nickname: "Mock Player", amount: 20000, base: 20000, admin_fee: 0, status: "COMPLETED", payment_method: "ewallet", payment_channel: "OVO", game_id: 1, game_name: "Mobile Legends Indonesia", game_slug: "mobile-legends-indonesia", game_logo_url: GAME_LOGO, sn: "SN-MOCK-0008", created_at: "2026-04-02T13:05:00Z" },
];

export const MOCK_DASHBOARD: MemberDashboardData = {
  wallet: { balance: MOCK_USER.balance, points: MOCK_USER.point },
  stats: { total: 24, pending: 1, process: 2, success: 19, failed: 2 },
  total_spent: 1850000,
  recent_transactions: MOCK_TRANSACTIONS.slice(0, 5),
};

export const MOCK_POINTS: PointsSummary = {
  points: MOCK_USER.point,
  redeem_rate: 1,
  redeem_value: MOCK_USER.point,
  allows_point_spending: true,
};

export const MOCK_ACTIVITY_LOGS: MemberActivityLogRow[] = [
  { id: 1, type: "login", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Berhasil masuk ke akun", created_at: "2026-05-01T07:55:00Z" },
  { id: 2, type: "transaction", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Membuat pesanan INV-MOCK-0001", created_at: "2026-05-01T08:00:00Z" },
  { id: 3, type: "security", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Memperbarui kata sandi akun", created_at: "2026-04-29T09:12:00Z" },
  { id: 4, type: "membership", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Berlangganan paket Gold", created_at: "2026-04-01T00:00:00Z" },
  { id: 5, type: "transaction", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Pesanan INV-MOCK-0005 gagal diproses", created_at: "2026-04-20T11:45:00Z" },
  { id: 6, type: "verification", actor: "Budi Santoso", role: "member", ip_address: "103.28.14.5", user_agent: "Chrome / macOS", message: "Memverifikasi email akun", created_at: "2026-01-01T00:00:00Z" },
];

export const MOCK_CREDENTIALS: ApiCredentialListResponse = {
  credentials: [
    {
      id: 1,
      name: "Default",
      masked_key: "tpg_live_••••••••••••1234",
      callback_url: "https://merchant.example/callback",
      whitelist_ips: ["103.28.14.5"],
      last_used_at: "2026-04-30T12:00:00Z",
      created_at: "2026-03-01T00:00:00Z",
    },
  ],
  callback_url: "https://merchant.example/callback",
  whitelist_ips: ["103.28.14.5"],
};

export const MOCK_ISSUED_CREDENTIAL: IssuedCredential = {
  ...MOCK_CREDENTIALS.credentials[0],
  secret: "tpg_live_mock0123456789abcdef0123456789abcdef",
};

export const MOCK_TOPUP_RESULT: TopupResult = {
  reference_id: "TOPUP-MOCK-0001",
  amount: 50000,
  admin_fee: 4000,
  total: 54000,
  status: "PENDING",
  payment: {
    channel: "BCA Virtual Account",
    channel_code: "bca_va",
    type: "virtual_account",
    instructions: { order_no: "TOPUP-MOCK-0001", virtual_account: "88081234567890", bank_code: "BCA" },
  },
};

export const MOCK_BALANCE_MUTATIONS: BalanceMutationModel[] = [
  { id: 1, type: "refund", amount: 102500, balance_before: 147500, balance_after: 250000, reference: "INV-MOCK-0007", description: "Refund INV-MOCK-0007", created_at: "2026-04-11T10:00:00Z" },
  { id: 2, type: "topup", amount: 100000, balance_before: 47500, balance_after: 147500, reference: "TOPUP-MOCK-0000", description: "Isi saldo via BCA VA", created_at: "2026-04-05T09:00:00Z" },
  { id: 3, type: "purchase", amount: -45000, balance_before: 92500, balance_after: 47500, reference: "INV-MOCK-0006", description: "Pembelian INV-MOCK-0006", created_at: "2026-04-15T16:20:00Z" },
  { id: 4, type: "adjustment", amount: 10000, balance_before: 82500, balance_after: 92500, reference: null, description: "Bonus poin loyalitas", created_at: "2026-04-02T00:00:00Z" },
];

export const MOCK_MEMBER_REFUNDS: MemberRefundModel[] = [
  {
    refund_number: "RFD-MOCK-0001",
    invoice_number: "INV-MOCK-0007",
    product: "Voucher Rp 100.000",
    amount: 102500,
    status: "COMPLETED",
    claimed_at: "2026-04-11T09:00:00Z",
    verify_due_at: "2026-04-13T09:00:00Z",
    refunded_at: "2026-04-11T10:00:00Z",
    reject_reason: null,
    created_at: "2026-04-11T09:00:00Z",
  },
  {
    refund_number: "RFD-MOCK-0002",
    invoice_number: "INV-MOCK-0005",
    product: "355 Diamonds",
    amount: 90000,
    status: "PROCESSING",
    claimed_at: "2026-04-21T08:00:00Z",
    verify_due_at: "2026-04-23T08:00:00Z",
    refunded_at: null,
    reject_reason: null,
    created_at: "2026-04-21T08:00:00Z",
  },
];

export const MOCK_PAYOUT_BANKS: PayoutBank[] = [
  { code: "BCA", name: "Bank Central Asia", is_ewallet: false },
  { code: "BNI", name: "Bank Negara Indonesia", is_ewallet: false },
  { code: "BRI", name: "Bank Rakyat Indonesia", is_ewallet: false },
  { code: "MANDIRI", name: "Bank Mandiri", is_ewallet: false },
  { code: "GOPAY", name: "GoPay", is_ewallet: true },
  { code: "DANA", name: "DANA", is_ewallet: true },
];

export const MOCK_REFUND_CLAIM: RefundClaimModel = {
  refund_number: "RFD-MOCK-0001",
  invoice_number: "INV-MOCK-0007",
  product: "Voucher Rp 100.000",
  amount: 102500,
  status: "WAITING_DETAILS",
  method: "manual_transfer",
  can_submit_payout: true,
  can_claim_account: false,
  verify_due_at: "2026-04-13T09:00:00Z",
  contact: { email: "buyer@example.com", phone: "+62******890" },
  payout: null,
  refunded_at: null,
  created_at: "2026-04-11T09:00:00Z",
};

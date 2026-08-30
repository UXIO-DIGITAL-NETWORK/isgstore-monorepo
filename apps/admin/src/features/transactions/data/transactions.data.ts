import { formatCurrency } from "@/utils/currency";
import type { ActivityLogActor, ActivityLogEntry, Transaction } from "../types/transaction.type";

/**
 * Typed mock fixtures (backend not built yet). The first two rows reproduce
 * exact figures/copy from the Automatic Transaction History reference image
 * — a deliberate exact-fidelity exception, same precedent as
 * dashboard/financial fixtures. The rest are synthetic rows so
 * pagination/filtering has something to act on.
 *
 * Seeds carry every field except `activity_log` — the audit trail is derived
 * from each row below, so neither the 10 literals nor the synthetic generator
 * has to hand-write one.
 */
const TRANSACTION_SEEDS: Omit<Transaction, "activity_log">[] = [
  {
    id: "txn-1",
    invoice_no: "ZP2607016UJFJVSHCJ",
    invoice_ref: "UX1T8Z6B99946B8XE2CK",
    payment_status: "success",
    invoice_status: "success",
    provider_status: "delivered",
    customer: {
      user_id: 1001,
      name: "Randy Galang",
      phone: "+629876543210",
    },
    game: { id: "game-mlbb-id", name: "Mobile Legends Indonesia" },
    product: { id: "prod-19-diamond", name: "19 Diamond (17 + 2 Bonus)" },
    cost: 4752,
    profit: 47,
    admin_fee: 0,
    target_ref: "1453734692(16057)",
    payment_method: "Credits",
    created_at: "2026-07-01T14:56:37.000Z",
    resolved_at: "2026-07-01T14:58:00.000Z",
    elapsed_seconds: 83,
    updated_at: "2026-07-01T14:58:00.000Z",
  },
  {
    id: "txn-2",
    invoice_no: "ZP2607027KDLMNQRST",
    invoice_ref: "UX1T8Z6B99946B8XE3DL",
    payment_status: "expired",
    invoice_status: "failed",
    provider_status: "rejected",
    customer: {
      user_id: 1002,
      name: "Sinta Dewi",
      phone: "+628123456789",
    },
    game: { id: "game-ff", name: "Free Fire" },
    product: { id: "prod-100-diamond", name: "100 Diamond" },
    cost: 15000,
    profit: 500,
    admin_fee: 500,
    target_ref: "998877665(20011)",
    payment_method: "QRIS",
    created_at: "2026-07-02T09:12:04.000Z",
    resolved_at: "2026-07-02T09:14:10.000Z",
    elapsed_seconds: 126,
    updated_at: "2026-07-02T09:14:10.000Z",
  },
  {
    id: "txn-3",
    invoice_no: "ZP2607031ABCDEFGHI",
    payment_status: "pending",
    invoice_status: "pending",
    provider_status: "not_ordered",
    customer: { user_id: 1003, name: "Budi Santoso", phone: "+628234567890" },
    game: { id: "game-pubgm", name: "PUBG Mobile" },
    product: { id: "prod-660-uc", name: "660 UC" },
    cost: 145000,
    admin_fee: 1000,
    payment_method: "Virtual Account",
    created_at: "2026-07-03T10:20:00.000Z",
    updated_at: "2026-07-03T10:20:00.000Z",
  },
  {
    id: "txn-4",
    invoice_no: "ZP2607041JKLMNOPQR",
    payment_status: "pending",
    invoice_status: "processing",
    provider_status: "ordered",
    customer: { user_id: 1004, name: "Wulan Ayu", phone: "+628345678901" },
    game: { id: "game-genshin", name: "Genshin Impact" },
    product: { id: "prod-genesis-crystal", name: "980 Genesis Crystal" },
    cost: 199000,
    admin_fee: 1500,
    payment_method: "E-Wallet",
    created_at: "2026-07-04T11:05:00.000Z",
    updated_at: "2026-07-04T11:05:00.000Z",
  },
  {
    id: "txn-5",
    invoice_no: "ZP2607051STUVWXYZA",
    payment_status: "success",
    invoice_status: "refunded",
    provider_status: "undelivered",
    customer: { user_id: null, name: "Guest Buyer", phone: "+628456789012" },
    game: { id: "game-mlbb-id", name: "Mobile Legends Indonesia" },
    product: { id: "prod-86-diamond", name: "86 Diamond" },
    cost: 21000,
    profit: 300,
    admin_fee: 0,
    target_ref: "1453734777(16058)",
    payment_method: "Credits",
    created_at: "2026-07-05T08:30:00.000Z",
    resolved_at: "2026-07-05T08:33:12.000Z",
    elapsed_seconds: 192,
    updated_at: "2026-07-05T08:33:12.000Z",
  },
  {
    id: "txn-6",
    invoice_no: "ZP2607062BCDEFGHIJ",
    payment_status: "success",
    invoice_status: "partial_success",
    provider_status: "ordered",
    customer: { user_id: 1006, name: "Agus Setiawan", phone: "+628567890123" },
    game: { id: "game-ff", name: "Free Fire" },
    product: { id: "prod-310-diamond", name: "310 Diamond" },
    cost: 45000,
    profit: 900,
    admin_fee: 0,
    target_ref: "112233445(20012)",
    payment_method: "QRIS",
    created_at: "2026-07-06T13:40:00.000Z",
    resolved_at: "2026-07-06T13:42:30.000Z",
    elapsed_seconds: 150,
    updated_at: "2026-07-06T13:42:30.000Z",
  },
  {
    id: "txn-7",
    invoice_no: "ZP2607073CDEFGHIJK",
    payment_status: "expired",
    invoice_status: "failed",
    provider_status: "rejected",
    customer: { user_id: 1007, name: "Rina Marlina", phone: "+628678901234" },
    game: { id: "game-pubgm", name: "PUBG Mobile" },
    product: { id: "prod-325-uc", name: "325 UC" },
    cost: 72000,
    admin_fee: 500,
    payment_method: "Virtual Account",
    created_at: "2026-07-07T15:00:00.000Z",
    resolved_at: "2026-07-07T15:01:45.000Z",
    elapsed_seconds: 105,
    updated_at: "2026-07-07T15:01:45.000Z",
  },
  {
    id: "txn-8",
    invoice_no: "ZP2607084DEFGHIJKL",
    payment_status: "success",
    invoice_status: "success",
    provider_status: "delivered",
    customer: { user_id: 1008, name: "Randy Galang", phone: "+629876543210" },
    game: { id: "game-genshin", name: "Genshin Impact" },
    product: { id: "prod-topup-60", name: "60 Genesis Crystal" },
    cost: 16000,
    profit: 200,
    admin_fee: 0,
    target_ref: "1453734692(16059)",
    payment_method: "Credits",
    created_at: "2026-07-08T09:00:00.000Z",
    resolved_at: "2026-07-08T09:01:10.000Z",
    elapsed_seconds: 70,
    updated_at: "2026-07-08T09:01:10.000Z",
  },
  {
    id: "txn-9",
    invoice_no: "ZP2607095EFGHIJKLM",
    payment_status: "pending",
    invoice_status: "pending",
    provider_status: "not_ordered",
    customer: { user_id: 1009, name: "Dewi Lestari", phone: "+628789012345" },
    game: { id: "game-mlbb-id", name: "Mobile Legends Indonesia" },
    product: { id: "prod-343-diamond", name: "343 Diamond" },
    cost: 90000,
    admin_fee: 1000,
    payment_method: "E-Wallet",
    created_at: "2026-07-09T12:15:00.000Z",
    updated_at: "2026-07-09T12:15:00.000Z",
  },
  {
    id: "txn-10",
    invoice_no: "ZP2607106FGHIJKLMN",
    payment_status: "success",
    invoice_status: "success",
    provider_status: "delivered",
    customer: { user_id: 1010, name: "Hendra Wijaya", phone: "+628890123456" },
    game: { id: "game-ff", name: "Free Fire" },
    product: { id: "prod-520-diamond", name: "520 Diamond" },
    cost: 75000,
    profit: 1200,
    admin_fee: 0,
    target_ref: "556677889(20013)",
    payment_method: "QRIS",
    created_at: "2026-07-10T07:45:00.000Z",
    resolved_at: "2026-07-10T07:46:52.000Z",
    elapsed_seconds: 112,
    updated_at: "2026-07-10T07:46:52.000Z",
  },
  ...generateSyntheticRows(30),
];

export const TRANSACTIONS: Transaction[] = TRANSACTION_SEEDS.map((row) => ({
  ...row,
  activity_log: buildActivityLog(row),
}));

/**
 * ~30 additional synthetic rows (cycling the same names/products/statuses
 * already used above — nothing new invented) so the fixture totals ~40 rows.
 * At the default page size (10) that's `lastPage = 4`, matching the
 * reference's 4 live, clickable pagination pages — without this, `lastPage`
 * would always be 1 and Next/page-2+ would be permanently disabled.
 * `meta.total` in the service response stays the deliberate `9999999`
 * placeholder; only `last_page` (derived from real fixture length) changes.
 */
function generateSyntheticRows(count: number): Omit<Transaction, "activity_log">[] {
  const names = ["Randy Galang", "Sinta Dewi", "Budi Santoso", "Wulan Ayu", "Agus Setiawan", "Rina Marlina"];
  const phones = ["+629876543210", "+628123456789", "+628234567890", "+628345678901", "+628567890123", "+628678901234"];
  const games = [
    { id: "game-mlbb-id", name: "Mobile Legends Indonesia" },
    { id: "game-ff", name: "Free Fire" },
    { id: "game-pubgm", name: "PUBG Mobile" },
    { id: "game-genshin", name: "Genshin Impact" },
  ];
  const products = ["19 Diamond (17 + 2 Bonus)", "100 Diamond", "660 UC", "980 Genesis Crystal", "310 Diamond"];
  const methods = ["Credits", "QRIS", "Virtual Account", "E-Wallet"];
  const statuses: Transaction["invoice_status"][] = ["success", "failed", "pending", "processing"];
  // Declared in here rather than at module scope: this function is called
  // above its own definition, and `const` does not hoist the way `function` does.
  const providerFor: Record<string, Transaction["provider_status"]> = {
    success: "delivered",
    failed: "rejected",
    pending: "not_ordered",
    processing: "ordered",
  };

  return Array.from({ length: count }, (_, i) => {
    const n = i % names.length;
    const status = statuses[i % statuses.length];
    const game = games[i % games.length];
    const day = 11 + i; // continues from txn-10's Jul 10
    const createdAt = new Date(Date.UTC(2026, 6, day, 8 + (i % 12), (i * 7) % 60, 0));
    const resolved = status === "success" || status === "failed";

    return {
      id: `txn-synthetic-${i + 1}`,
      invoice_no: `ZP2607${String(200 + i)}SYN${i}`,
      // The two lifecycles are no longer the same value. A failed order is one
      // the customer PAID for and the supplier then fluffed — copying `status`
      // into both would have produced rows that cannot exist.
      payment_status: status === "pending" ? "pending" : "success",
      provider_status: providerFor[status],
      invoice_status: status,
      customer: { user_id: 2000 + i, name: names[n], phone: phones[n] },
      game,
      product: { id: `prod-synthetic-${i}`, name: products[i % products.length] },
      cost: 10000 + i * 1000,
      profit: resolved ? 100 + i * 10 : undefined,
      admin_fee: i % 3 === 0 ? 0 : 500,
      payment_method: methods[i % methods.length],
      created_at: createdAt.toISOString(),
      resolved_at: resolved ? new Date(createdAt.getTime() + 90_000).toISOString() : undefined,
      elapsed_seconds: resolved ? 90 : undefined,
      updated_at: (resolved ? new Date(createdAt.getTime() + 90_000) : createdAt).toISOString(),
    };
  });
}

type ActivityStep = Omit<ActivityLogEntry, "id" | "created_at">;

/**
 * The event sequence a row actually went through, branched on its invoice
 * status. Exhaustive over TransactionStatus on purpose — a new status becomes
 * a compile error rather than a silently empty log.
 *
 * The reference image's two example rows repeated the parent transaction's
 * product name and target reference in Action/Description, which reads as
 * unvaried placeholder content rather than logged events
 * (product_requirements.md §4.3). Action is therefore a short event label and
 * Description that event's specific detail, per the PRD's reinterpretation.
 *
 * Every entry is attributed to the transaction's own customer: the reference
 * repeats the same user on every row, so the User column identifies whose
 * transaction the trail belongs to rather than who performed each event. The
 * `"system"` actor stays in the type (product_requirements.md §6) for when
 * the real API sends it, but no fixture produces one.
 */
function activitySteps(row: Omit<Transaction, "activity_log">): ActivityStep[] {
  const actor: ActivityLogActor = { name: row.customer.name, phone: row.customer.phone };
  const created: ActivityStep = {
    actor,
    action: "Invoice Created",
    description: `Invoice ${row.invoice_no} created for ${row.product.name}.`,
  };
  const paid: ActivityStep = {
    actor,
    action: "Payment Received",
    description: `Payment of ${formatCurrency(row.cost, { fractionDigits: 0 })} confirmed via ${row.payment_method}.`,
  };

  switch (row.invoice_status) {
    case "pending":
      return [
        created,
        { actor, action: "Payment Pending", description: `Awaiting payment via ${row.payment_method}.` },
      ];
    case "processing":
      return [
        created,
        paid,
        {
          actor,
          action: "Order Forwarded",
          description: `Order forwarded to the provider for ${row.game.name}, awaiting fulfilment.`,
        },
      ];
    case "success":
      return [
        created,
        paid,
        { actor, action: "Callback Received", description: "Callback received from provider, HTTP 200 OK." },
        { actor, action: "Status Changed", description: "Status changed from Processing to Success." },
      ];
    case "failed":
      return [
        created,
        paid,
        {
          actor,
          action: "Provider Error",
          description: "Provider returned HTTP 502, top-up was not delivered.",
        },
        { actor, action: "Status Changed", description: "Status changed from Processing to Failed." },
        {
          actor,
          action: "Callback Resent",
          description: "Callback resent to the provider for reconciliation.",
        },
      ];
    case "refunded":
      return [
        created,
        paid,
        { actor, action: "Status Changed", description: "Status changed from Processing to Success." },
        {
          actor,
          action: "Refund Issued",
          description: `Partial refund issued to ${row.customer.name} for the undelivered items.`,
        },
      ];
    case "partial_success":
      return [
        created,
        paid,
        { actor, action: "Status Changed", description: "Status changed from Pending to Success." },
        {
          actor,
          action: "Manually Edited",
          description: "Invoice status set to Partial Success after operator review.",
        },
      ];
  }
}

/**
 * Deterministic audit trail per row. Every timestamp derives from that row's
 * own created_at/resolved_at — never Date.now() — so tests can assert exact
 * values (the opposite of dashboard/data/activity-log.data.ts, which is
 * intentionally relative-to-now). Steps are spread evenly across the row's
 * lifetime, which keeps them chronological without hand-tuning an offset per
 * fixture; Math.round pins the last entry exactly on resolved_at.
 */
function buildActivityLog(row: Omit<Transaction, "activity_log">): ActivityLogEntry[] {
  const created = new Date(row.created_at).getTime();
  // Rows that never resolved get a nominal 2-minute window to spread across.
  const end = row.resolved_at ? new Date(row.resolved_at).getTime() : created + 120_000;
  const steps = activitySteps(row);
  const gap = (end - created) / (steps.length - 1);

  return steps.map((step, index) => ({
    id: `${row.id}-act-${index + 1}`,
    ...step,
    created_at: new Date(created + Math.round(gap * index)).toISOString(),
  }));
}

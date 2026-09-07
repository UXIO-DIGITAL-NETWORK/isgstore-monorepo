# Guest refunds become a claim, paid as balance

## What changed

The guest refund path stopped being a bank transfer. A guest whose paid order
fails at the provider is now refunded **as balance on their account** — which
means there has to be an account, so they create one (or sign in) through the
claim link, and an admin verifies it before the money moves.

```
Paid → failed at provider
  └─ InitiateRefundAction
       ├─ member → balance credited inline, COMPLETED        (unchanged)
       └─ guest  → method=balance_claim, WAITING_ACCOUNT
                   + claim link to email & WhatsApp

Failed invoice page → "Ajukan Pengembalian Dana"
  → /{locale}/refund?invoice=…  → resend → tokened link in the inbox
  → register or sign in → PENDING, verify_due_at = +2 working days
  → admin verifies → balance credited, COMPLETED, settlement reversed
```

`manual_transfer` is retired: no new rows, but the open ones still drain through
the same queue, so every payout guard keeps handling it.

## Why it is shaped this way

**The CTA does not open a signup form.** The failed-invoice page opens on the
invoice number alone and deliberately never carries the claim token, and
registration has no email verification — so a signup form reachable from that
page would let anyone who saw a screenshot register with the buyer's email and
take the money. The token stays mandatory; the contact match is the second lock,
not the first.

**Balance is not cash.** Members cannot withdraw balance to a bank, so the
claim page says so in as many words before the customer commits.

**Rejecting a claim is not rejecting the refund.** The money never left, so a
suspicious claim returns the row to `WAITING_ACCOUNT` with a fresh link to the
original contact. One combined verb would have buried real buyers' refunds
permanently, since `transaction_id` is unique and a `REJECTED` row can never be
re-opened.

**The order stays a guest order.** `transactions.user_id` is not rewritten —
that column drives attribution and reporting. The customer sees the money in
their balance history and on the new "Pengembalian Dana" page instead.

## Decisions taken (product)

1. Balance only; manual transfer retired for new refunds.
2. The claiming account's email or phone must match the order's.
3. Existing account holders may sign in and claim.
4. No auto-void: unclaimed refunds stay outstanding, with an admin list.
5. SLA 2×24 working hours, measured from the claim.

## Surface

**API** — `refund_requests` gains `claimed_user_id` (restrictOnDelete),
`claimed_at`, `claimed_contact_match`, `claimed_contact_value`, `verify_due_at`,
`claim_rejected_count`. New: `RefundMethod::BALANCE_CLAIM`,
`RefundStatus::WAITING_ACCOUNT` + `claimable()`, `ClaimRefundWithAccountAction`,
`RejectRefundClaimAction`, `RefundContactMatcher`, `RefundSla`, `config/refund.php`,
`NotifyRoleAction`, `MemberRefundController`. Routes:
`POST /v1/refund-claims/{token}/register|attach`,
`POST /v1/refunds/{id}/reject-claim`, `GET /v1/me/refunds`.
`RefundGatewayJob` deleted (its one-release no-op window is over).

**Admin FE** — verify-and-credit dialog with the order-vs-account comparison and
sibling-claim warning, separate reject-claim dialog, SLA column, overdue banner,
unclaimed/overdue filters.

**Storefront** — `ClaimAccountCard` (register / sign-in tabs) behind the token,
`balance_claim` CTA on the failed invoice, member "Pengembalian Dana" page.

## Deploy order

Frontend schema-tolerance first (both FEs learned the new status and method
values before the API emits them), then the API, then the full frontend feature.
Open `manual_transfer` rows must be worked to completion on the old path — no
migration of live financial rows.

import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useRefundDetail } from "../hooks/useRefunds";
import { RefundMethodBadge, RefundStatusBadge } from "./RefundStatusBadge";

interface RefundDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refundId: string;
}

const formatDate = (value: string | null | undefined) => (value ? formatDateTime(value) : "—");

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box className="flex items-start justify-between gap-4 py-1.5">
      <Text
        variant="muted"
        as="span"
        className="shrink-0"
      >
        {label}
      </Text>
      <Box className="text-right">{value}</Box>
    </Box>
  );
}

/**
 * Read-only detail. `enabled` is the open state and is load-bearing: this is
 * mounted once per table row, so without it every visible row would fetch on
 * mount.
 */
export function RefundDetailDialog({ open, onOpenChange, refundId }: RefundDetailDialogProps) {
  const { t } = useTranslation("refunds");
  const { data: refund, isLoading, isError } = useRefundDetail(refundId, open);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{refund?.refund_number ?? t("refundFallback")}</DialogTitle>
        </DialogHeader>

        {isLoading && <Text variant="muted">{t("loading")}</Text>}
        {isError && <Text className="text-destructive">{t("loadFailed")}</Text>}

        {refund && (
          <Box className="divide-border flex flex-col divide-y">
            <Box className="pb-2">
              <Row
                label={t("status")}
                value={<RefundStatusBadge status={refund.status} />}
              />
              <Row
                label={t("method")}
                value={<RefundMethodBadge method={refund.method} />}
              />
              <Row
                label={t("amount")}
                value={
                  <Text
                    as="span"
                    className="font-semibold tabular-nums"
                  >
                    {formatCurrency(refund.amount, { fractionDigits: 0 })}
                  </Text>
                }
              />
            </Box>

            <Box className="py-2">
              <Row
                label={t("invoice")}
                value={
                  <Text
                    as="span"
                    className="tabular-nums"
                  >
                    {refund.transaction.invoice_number ?? "—"}
                  </Text>
                }
              />
              <Row
                label={t("product")}
                value={refund.transaction.product ?? "—"}
              />
              <Row
                label={t("opened")}
                value={formatDate(refund.created_at)}
              />
            </Box>

            <Box className="py-2">
              <Row
                label={t("customer")}
                value={refund.customer.name ?? (refund.customer.is_guest ? "Guest" : "—")}
              />
              <Row
                label={t("email")}
                value={refund.customer.email ?? "—"}
              />
              <Row
                label={t("phone")}
                value={refund.customer.phone ?? "—"}
              />
              <Row
                label={t("claimLinkSent")}
                value={
                  (refund.method === "manual_transfer" || refund.method === "balance_claim") &&
                  !refund.claim_notified_at ? (
                    <Text
                      as="span"
                      className="text-destructive"
                    >{t("neverContactManually")}</Text>
                  ) : (
                    formatDate(refund.claim_notified_at)
                  )
                }
              />
            </Box>

            {/* The verification record. Everything here is frozen at claim
                time — the account may have changed its email since, and the
                decision has to be reviewable against what actually matched. */}
            {refund.claimed_account && (
              <Box className="py-2">
                <Row
                  label={t("claimedBy")}
                  value={refund.claimed_account.name ?? "—"}
                />
                <Row
                  label={t("accountEmail")}
                  value={refund.claimed_account.email ?? "—"}
                />
                <Row
                  label={t("accountPhone")}
                  value={refund.claimed_account.phone ?? "—"}
                />
                <Row
                  label={t("matchedOn")}
                  value={
                    refund.claimed_account.contact_match
                      ? `${refund.claimed_account.contact_match} — ${refund.claimed_account.contact_value ?? "—"}`
                      : "—"
                  }
                />
                <Row
                  label={t("claimedAt")}
                  value={formatDate(refund.claimed_account.claimed_at)}
                />
                <Row
                  label={t("accountStatus")}
                  value={
                    refund.claimed_account.account_status === "active" ? (
                      "Active"
                    ) : (
                      <Text
                        as="span"
                        className="text-destructive"
                      >
                        {refund.claimed_account.account_status ?? "unknown"} — cannot be credited
                      </Text>
                    )
                  }
                />
                <Row
                  label={t("otherClaims")}
                  value={
                    refund.claimed_account.sibling_claims > 0 ? (
                      <Text
                        as="span"
                        className="text-warning"
                      >
                        {refund.claimed_account.sibling_claims} by this account
                      </Text>
                    ) : (
                      "None"
                    )
                  }
                />
                <Row
                  label={t("verifyBy")}
                  value={
                    refund.is_overdue ? (
                      <Text
                        as="span"
                        className="text-destructive"
                      >
                        {formatDate(refund.verify_due_at)} — overdue
                      </Text>
                    ) : (
                      formatDate(refund.verify_due_at)
                    )
                  }
                />
                {refund.claim_rejected_count > 0 && (
                  <Row
                    label={t("claimsRejected")}
                    value={
                      <Text
                        as="span"
                        className="text-warning"
                      >
                        {refund.claim_rejected_count}
                      </Text>
                    }
                  />
                )}
              </Box>
            )}

            {refund.payout && (
              <Box className="py-2">
                <Row
                  label={t("bankOrEwallet")}
                  value={refund.payout.bank_name ?? refund.payout.bank_code}
                />
                <Row
                  label={t("account")}
                  value={
                    <Text
                      as="span"
                      className="tabular-nums"
                    >
                      {refund.payout.account_number ?? refund.payout.account_phone ?? "—"}
                    </Text>
                  }
                />
                <Row
                  label={t("accountName")}
                  value={refund.payout.account_name ?? "—"}
                />
                <Row
                  label={t("suppliedBy")}
                  value={refund.payout.submitted_by === "admin" ? "An admin (not confirmed by the customer)" : "The customer"}
                />
              </Box>
            )}

            <Box className="py-2">
              <Row
                label={t("handledBy")}
                value={refund.processed_by ?? "—"}
              />
              <Row
                label={t("refundedAt")}
                value={formatDate(refund.refunded_at)}
              />
              {refund.admin_note && (
                <Row
                  label={t("note")}
                  value={refund.admin_note}
                />
              )}
              {refund.reject_reason && (
                <Row
                  label={t("rejectedBecause")}
                  value={refund.reject_reason}
                />
              )}
              {refund.proof_url && (
                <Row
                  label={t("transferReceipt")}
                  value={
                    <Link
                      href={refund.proof_url}
                      target="_blank"
                    >{t("open")}</Link>
                  }
                />
              )}
            </Box>

            {refund.status === "COMPLETED" && !refund.settlement_reversed_at && (
              <Box className="flex items-start gap-2 pt-3">
                <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
                <Text
                  variant="small"
                  className="text-destructive"
                >{t("settlementNotReversed")}</Text>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

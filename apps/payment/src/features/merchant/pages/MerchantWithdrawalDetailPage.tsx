import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isWithdrawalFailed, withdrawalStatusHintKey, withdrawalStatusLabelKey } from "@/lib/withdrawalStatus";
import type { WithdrawalStatus } from "@/types/withdrawal.type";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

import { useMerchantWithdrawal } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/** The path a payout walks when nothing goes wrong, in order. */
const PATH: WithdrawalStatus[] = ["PENDING", "APPROVED", "PROCESSING", "SETTLED"];

interface MerchantWithdrawalDetailPageProps {
  /** The payout's human-readable number — the API keys this read on it, not on the id. */
  number: string;
}

/**
 * One payout, in full: where the money is going, how far it has got, and — when
 * it did not arrive — why.
 *
 * The timeline is built from EVIDENCE rather than from the status alone, because
 * a payout that FAILED has no single rank: `approved_at` proves we approved it,
 * and a `disbursement_ref` proves it reached the gateway. Reading the status
 * alone would show a failed payout as if it never started.
 *
 * Nothing here is a dead end: a rejected or failed payout ends with the reason
 * (when the gateway gave one) and the way to try again, and a settled one shows
 * the proof of transfer.
 */
export default function MerchantWithdrawalDetailPage({ number }: MerchantWithdrawalDetailPageProps) {
  const { t } = useTranslation("merchant");
  const { data: withdrawal, isLoading, isError } = useMerchantWithdrawal(number);

  if (isLoading) {
    return <Text variant="small">{t("withdrawalDetail.loading")}</Text>;
  }

  if (isError || !withdrawal) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>{t("withdrawalDetail.notFound")}</Heading>
        <Link
          href="/app/payment-admin/withdrawals"
          className="underline"
        >
          {t("withdrawalDetail.backToWithdrawals")}
        </Link>
      </Box>
    );
  }

  const failed = isWithdrawalFailed(withdrawal.status);
  const statusLabelKey = withdrawalStatusLabelKey(withdrawal.status);
  const statusHintKey = withdrawalStatusHintKey(withdrawal.status);

  // How far the money actually got. A terminal failure keeps the progress it
  // made — the money really did pass those steps on the way to failing.
  const rank =
    withdrawal.status === "SETTLED"
      ? 3
      : withdrawal.status === "PROCESSING"
        ? 2
        : withdrawal.status === "APPROVED"
          ? 1
          : withdrawal.status === "PENDING"
            ? 0
            : withdrawal.disbursement_ref
              ? 2
              : withdrawal.approved_at
                ? 1
                : 0;

  const steps: { status: WithdrawalStatus; at: string | null }[] = PATH.map((status, i) => ({
    status,
    // Only what we can date: the request itself and our approval are stamped.
    at: i === 0 ? withdrawal.created_at : status === "APPROVED" ? withdrawal.approved_at : null,
  }));

  return (
    <Box className="flex max-w-3xl flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-admin/withdrawals"
          className="text-sm text-muted-foreground underline"
        >
          {t("withdrawalDetail.backToWithdrawals")}
        </Link>
        <Box className="flex flex-wrap items-center gap-3">
          <Heading level={1}>{withdrawal.withdrawal_number}</Heading>
          <StatusBadge
            status={withdrawal.status}
            label={statusLabelKey ? t(statusLabelKey) : undefined}
          />
        </Box>
      </Box>

      {/* What the status means, and who the client is waiting on. */}
      {statusHintKey && (
        <Text
          variant="small"
          className={failed ? "text-destructive" : "text-muted-foreground"}
        >
          {t(statusHintKey)}
        </Text>
      )}

      {failed && (
        <Alert
          variant="destructive"
          role="status"
        >
          <XCircle aria-hidden="true" />
          <AlertTitle>{t("withdrawalDetail.failedTitle")}</AlertTitle>
          <AlertDescription>
            <Box className="flex flex-col items-start gap-3">
              <Text
                as="span"
                variant="small"
              >
                {/* Who ended it decides what we can honestly say: only a
                    gateway failure carries a reason, a rejection does not. */}
                {withdrawal.failure_reason ??
                  t(
                    withdrawal.status === "REJECTED"
                      ? "withdrawalDetail.rejectedFallback"
                      : "withdrawalDetail.failedFallback",
                  )}
              </Text>
              <Text
                as="span"
                variant="small"
              >
                {t("withdrawalDetail.failedBalanceNote")}
              </Text>
              <Link href="/app/payment-admin/withdrawals">
                <Button variant="outline">{t("withdrawalDetail.retry")}</Button>
              </Link>
            </Box>
          </AlertDescription>
        </Alert>
      )}

      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Heading level={2}>{t("withdrawalDetail.summary")}</Heading>
        <Row
          label={t("withdrawals.amount")}
          value={money(withdrawal.amount)}
        />
        <Row
          label={t("withdrawals.feeLabel")}
          value={money(withdrawal.fee)}
          note={t("withdrawals.feeNote")}
        />
        <Row
          label={t("withdrawals.receivedLabel")}
          value={money(withdrawal.nett)}
          emphasis
        />
        <Row
          label={t("withdrawalDetail.requestedAt")}
          value={formatDateTime(withdrawal.created_at)}
        />
        {withdrawal.approved_at && (
          <Row
            label={t("withdrawalDetail.approvedAt")}
            value={formatDateTime(withdrawal.approved_at)}
          />
        )}
        {withdrawal.disbursement_ref && (
          <Row
            label={t("withdrawalDetail.disbursementRef")}
            value={withdrawal.disbursement_ref}
          />
        )}
        {withdrawal.proof_url && (
          <Link
            href={withdrawal.proof_url}
            target="_blank"
            rel="noreferrer"
            className="w-fit"
          >
            <Button variant="outline">{t("withdrawalDetail.viewProof")}</Button>
          </Link>
        )}
      </Box>

      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Heading level={2}>{t("withdrawalDetail.destination")}</Heading>
        <Row
          label={t("withdrawals.bankOrEwallet")}
          value={withdrawal.bank_code}
        />
        {withdrawal.account_number && (
          <Row
            label={t("withdrawals.accountNumber")}
            value={withdrawal.account_number}
          />
        )}
        <Row
          label={t("withdrawals.accountName")}
          value={withdrawal.account_name}
        />
        {withdrawal.account_phone && (
          <Row
            label={t("withdrawals.accountPhone")}
            value={withdrawal.account_phone}
          />
        )}
      </Box>

      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Heading level={2}>{t("withdrawalDetail.timeline")}</Heading>

        <Box
          as="ol"
          className="flex flex-col gap-4"
        >
          {steps.map((step, i) => {
            const reached = i <= rank;
            const current = i === rank && !failed;
            const labelKey = withdrawalStatusLabelKey(step.status);

            return (
              <Box
                as="li"
                key={step.status}
                className="flex items-start gap-3"
                {...(current ? { "aria-current": "step" as const } : {})}
              >
                {reached ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-success"
                  />
                ) : (
                  <Circle
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground/50"
                  />
                )}
                <Box className="flex min-w-0 flex-col gap-0.5">
                  <Text
                    as="span"
                    className={reached ? "font-medium" : "text-muted-foreground"}
                  >
                    {labelKey ? t(labelKey) : step.status}
                  </Text>
                  {step.at && (
                    <Text
                      as="span"
                      variant="small"
                    >
                      {formatDateTime(step.at)}
                    </Text>
                  )}
                  {/* The step the payout is sitting on is explained once, under
                      the status at the top — saying it again here would be the
                      same sentence twice on one screen. */}
                </Box>
              </Box>
            );
          })}

          {failed && (
            <Box
              as="li"
              className="flex items-start gap-3"
              aria-current="step"
            >
              <XCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-destructive"
              />
              <Box className="flex min-w-0 flex-col gap-0.5">
                <Text
                  as="span"
                  className="font-medium"
                >
                  {statusLabelKey ? t(statusLabelKey) : withdrawal.status}
                </Text>
                {/* Explained once, under the status at the top. */}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {withdrawal.notes && (
        <Box className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
          <Heading level={2}>{t("withdrawalDetail.notes")}</Heading>
          <Text variant="small">{withdrawal.notes}</Text>
        </Box>
      )}
    </Box>
  );
}

function Row({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <Box className="flex flex-col gap-0.5">
      <Box className="flex items-baseline justify-between gap-4">
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          {label}
        </Text>
        <Text
          as="span"
          className={emphasis ? "font-semibold tabular-nums" : "tabular-nums"}
        >
          {value}
        </Text>
      </Box>
      {note && (
        <Text
          as="span"
          variant="small"
        >
          {note}
        </Text>
      )}
    </Box>
  );
}

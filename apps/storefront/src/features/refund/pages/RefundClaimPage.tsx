import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearch } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import RefundLookupCard from "@/features/refund/components/RefundLookupCard";
import PayoutDetailsForm from "@/features/refund/components/PayoutDetailsForm";
import ClaimAccountCard from "@/features/refund/components/ClaimAccountCard";
import RefundSummaryCard from "@/features/refund/components/RefundSummaryCard";
import { useRefundClaim, useSubmitPayoutDetails } from "@/features/refund/hooks/useRefundClaim";

/**
 * The public refund claim page, at `/{locale}/refund`.
 *
 * Two modes, decided by whether the URL carries a token:
 *
 *   - **`?token=…`** (the emailed link) — shows the refund and, depending on
 *     which scheme it belongs to, either the account form (`balance_claim`, the
 *     current one) or the bank-account form (`manual_transfer`, retired and
 *     draining). The API decides which via `can_claim_account` /
 *     `can_submit_payout`; this page never infers it from the status.
 *   - **no token** — shows only the lookup, which re-sends the link out of
 *     band. The form is never reachable from an invoice number alone; that
 *     number already opens the public invoice page, and must not also be enough
 *     to redirect where the money goes.
 *
 * `?invoice=` pre-fills the lookup so the "claim your refund" button on a
 * failed invoice costs the customer one field instead of two.
 */
export default function RefundClaimPage(): React.JSX.Element {
  const { t } = useTranslation("refund");
  const { locale } = useParams({ from: "/$locale/refund/" });
  const { token, invoice } = useSearch({ from: "/$locale/refund/" });

  const { data: claim, isLoading, isError } = useRefundClaim(token ?? null);
  const submit = useSubmitPayoutDetails(token ?? null);

  // Claiming kills the token, so the page cannot simply refetch afterwards —
  // it keeps the claimed projection the mutation handed back instead.
  const [claimed, setClaimed] = useState(false);

  // The mutation returns the refreshed claim, so the page can show the saved
  // account immediately without a refetch round-trip.
  const current = submit.data?.data ?? claim;

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      <Box className="flex flex-col items-center px-4">
        <Box className="flex flex-col items-center gap-3 pt-12 pb-4">
          <Text
            as="p"
            className="font-outfit font-bold text-[32px] md:text-[38px] text-white uppercase tracking-wide leading-tight text-center"
          >
            {t("hero.title")}
          </Text>
          <Text as="p" className="font-inter text-[14px] text-white/55 leading-snug text-center max-w-lg">
            {t("hero.subtitle")}
          </Text>
        </Box>
      </Box>

      <Box className="max-w-3xl mx-auto px-4 md:px-8 pb-16 flex flex-col gap-4">
        {token && isLoading && (
          <Text as="p" className="font-inter text-[13px] text-white/55 text-center py-8">
            {t("claim.loading")}
          </Text>
        )}

        {token && isError && (
          <Box className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-4">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <Box className="flex flex-col gap-1">
              <Text as="span" className="font-inter text-[13px] text-white/80">
                {t("claim.invalid")}
              </Text>
              <Text as="span" className="font-inter text-[12px] text-white/55">
                {t("claim.invalidHelp")}
              </Text>
            </Box>
          </Box>
        )}

        {current && (
          <>
            <RefundSummaryCard claim={current} />

            {/* The current scheme: the money needs an account to land in. */}
            {current.can_claim_account && !claimed && token && (
              <ClaimAccountCard
                token={token}
                amount={current.amount}
                contact={current.contact}
                locale={locale}
                onClaimed={() => setClaimed(true)}
              />
            )}

            {claimed && (
              <Box className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-4">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <Box className="flex flex-col gap-1">
                  <Text as="span" className="font-inter text-[13px] text-white/80">
                    {t("claimed.heading")}
                  </Text>
                  <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
                    {t("claimed.body")}
                  </Text>
                </Box>
              </Box>
            )}

            {/* The retired scheme, still draining. */}
            {current.can_submit_payout && (
              <PayoutDetailsForm
                onSubmit={(payload) => submit.mutate(payload)}
                isPending={submit.isPending}
              />
            )}

            {!current.can_submit_payout && !current.can_claim_account && !claimed && current.status !== "COMPLETED" && (
              <Box className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-4">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <Box className="flex flex-col gap-1">
                  <Text as="span" className="font-inter text-[13px] text-white/80">
                    {t("submitted.heading")}
                  </Text>
                  <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
                    {t("submitted.body")}
                  </Text>
                </Box>
              </Box>
            )}

            {current.status === "COMPLETED" && (
              <Box className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-4">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <Box className="flex flex-col gap-1">
                  <Text as="span" className="font-inter text-[13px] text-white/80">
                    {t("done.heading")}
                  </Text>
                  <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
                    {t("done.body")}
                  </Text>
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Always reachable: a customer whose link expired needs a new one from
            the same page they landed on. */}
        {(!token || isError) && <RefundLookupCard defaultInvoiceNumber={invoice} />}
      </Box>

      <Footer />
    </Box>
  );
}

import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTransactionForm } from "../components/EditTransactionForm";
import { useTransaction } from "../hooks/useTransactions";

/**
 * Manual status override (product_requirements.md §4.3) — a dedicated route
 * since 2026-07-13, replacing the earlier modal. Breadcrumb
 * "Transaction › Automatic › Edit Transaction" is driven by the URL
 * (DashboardNavbar), not set here.
 *
 * The reference's subcopy is "Lorem Ipsum Dolor Sit Amet." — still
 * placeholder despite being spelled correctly, so real copy is used below.
 *
 * Everything is derived from the pathname rather than passed in, so one
 * component serves all three mounts: the Automatic tab, the Manual tab, and
 * the unauthenticated preview.
 */
export default function EditTransactionPage() {
  const { t } = useTranslation("transactions");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { invoiceNo } = useParams({ strict: false });
  const listHref = pathname.replace(/\/[^/]+\/edit\/?$/, "");

  const { data: transaction, isPending, isError } = useTransaction(invoiceNo ?? "");

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("editTitle")}</Heading>
        <Text variant="muted">{t("editSubtitle")}</Text>
      </Box>

      {isPending ? (
        <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          {["payment-status", "invoice-status", "serial-number", "invoice-proof"].map((field) => (
            <Skeleton
              key={field}
              className="h-10 w-full rounded-xl"
            />
          ))}
        </Box>
      ) : isError || !transaction ? (
        <Box className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
          <Text variant="muted">No transaction found for {invoiceNo}.</Text>
          <Link
            href={listHref}
            className="text-sm font-medium underline underline-offset-4"
          >{t("backToTransactions")}</Link>
        </Box>
      ) : (
        <EditTransactionForm
          // Remount if the route param changes under us, so the form's
          // defaultValues can never describe a different transaction.
          key={transaction.id}
          transaction={transaction}
          cancelHref={listHref}
          onSaved={() => navigate({ to: listHref as unknown as string })}
        />
      )}
    </Box>
  );
}

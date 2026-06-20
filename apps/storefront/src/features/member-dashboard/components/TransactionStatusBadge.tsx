import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Box } from "@/components/common/Box";
import { useTranslation } from "react-i18next";
import type { RecentTransactionStatus } from "@/features/member-dashboard/types/dashboard.type";

const badgeVariants = cva(
  "inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-outfit font-bold leading-none tracking-wide",
  {
    variants: {
      status: {
        pending: "bg-[#78350F]/20 text-[#FBBF24] border border-[#FBBF24]/30",
        success: "bg-[#065F46]/20 text-[#34D399] border border-[#34D399]/30",
        failed: "bg-[#7F1D1D]/20 text-[#F87171] border border-[#F87171]/30",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

interface Props extends VariantProps<typeof badgeVariants> {
  status: RecentTransactionStatus;
  className?: string;
}

export default function TransactionStatusBadge({ status, className }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const labelMap: Record<RecentTransactionStatus, string> = {
    pending: t("recentTransactions.statusPending"),
    success: t("recentTransactions.statusSuccess"),
    failed: t("recentTransactions.statusFailed"),
  };

  return (
    <Box className={cn(badgeVariants({ status }), className)}>
      {labelMap[status]}
    </Box>
  );
}

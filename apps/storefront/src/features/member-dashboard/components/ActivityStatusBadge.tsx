import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Box } from "@/components/common/Box";
import { useTranslation } from "react-i18next";
import type { ActivityType } from "@/features/member-dashboard/types/activityLog.type";

const badgeVariants = cva(
  "inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-outfit font-bold leading-none tracking-wide",
  {
    variants: {
      type: {
        login:        "bg-[#065F46]/20 text-[#34D399] border border-[#34D399]/30",
        membership:   "bg-[rgb(39,53,15)]/20 text-[rgb(208,201,129)] border border-[rgb(208,201,129)]/30",
        transaction:  "bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30",
        security:     "bg-[#78350F]/20 text-[#FBBF24] border border-[#FBBF24]/30",
        verification: "bg-[#0C3344]/20 text-[#22D3EE] border border-[#22D3EE]/30",
        failed:       "bg-[#7F1D1D]/20 text-[#F87171] border border-[#F87171]/30",
      },
    },
    defaultVariants: { type: "login" },
  },
);

interface Props extends VariantProps<typeof badgeVariants> {
  type: ActivityType;
  className?: string;
}

export default function ActivityStatusBadge({ type, className }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <Box className={cn(badgeVariants({ type }), className)}>
      {t(`activityLog.badge.${type}`)}
    </Box>
  );
}

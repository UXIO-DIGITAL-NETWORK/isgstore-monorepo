import React from "react";
import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { PriceStatus } from "@/features/price-list/types/priceList.type";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-outfit font-medium leading-none whitespace-nowrap",
  {
    variants: {
      status: {
        active: "bg-[#0EA42E]/20 text-[#0EA42E]",
        inactive: "bg-white/10 text-white/40",
      },
    },
    defaultVariants: { status: "active" },
  },
);

interface Props {
  status: PriceStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");

  return (
    <Box className={cn(badgeVariants({ status }), className)}>
      {t(`status.${status}`)}
    </Box>
  );
}

import React from "react";
import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { TrackOrderStatus } from "@/features/track-order/types/trackOrder.type";

const pillVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-outfit font-medium leading-none whitespace-nowrap",
  {
    variants: {
      status: {
        success: "bg-[#0EA42E]/20 text-[#0EA42E]",
        process: "bg-[#9234EA]/20 text-[#C084FC]",
        failed: "bg-[#EF4444]/20 text-[#EF4444]",
      },
    },
    defaultVariants: { status: "process" },
  },
);

interface Props {
  status: TrackOrderStatus;
  className?: string;
}

export default function StatusPill({ status, className }: Props): React.JSX.Element {
  const { t } = useTranslation("trackOrder");

  return (
    <Box className={cn(pillVariants({ status }), className)}>
      {t(`status.${status}`)}
    </Box>
  );
}

import React from "react";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { PaymentOption } from "@/features/member-dashboard/types/upgradeMembership.type";

const chipVariants = cva(
  "w-[52px] h-7 rounded-md bg-white flex items-center justify-center px-1 shrink-0 cursor-pointer outline-none transition-all",
  {
    variants: {
      selected: {
        true: "ring-2 ring-[rgb(208,201,129)]",
        false: "ring-1 ring-transparent hover:ring-white/20",
      },
    },
    defaultVariants: { selected: false },
  },
);

interface Props {
  option: PaymentOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function PaymentLogoChip({
  option,
  isSelected,
  onSelect,
}: Props): React.JSX.Element {
  return (
    <Box
      as="button"
      type="button"
      onClick={() => onSelect(option.id)}
      className={cn(chipVariants({ selected: isSelected }))}
      title={option.name}
    >
      <img
        src={option.logo}
        alt={option.name}
        className="max-w-full max-h-full object-contain"
        loading="lazy"
      />
    </Box>
  );
}

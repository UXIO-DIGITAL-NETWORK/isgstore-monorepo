import React from "react";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import type { PaymentOption } from "@/features/checkout/types/checkout.type";

const rowVariants = cva(
  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all outline-none",
  {
    variants: {
      selected: {
        true: "border-[#C084FC] bg-[rgba(192,132,252,0.07)]",
        false: "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
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

export default function PaymentOptionRow({ option, isSelected, onSelect }: Props): React.JSX.Element {
  return (
    <Box
      as="button"
      type="button"
      onClick={() => onSelect(option.id)}
      className={cn(rowVariants({ selected: isSelected }))}
    >
      {/* Radio indicator */}
      <Box
        className={cn(
          "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          isSelected ? "border-[#C084FC]" : "border-white/25",
        )}
      >
        {isSelected && (
          <Box className="w-2 h-2 rounded-full bg-[#9234EA]" />
        )}
      </Box>

      {/* Provider logo */}
      <Box className="w-[52px] h-7 rounded-md bg-white flex items-center justify-center px-1 shrink-0">
        <img
          src={option.logo}
          alt={option.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </Box>

      {/* Name */}
      <Text
        as="span"
        className={cn(
          "font-inter text-[13px] text-left leading-none",
          isSelected ? "text-white font-medium" : "text-white/65",
        )}
      >
        {option.name}
      </Text>
    </Box>
  );
}

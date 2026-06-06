import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  stepNumber?: number;
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export default function SectionCard({
  stepNumber,
  title,
  children,
  className,
  headerRight,
}: SectionCardProps): React.JSX.Element {
  return (
    <Box
      className={cn(
        "rounded-[16px] border border-[rgba(147,51,234,0.35)] bg-[rgba(147,51,234,0.04)] overflow-hidden",
        className,
      )}
    >
      {/* Header strip */}
      <Box className="flex items-center justify-between gap-3 px-4 py-3 bg-[rgba(146,52,234,0.12)] border-b border-[rgba(146,52,234,0.3)]">
        <Box className="flex items-center gap-3">
          {stepNumber !== undefined && (
            <Box className="w-6 h-6 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] flex items-center justify-center shrink-0">
              <Text
                as="span"
                className="font-outfit font-bold text-[11px] text-white leading-none"
              >
                {stepNumber}
              </Text>
            </Box>
          )}
          <Text
            as="span"
            className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
          >
            {title}
          </Text>
        </Box>
        {headerRight && <Box>{headerRight}</Box>}
      </Box>

      {/* Body */}
      <Box className="p-4">{children}</Box>
    </Box>
  );
}

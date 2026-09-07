import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  stepNumber?: number;
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  gradientBorder?: boolean;
}

export default function SectionCard({
  stepNumber,
  icon,
  title,
  children,
  className,
  headerRight,
  gradientBorder = false,
}: SectionCardProps): React.JSX.Element {
  const header = (
    <Box className="flex flex-col">
      {/* Top row: step badge + title + optional right slot */}
      <Box className="flex items-center justify-between gap-3 px-4 py-5">
        <Box className="flex items-center gap-3">
          {icon !== undefined && icon}
          {stepNumber !== undefined && icon === undefined && (
            <Box className="w-7 h-7 rounded-lg bg-linear-to-r from-[#9333EA] to-[#3B82F6] flex items-center justify-center shrink-0">
              <Text as="span" className="font-outfit font-bold text-[12px] text-white leading-none">
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
      {/* Divider between header and content */}
      <Box className="h-px bg-white/8 mx-0" />
    </Box>
  );

  if (gradientBorder) {
    return (
      <Box className={cn("p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA]", className)}>
        <Box className="rounded-[15px] bg-[#0D1117] overflow-hidden">
          {header}
          <Box className="p-4">{children}</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={cn(
        "rounded-4xl border border-[rgba(147,51,234,0.35)] bg-[#0D1117] overflow-hidden",
        className,
      )}
    >
      {header}
      <Box className="p-4">{children}</Box>
    </Box>
  );
}

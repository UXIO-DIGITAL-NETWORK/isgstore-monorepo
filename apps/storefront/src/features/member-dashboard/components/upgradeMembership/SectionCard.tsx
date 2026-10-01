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

/**
 * Numbered step-badge card matching the isiSaldo SectionCard visual — recreated
 * locally to respect the no-cross-feature-import rule.
 */
export default function SectionCard({
  stepNumber,
  title,
  children,
  className,
  headerRight,
}: SectionCardProps): React.JSX.Element {
  const header = (
    <Box className="flex flex-col">
      <Box className="flex items-center justify-between gap-3 px-4 py-5">
        <Box className="flex items-center gap-3">
          {stepNumber !== undefined && (
            <Box className="w-7 h-7 rounded-lg bg-linear-to-r from-[rgb(208,201,129)] to-[rgb(67,86,32)] flex items-center justify-center shrink-0">
              <Text
                as="span"
                className="font-outfit font-bold text-[12px] text-white leading-none"
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
      {/* Divider */}
      <Box className="h-px bg-white/8 mx-0" />
    </Box>
  );

  return (
    <Box className={cn("p-px rounded-2xl bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)]", className)}>
      <Box className="rounded-[15px] bg-[rgb(14,20,10)] overflow-hidden">
        {header}
        <Box className="p-4">{children}</Box>
      </Box>
    </Box>
  );
}

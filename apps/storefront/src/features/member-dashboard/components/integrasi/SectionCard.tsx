import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

/** Gradient-border card wrapper for Integrasi sections — no step badge variant.
 *  Recreated locally to respect the no-cross-feature-import rule. */
export default function SectionCard({
  title,
  children,
  className,
  headerRight,
}: SectionCardProps): React.JSX.Element {
  return (
    <Box className={cn("p-px rounded-2xl bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)]", className)}>
      <Box className="rounded-[15px] bg-[rgb(14,20,10)] overflow-hidden">
        {/* Header */}
        <Box className="flex flex-col">
          <Box className="flex items-center justify-between gap-3 px-4 py-5">
            <Text
              as="span"
              className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
            >
              {title}
            </Text>
            {headerRight && <Box>{headerRight}</Box>}
          </Box>
          {/* Divider */}
          <Box className="h-px bg-white/8 mx-0" />
        </Box>
        {/* Body */}
        <Box className="p-4">{children}</Box>
      </Box>
    </Box>
  );
}

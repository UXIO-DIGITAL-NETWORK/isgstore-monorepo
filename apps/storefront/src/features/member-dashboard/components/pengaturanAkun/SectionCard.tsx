import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

/** Gradient-border card wrapper for Pengaturan Akun sections.
 *  Recreated locally to respect the no-cross-feature-import rule. */
export default function SectionCard({
  title,
  children,
  className,
  headerRight,
}: SectionCardProps): React.JSX.Element {
  return (
    <Box className={cn("p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA]", className)}>
      <Box className="rounded-[15px] bg-[#0D1117] overflow-hidden">
        {/* Header */}
        <Box className="flex flex-col">
          <Box className="flex items-center justify-between gap-3 px-4 py-5">
            <Box className="flex items-center gap-2">
              {typeof title === "string" ? (
                <Text
                  as="span"
                  className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
                >
                  {title}
                </Text>
              ) : (
                title
              )}
            </Box>
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

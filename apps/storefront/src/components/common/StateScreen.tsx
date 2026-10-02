import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

/**
 * The one visual shape every "there is no content here" screen uses.
 *
 * Empty, error, route-level failure and the crash boundary all reduced to the
 * same anatomy — glow ring, icon, heading, one line of copy, optional actions —
 * so a customer meets the same object whether a list is empty or a request
 * failed, and only the tone changes.
 */
const glowVariants = cva("absolute inset-0 rounded-full blur-xl", {
  variants: {
    tone: {
      neutral: "bg-[rgb(208,201,129)]/15",
      error: "bg-red-500/15",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const iconToneVariants = cva("", {
  variants: {
    tone: {
      neutral: "text-[rgb(208,201,129)]",
      error: "text-red-400",
    },
  },
  defaultVariants: { tone: "neutral" },
});

interface StateScreenProps extends VariantProps<typeof glowVariants> {
  /** A single icon element (e.g. `<Inbox />`); sized and coloured by the wrapper. */
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links rendered under the copy. */
  actions?: React.ReactNode;
  className?: string;
}

export function StateScreen({
  tone,
  icon,
  title,
  description,
  actions,
  className,
}: StateScreenProps): React.JSX.Element {
  return (
    <Box
      role="status"
      className={cn("flex flex-col items-center justify-center gap-5 py-16 text-center", className)}
    >
      <Box className="relative flex h-20 w-20 items-center justify-center">
        <Box className={glowVariants({ tone })} />
        <Box
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 [&>svg]:h-9 [&>svg]:w-9",
            iconToneVariants({ tone }),
          )}
        >
          {icon}
        </Box>
      </Box>

      <Box className="flex max-w-md flex-col items-center gap-2">
        <Heading as="h3" className="font-outfit text-[18px] font-bold leading-tight text-white">
          {title}
        </Heading>
        {description ? (
          <Text as="p" className="font-inter text-[14px] leading-relaxed text-[#909AAE]">
            {description}
          </Text>
        ) : null}
      </Box>

      {actions ? <Box className="flex flex-wrap items-center justify-center gap-3">{actions}</Box> : null}
    </Box>
  );
}

export type { StateScreenProps };

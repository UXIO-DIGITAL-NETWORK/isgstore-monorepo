import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";

/**
 * The pulse block every loading placeholder is built from.
 *
 * It is `aria-hidden` on purpose: a skeleton is decorative, and announcing a
 * dozen empty boxes is noise. The section that owns the loading state is the
 * one that carries `aria-busy`, so a screen reader hears one "loading" rather
 * than an inventory.
 */
const skeletonVariants = cva("animate-pulse bg-white/[0.06]", {
  variants: {
    shape: {
      block: "rounded-md",
      card: "rounded-2xl",
      circle: "rounded-full",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "block",
  },
});

interface SkeletonProps
  extends React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof skeletonVariants> {
  className?: string;
}

export function Skeleton({ className, shape, ...rest }: SkeletonProps): React.JSX.Element {
  return <Box aria-hidden className={cn(skeletonVariants({ shape }), className)} {...rest} />;
}

/** A stack of text lines, the last one short so the block reads as a paragraph. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }): React.JSX.Element {
  return (
    <Box className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </Box>
  );
}

export type { SkeletonProps };

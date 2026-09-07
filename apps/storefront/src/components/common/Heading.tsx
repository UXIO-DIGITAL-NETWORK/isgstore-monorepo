import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-outfit text-white", {
  variants: {
    variant: {
      default: "font-semibold",
      display: "text-5xl md:text-6xl font-bold tracking-tight",
      title: "text-3xl md:text-4xl font-bold",
      subtitle: "text-xl md:text-2xl font-semibold text-white/70",
      section: "text-2xl font-semibold",
    },
    level: {
      1: "text-4xl md:text-5xl",
      2: "text-3xl md:text-4xl",
      3: "text-2xl md:text-3xl",
      4: "text-xl md:text-2xl",
      5: "text-lg md:text-xl",
      6: "text-base md:text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    level: 1,
  },
});

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingOwnProps extends VariantProps<typeof headingVariants> {
  as?: HeadingElement;
  children: React.ReactNode;
  className?: string;
}

type HeadingProps = HeadingOwnProps & Omit<React.ComponentPropsWithRef<"h1">, keyof HeadingOwnProps>;

const HeadingInner = (
  { as, level = 1, variant = "default", children, className, ...rest }: HeadingProps,
  ref: React.Ref<HTMLHeadingElement>,
) => {
  const Component = (as ?? (`h${level}` as HeadingElement)) as React.ElementType;
  return (
    <Component ref={ref} className={cn(headingVariants({ variant, level }), className)} {...rest}>
      {children}
    </Component>
  );
};

const Heading = React.forwardRef(HeadingInner) as React.ForwardRefExoticComponent<
  HeadingProps & React.RefAttributes<HTMLHeadingElement>
>;
Heading.displayName = "Heading";

export { Heading };
export type { HeadingProps };

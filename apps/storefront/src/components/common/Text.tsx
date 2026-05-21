import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("font-inter", {
  variants: {
    variant: {
      default: "text-base leading-relaxed text-white",
      lead: "text-xl leading-relaxed text-white/70",
      large: "text-lg leading-relaxed text-white",
      small: "text-sm leading-relaxed text-white/70",
      muted: "text-sm leading-relaxed text-white/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type TextElement = "p" | "span" | "div";

interface TextOwnProps extends VariantProps<typeof textVariants> {
  as?: TextElement;
  children: React.ReactNode;
  className?: string;
}

type TextProps = TextOwnProps & Omit<React.ComponentPropsWithRef<"p">, keyof TextOwnProps>;

const TextInner = (
  { as, variant = "default", children, className, ...rest }: TextProps,
  ref: React.Ref<HTMLElement>,
) => {
  const Component = ((as ?? "p") as React.ElementType);
  return (
    <Component ref={ref} className={cn(textVariants({ variant }), className)} {...rest}>
      {children}
    </Component>
  );
};

const Text = React.forwardRef(TextInner) as React.ForwardRefExoticComponent<
  TextProps & React.RefAttributes<HTMLElement>
>;
Text.displayName = "Text";

export { Text };
export type { TextProps };

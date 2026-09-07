import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto px-4 sm:px-6 lg:px-8", {
  variants: {
    maxWidth: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
      "7xl": "max-w-[1920px]",
      full: "max-w-full",
    },
    center: {
      true: "flex flex-col items-center",
      false: "",
    },
  },
  defaultVariants: {
    maxWidth: "7xl",
    center: false,
  },
});

type ContainerOwnProps<T extends React.ElementType> = {
  as?: T;
  children?: React.ReactNode;
  className?: string;
} & VariantProps<typeof containerVariants>;

type ContainerProps<T extends React.ElementType> = ContainerOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>;

type ContainerComponent = <T extends React.ElementType = "div">(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: ContainerProps<T> & { ref?: React.Ref<any> },
) => React.ReactElement | null;

type InternalContainerProps = {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  maxWidth?: VariantProps<typeof containerVariants>["maxWidth"];
  center?: VariantProps<typeof containerVariants>["center"];
  [key: string]: unknown;
};

const ContainerInner = (
  { as, children, className, maxWidth, center, ...rest }: InternalContainerProps,
  ref: React.Ref<HTMLElement>,
) => {
  const Component = as ?? "div";
  return (
    <Component ref={ref} className={cn(containerVariants({ maxWidth, center }), className)} {...rest}>
      {children}
    </Component>
  );
};

const Container = React.forwardRef(ContainerInner) as unknown as ContainerComponent & { displayName: string };
Container.displayName = "Container";

export { Container };
export type { ContainerProps, ContainerOwnProps };

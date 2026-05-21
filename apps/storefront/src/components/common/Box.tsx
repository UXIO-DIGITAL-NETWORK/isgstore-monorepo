import React from "react";
import { cn } from "@/lib/utils";

type BoxOwnProps<T extends React.ElementType> = {
  as?: T;
  children?: React.ReactNode;
  className?: string;
};

type BoxProps<T extends React.ElementType> = BoxOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof BoxOwnProps<T>>;

type BoxComponent = <T extends React.ElementType = "div">(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: BoxProps<T> & { ref?: React.Ref<any> },
) => React.ReactElement | null;

type InternalBoxProps = {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

const BoxInner = ({ as, children, className, ...rest }: InternalBoxProps, ref: React.Ref<HTMLElement>) => {
  const Component = as ?? "div";
  return (
    <Component ref={ref} className={cn(className)} {...rest}>
      {children}
    </Component>
  );
};

const Box = React.forwardRef(BoxInner) as unknown as BoxComponent & { displayName: string };
Box.displayName = "Box";

export { Box };
export type { BoxProps, BoxOwnProps };

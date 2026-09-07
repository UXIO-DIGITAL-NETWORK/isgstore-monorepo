import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-[50px] bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[14px] py-2 px-6 cursor-pointer disabled:opacity-70 transition-opacity hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

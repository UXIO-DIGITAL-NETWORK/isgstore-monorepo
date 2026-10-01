import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-[rgb(14,20,10)] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[rgb(67,86,32)]/60 transition-all",
        className,
      )}
      {...props}
    />
  );
}

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#3B82F6]/60 transition-all",
        className,
      )}
      {...props}
    />
  );
}

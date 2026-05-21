import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#C084FC] focus:bg-white/8 transition-all",
        className,
      )}
      {...props}
    />
  );
}

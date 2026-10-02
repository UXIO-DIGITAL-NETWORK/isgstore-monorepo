import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  className?: string;
};

/**
 * A checkbox drawn to the design system rather than the browser's default.
 *
 * The real input stays in the DOM (`sr-only`) so the label, keyboard focus and
 * screen readers keep working; the visible square is a sibling driven by
 * `peer-checked`. Same shape as `Input` — a styled native element, not a
 * HeroUI wrapper.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <input type="checkbox" className={cn("peer sr-only", className)} {...props} />
      <span
        aria-hidden
        className="w-5 h-5 rounded-md border border-white/20 bg-[rgb(14,20,10)] flex items-center justify-center transition-colors peer-checked:border-transparent peer-checked:bg-linear-to-r peer-checked:from-[rgb(67,86,32)] peer-checked:to-[rgb(208,201,129)] peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(67,86,32)]/60 peer-disabled:opacity-40 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity" />
      </span>
    </span>
  );
}

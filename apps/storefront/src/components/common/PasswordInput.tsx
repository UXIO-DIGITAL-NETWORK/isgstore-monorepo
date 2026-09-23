import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  /** The claim form is translated, so the toggle's accessible name is passed in. */
  showLabel?: string;
  hideLabel?: string;
};

/**
 * A password field with a show/hide toggle.
 *
 * A refund claim asks for a password to be invented on the spot, on a phone,
 * and typed twice. With no way to look at it, the confirmation mismatch is the
 * customer's problem to guess at. The toggle is a plain `type="button"` so it
 * can never submit the form it sits in, and it names itself for screen readers.
 */
export function PasswordInput({
  className,
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        // Room for the toggle. Applied last so the field's own padding cannot
        // leave the icon sitting on top of the text.
        className={cn(className, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        disabled={props.disabled}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/40 transition-colors outline-none hover:text-white/75 focus-visible:text-white/75 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  /** Accessible name for the reveal button. Defaults suit the English sign-in. */
  showLabel?: string;
  hideLabel?: string;
};

/**
 * A password field with a show/hide toggle.
 *
 * Typing a password blind is the usual reason a sign-in fails, and there was no
 * way to check what was actually typed. The toggle is a plain `type="button"` so
 * it can never submit the form it sits in, and it names itself so a screen
 * reader announces what it does.
 *
 * Forwards its ref, so `{...register("password")}` from react-hook-form works
 * exactly as it did on a bare `Input`.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { className, disabled, showLabel = "Show password", hideLabel = "Hide password", ...props },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          disabled={disabled}
          type={visible ? "text" : "password"}
          // Room for the toggle. Applied last so a caller's own padding cannot
          // leave the icon sitting on top of the text.
          className={cn(className, "pr-10")}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

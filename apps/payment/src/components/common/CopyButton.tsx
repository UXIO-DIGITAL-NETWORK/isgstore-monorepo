import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  /** The value to copy, when it is already in hand. */
  value?: string;
  /**
   * Fetches the value on demand. Lets a masked secret stay masked until the
   * moment it is copied, rather than being held in memory in advance.
   */
  getValue?: () => Promise<string>;
  /** Names the thing being copied, for the toast and the accessible label. */
  label?: string;
}

/** Copies a value to the clipboard and says so, briefly. */
export function CopyButton({ value, getValue, label }: CopyButtonProps) {
  const { t } = useTranslation("common");
  const name = label ?? t("copy.defaultLabel");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      const text = value ?? (await getValue?.()) ?? "";
      if (!text) return;

      // Absent in jsdom and over plain HTTP; failing loudly here would be
      // worse than telling the user to copy manually.
      if (!navigator.clipboard?.writeText) {
        toast.error(t("toast.clipboardUnavailable"));
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("copy.copied", { label: name }));

      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copy.failed", { label: name.toLowerCase() }));
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7"
      aria-label={t("copy.aria", { label: name })}
      onClick={copy}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

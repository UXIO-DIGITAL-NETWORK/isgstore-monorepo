import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Box } from "@/components/common/Box";
import { CopyButton } from "@/components/common/CopyButton";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import type { ServiceInstallationDetail } from "@/types/service.type";

/** How long a revealed secret stays on screen before hiding itself again. */
const AUTO_HIDE_MS = 30_000;

interface SecretValueProps {
  detail: ServiceInstallationDetail;
  /**
   * Fetches the plaintext. Must be backed by a mutation, never a query — a
   * cached query would put the secret in the TanStack devtools panel.
   */
  reveal: (id: number) => Promise<string>;
}

/**
 * Shows a handed-over value: plainly when it is not a secret, masked with a
 * reveal toggle when it is.
 *
 * Plaintext lives only in local state, auto-hides, and is cleared on unmount.
 * It is never written into `title`, `aria-label`, a `data-*` attribute, or the
 * console — each of those would survive a screenshot or a DOM dump.
 */
export function SecretValue({ detail, reveal }: SecretValueProps) {
  const [plaintext, setPlaintext] = useState<string>();
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      setPlaintext(undefined);
    },
    [],
  );

  if (!detail.is_secret) {
    return (
      <Box className="flex items-center gap-1">
        <Text
          as="span"
          className="font-mono text-sm break-all"
        >
          {detail.value ?? detail.masked_value}
        </Text>
        <CopyButton
          value={detail.value ?? detail.masked_value}
          label={detail.label}
        />
      </Box>
    );
  }

  const hide = () => {
    clearTimeout(timer.current);
    setPlaintext(undefined);
  };

  const show = async () => {
    if (plaintext) {
      hide();
      return;
    }

    setLoading(true);
    try {
      const value = await reveal(detail.id);
      setPlaintext(value);
      // Auto-hide so a secret left on a shared screen does not stay there.
      timer.current = setTimeout(() => setPlaintext(undefined), AUTO_HIDE_MS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex items-center gap-1">
      <Text
        as="span"
        className="font-mono text-sm break-all"
      >
        {plaintext ?? detail.masked_value}
      </Text>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7"
        disabled={loading}
        aria-label={plaintext ? `Sembunyikan ${detail.label}` : `Tampilkan ${detail.label}`}
        onClick={show}
      >
        {plaintext ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      <CopyButton
        getValue={() => (plaintext ? Promise.resolve(plaintext) : reveal(detail.id))}
        label={detail.label}
      />
    </Box>
  );
}

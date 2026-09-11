import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  /** Fetches the file body (e.g. the CSV blob) for the current filters. */
  onExport: () => Promise<Blob>;
  fileName?: string;
  disabled?: boolean;
}

/** Downloads whatever blob `onExport` resolves to, with an in-flight spinner. */
export function ExportButton({ onExport, fileName = "transaksi.csv", disabled }: Props) {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await onExport();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("toast.exportFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled || loading}>
      {loading ? <Spinner className="size-4" /> : <Download className="size-4" />}
      Export
    </Button>
  );
}

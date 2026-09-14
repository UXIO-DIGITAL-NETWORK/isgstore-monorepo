import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";

// Started as a categories-local copy of the transactions "Invoice Proof"
// dropzone (EditTransactionForm) and was promoted here when Products' Add form
// became the second feature to need one, exactly as that note prescribed.
// ponytail: transactions still has its own inline copy — fold it in the next
// time that form is touched, not as drive-by churn now.
const DEFAULT_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

/**
 * Whether the picked file satisfies the `accept` list.
 *
 * `accept` filters the file dialog only. A drop — and any browser that does not
 * implement the attribute — bypasses it entirely, so the first thing that
 * rejected an unsupported format used to be the server, one round trip later,
 * behind a generic toast. An empty `type` is allowed through: the browser could
 * not identify the file, and the server is the better judge.
 */
const matchesAccept = (file: File, accept: string): boolean => {
  if (!file.type) return true;

  const type = file.type.toLowerCase();

  return accept.split(",").some((entry) => {
    const candidate = entry.trim().toLowerCase();

    return candidate === type || (candidate.endsWith("/*") && type.startsWith(candidate.slice(0, -1)));
  });
};


interface ImageDropzoneProps {
  id: string;
  label: string;
  caption: string;
  value?: File;
  onChange: (file: File) => void;
  error?: string;
  /** Some fields take one more format than the JPG/JPEG/PNG default (WEBP) —
   * Sub Category's Logo (§4.5) and the product logo (§4.6). */
  accept?: string;
  formatsLabel?: string;
}

export function ImageDropzone({
  id,
  label,
  caption,
  value,
  onChange,
  error,
  accept = DEFAULT_ACCEPT,
  formatsLabel,
}: ImageDropzoneProps) {
  const { t } = useTranslation("common");
  const [dragActive, setDragActive] = useState(false);
  const [optimising, setOptimising] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Every image is re-encoded to WebP before it leaves the browser. The API
  // converts anyway, so a failure here costs bandwidth, never the upload —
  // compressImage returns the original file rather than throwing.
  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!matchesAccept(file, accept)) {
      setRejection(t("dropzone.unsupportedType"));
      return;
    }

    setRejection(null);
    setOptimising(true);

    try {
      onChange(await compressImage(file));
    } finally {
      setOptimising(false);
    }
  };

  return (
    <Box className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-dashed border-input p-6 text-center",
          // ponytail: ternary, not append — twMerge keeps both `bg-accent` and
          // `dark:bg-input/30` (different modifiers), and the dark: rule wins on
          // specificity, so appending would kill the drag highlight in dark mode.
          dragActive ? "border-foreground bg-accent" : "bg-transparent dark:bg-input/30",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <Text variant="small">{t("dropzone.prompt")}</Text>
        <Text variant="small">{formatsLabel ?? t("dropzone.formats")}</Text>
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => fileInputRef.current?.click()}
          disabled={optimising}
        >
          Browse files
        </Button>
        {optimising ? (
          <Text variant="small">{t("dropzone.optimising")}</Text>
        ) : (
          value && <Text variant="small">{value.name}</Text>
        )}
      </Box>
      <Text variant="small">{caption}</Text>
      {(error ?? rejection) && (
        <Text
          variant="small"
          className="text-destructive"
        >
          {error ?? rejection}
        </Text>
      )}
    </Box>
  );
}

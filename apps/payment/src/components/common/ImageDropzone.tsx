import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Started as a categories-local copy of the transactions "Invoice Proof"
// dropzone (EditTransactionForm) and was promoted here when Products' Add form
// became the second feature to need one, exactly as that note prescribed.
// ponytail: transactions still has its own inline copy — fold it in the next
// time that form is touched, not as drive-by churn now.
const DEFAULT_ACCEPT = "image/jpeg,image/jpg,image/png";
const DEFAULT_FORMATS_LABEL = "JPG, JPEG, PNG up to 10mb";

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
  formatsLabel = DEFAULT_FORMATS_LABEL,
}: ImageDropzoneProps) {
  const { t } = useTranslation("common");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onChange(file);
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
          handleFiles(event.dataTransfer.files);
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
        <Text variant="small">{formatsLabel}</Text>
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse files
        </Button>
        {value && <Text variant="small">{value.name}</Text>}
      </Box>
      <Text variant="small">{caption}</Text>
      {error && (
        <Text
          variant="small"
          className="text-destructive"
        >
          {error}
        </Text>
      )}
    </Box>
  );
}

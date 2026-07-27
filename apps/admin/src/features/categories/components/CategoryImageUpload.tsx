import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ponytail: categories-local copy of the transactions "Invoice Proof" dropzone
// (EditTransactionForm). Three uses within this feature now justify it staying
// here; promote to components/common only if another feature needs one —
// don't refactor transactions now.
const DEFAULT_ACCEPT = "image/jpeg,image/jpg,image/png";
const DEFAULT_FORMATS_LABEL = "JPG, JPEG, PNG up to 10mb";

interface CategoryImageUploadProps {
  id: string;
  label: string;
  caption: string;
  value?: File;
  onChange: (file: File) => void;
  error?: string;
  /** Sub Category's Logo takes one more format than Category's own logo
   * field (WEBP) — product_requirements.md §4.5, line 210. */
  accept?: string;
  formatsLabel?: string;
}

export function CategoryImageUpload({
  id,
  label,
  caption,
  value,
  onChange,
  error,
  accept = DEFAULT_ACCEPT,
  formatsLabel = DEFAULT_FORMATS_LABEL,
}: CategoryImageUploadProps) {
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
          "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center",
          dragActive && "border-foreground bg-accent",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <Text variant="small">Drag & drop files here</Text>
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

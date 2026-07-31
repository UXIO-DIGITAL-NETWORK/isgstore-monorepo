import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSubmitReviewMutation } from "@/features/invoice/hooks/useSubmitReviewMutation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Identifies the order being reviewed; omit to keep the modal read-only. */
  invoiceNumber?: string;
}

const CHIP_KEYS = [
  "fastProcess",
  "cheapPrice",
  "friendlyService",
  "easyPayment",
  "recommended",
] as const;

type ChipKey = (typeof CHIP_KEYS)[number];

export default function TransactionReviewModal({
  isOpen,
  onClose,
  invoiceNumber,
}: Props): React.ReactPortal | null {
  const { t } = useTranslation("invoice");
  const submitReview = useSubmitReviewMutation();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState<Set<ChipKey>>(new Set());
  const [comment, setComment] = useState("");

  // ESC to close + body scroll-lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleChip = (key: ChipKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    // Guests have no account to attach a rating to; the modal still closes so
    // the flow is never stuck behind a login they didn't ask for.
    if (!invoiceNumber) {
      onClose();
      return;
    }

    // Selected chips are prepended to the free text so the quick-review choice
    // survives into the single `comment` column the API stores.
    const chips = [...selected].map((key) => t(`review.chips.${key}`));
    const body = [chips.join(", "), comment.trim()].filter(Boolean).join(" — ");

    submitReview.mutate(
      { invoiceNumber, rating, comment: body || undefined },
      {
        onSuccess: () => {
          toast.success(t("review.thanks", { defaultValue: "Terima kasih atas ulasan Anda" }));
          onClose();
        },
        onError: (error: unknown) => {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            t("review.failed", { defaultValue: "Ulasan gagal dikirim." });
          toast.error(message);
        },
      },
    );
  };

  const activeStars = hovered || rating;

  return createPortal(
    // Backdrop
    <Box
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Gradient border wrapper */}
      <Box
        className="w-full max-w-md p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA] shadow-glow-violet"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={t("review.title")}
          className="rounded-[15px] bg-[rgba(42,4,98,0.82)] p-6 flex flex-col gap-5"
        >
          {/* Header */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="font-outfit font-bold text-[20px] text-white leading-tight uppercase"
            >
              {t("review.title")}
            </Text>
            <Text
              as="span"
              className="font-inter text-[13px] text-white/55 leading-snug"
            >
              {t("review.subtitle")}
            </Text>
          </Box>

          {/* Star rating */}
          <Box
            className="flex items-center gap-1.5"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Box
                key={star}
                as="button"
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= activeStars
                      ? "fill-[#FACC15] text-[#FACC15]"
                      : "fill-transparent text-white/25",
                  )}
                />
              </Box>
            ))}
          </Box>

          {/* Quick-review chips */}
          <Box className="flex flex-col gap-2.5">
            <Text
              as="span"
              className="font-inter text-[13px] text-white/55 leading-none"
            >
              {t("review.quickReviewLabel")}
            </Text>
            <Box className="flex flex-wrap gap-2">
              {CHIP_KEYS.map((key) => {
                const isActive = selected.has(key);
                return (
                  <Box
                    key={key}
                    as="button"
                    type="button"
                    onClick={() => handleToggleChip(key)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-inter border cursor-pointer transition-colors",
                      isActive
                        ? "border-[#C084FC] bg-[rgba(147,51,234,0.25)] text-white"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
                    )}
                  >
                    {t(`review.chips.${key}`)}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Comment textarea */}
          <Box
            as="textarea"
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setComment(e.target.value)
            }
            placeholder={t("review.placeholder")}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-inter text-[13px] text-white placeholder:text-white/35 resize-none min-h-[96px] focus:outline-none focus:border-[rgba(147,51,234,0.6)] transition-colors"
          />

          {/* Action buttons */}
          <Box className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[50px] border border-white/15 bg-white/5 px-6 py-2.5 font-outfit font-semibold text-[14px] text-white/80 cursor-pointer hover:bg-white/10 transition-colors"
            >
              {t("review.skip")}
            </button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 text-[14px]"
            >
              {t("review.submit")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}

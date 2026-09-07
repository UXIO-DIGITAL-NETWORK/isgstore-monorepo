import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Gift, X } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/format";
import { usePublicPromosQuery, useValidatePromoMutation } from "@/hooks/usePromoQuery";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Priced against the selected package so percentage codes resolve correctly. */
  productId?: number;
  amount?: number;
  onApplied?: (result: { code: string; discountAmount: number }) => void;
}

export default function VoucherModal({
  isOpen,
  onClose,
  productId,
  amount,
  onApplied,
}: Props): React.ReactPortal | null {
  const { t } = useTranslation("checkout");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const { data: promosResponse } = usePublicPromosQuery();
  const validatePromo = useValidatePromoMutation();
  const promos = promosResponse?.data ?? [];

  const handleApply = (candidate: string) => {
    const trimmed = candidate.trim().toUpperCase();
    if (!trimmed) return;

    validatePromo.mutate(
      { code: trimmed, product_id: productId, amount },
      {
        onSuccess: (response) => {
          const result = response.data;
          // The API answers 200 either way and carries the reason in the
          // message — invalid is a normal outcome, not a request failure.
          setMessage({ ok: result.valid, text: response.message });

          if (result.valid) {
            onApplied?.({ code: result.code ?? trimmed, discountAmount: result.discount_amount });
            onClose();
          }
        },
        onError: () => setMessage({ ok: false, text: t("promo.modal.error") }),
      },
    );
  };

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

  return createPortal(
    <Box
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Box
        className="w-full max-w-md p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA] shadow-glow-violet"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={t("promo.modal.title")}
          className="relative rounded-[15px] bg-[rgba(42,4,98,0.82)] p-6 flex flex-col gap-5"
        >
          <Box
            as="button"
            type="button"
            onClick={onClose}
            aria-label={t("promo.modal.close")}
            className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Box>

          {/* Header */}
          <Box className="flex flex-col gap-3 pr-8">
            <Box className="w-12 h-12 rounded-full bg-[#3B82F6]/15 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-[#3B82F6]" />
            </Box>
            <Box className="flex flex-col gap-1">
              <Text as="span" className="font-outfit font-bold text-[11px] tracking-[1.5px] text-[#3B82F6] uppercase leading-none">
                {t("promo.modal.eyebrow")}
              </Text>
              <Text as="span" className="font-outfit font-bold text-[20px] text-white leading-tight">
                {t("promo.modal.title")}
              </Text>
            </Box>
            <Text as="span" className="font-inter text-[13px] text-white/55 leading-relaxed">
              {t("promo.modal.description")}
            </Text>
          </Box>

          {/* Manual code entry */}
          <Box className="flex items-center gap-2">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("promo.modal.inputPlaceholder")}
              className="flex-1 uppercase tracking-wider text-[13px] border-[#3B82F6]/40 focus:border-[#3B82F6]"
            />
            <button
              type="button"
              disabled={code.trim() === "" || validatePromo.isPending}
              onClick={() => handleApply(code)}
              className="shrink-0 rounded-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:opacity-50 px-5 py-2.5 font-outfit font-semibold text-[13px] text-white transition-colors cursor-pointer"
            >
              {t("promo.modal.apply")}
            </button>
          </Box>

          {message && (
            <Text
              as="span"
              className={`font-inter text-[12px] leading-relaxed ${message.ok ? "text-[#0EA42E]" : "text-[#EF4444]"}`}
            >
              {message.text}
            </Text>
          )}

          <Box className="h-px bg-white/10" />

          {/* Available public vouchers */}
          <Box className="flex flex-col gap-3">
            <Text as="span" className="font-outfit font-bold text-[11px] tracking-[1px] text-white/40 uppercase leading-none">
              {t("promo.modal.availableTitle")}
            </Text>
            {promos.length === 0 ? (
              <Box className="rounded-2xl border border-dashed border-white/15 px-4 py-6 flex items-center justify-center text-center">
                <Text as="span" className="font-inter text-[13px] text-white/40">
                  {t("promo.modal.empty")}
                </Text>
              </Box>
            ) : (
              promos.map((promo) => (
                <Box
                  key={promo.id}
                  as="button"
                  type="button"
                  onClick={() => {
                    setCode(promo.code);
                    handleApply(promo.code);
                  }}
                  className="w-full rounded-2xl border border-white/15 hover:border-[#3B82F6]/60 px-4 py-3 flex flex-col gap-1 text-left transition-colors cursor-pointer"
                >
                  <Box className="flex items-center justify-between gap-3">
                    <Text as="span" className="font-outfit font-bold text-[13px] text-white tracking-wider">
                      {promo.code}
                    </Text>
                    <Text as="span" className="font-plex font-bold text-[13px] text-[#0EA42E]">
                      {promo.type === "percentage"
                        ? `-${promo.value}%`
                        : `-${formatCurrency(promo.value)}`}
                    </Text>
                  </Box>
                  <Text as="span" className="font-inter text-[12px] text-white/50 leading-relaxed">
                    {promo.description ?? promo.name}
                  </Text>
                  {promo.min_purchase > 0 && (
                    <Text as="span" className="font-inter text-[11px] text-white/35">
                      {t("promo.modal.minPurchase", { amount: formatCurrency(promo.min_purchase) })}
                    </Text>
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}

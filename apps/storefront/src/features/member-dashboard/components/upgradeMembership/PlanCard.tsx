import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MembershipPlan } from "@/features/member-dashboard/types/upgradeMembership.type";

const cardVariants = cva(
  "relative flex flex-col text-left rounded-xl border cursor-pointer select-none transition-all outline-none bg-[#0D1117] overflow-hidden",
  {
    variants: {
      selected: {
        true: "border-[#C084FC]",
        false: "border-white/[0.08] hover:border-[#C084FC]/40",
      },
    },
    defaultVariants: { selected: false },
  },
);

interface Props {
  plan: MembershipPlan;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function PlanCard({ plan, isSelected, onSelect }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  return (
    <Box
      as="button"
      type="button"
      onClick={() => onSelect(plan.id)}
      className={cn(cardVariants({ selected: isSelected }))}
      style={
        isSelected
          ? { boxShadow: "0 0 0 1px rgba(192,132,252,0.2), 0 0 16px rgba(147,51,234,0.15)" }
          : undefined
      }
    >
      {/* ── Top content ─────────────────────────────────────────────── */}
      <Box className="flex flex-col gap-3 px-4 pt-4 pb-3">
        {/* Plan name row + selection indicator */}
        <Box className="flex items-start justify-between gap-2">
          <Text
            as="span"
            className={cn(
              "font-outfit font-bold text-[13px] uppercase tracking-[0.5px] leading-tight",
              isSelected ? "text-white" : "text-white/80",
            )}
          >
            {t(plan.nameKey)}
          </Text>

          {/* Radio / check indicator */}
          <Box
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              isSelected
                ? "border-[#9234EA] bg-[#9234EA]"
                : "border-white/30 bg-transparent",
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </Box>
        </Box>

        {/* Price */}
        <PriceText className="text-[22px] leading-none">
          {formatCurrency(plan.price, locale)}
        </PriceText>

        {/* Benefit bullets */}
        <Box className="flex flex-col gap-2">
          {plan.benefitKeys.map((key) => (
            <Box key={key} className="flex items-start gap-2">
              {/* Green check circle */}
              <Box className="w-4 h-4 rounded-full bg-[#0EA42E]/20 flex items-center justify-center shrink-0 mt-[1px]">
                <Check className="w-2.5 h-2.5 text-[#0EA42E]" strokeWidth={3} />
              </Box>
              <Text
                as="span"
                className="font-inter text-[11px] text-white/75 leading-snug text-left"
              >
                {t(key)}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Bottom button band ──────────────────────────────────────── */}
      <Box className="mt-auto px-4 pb-4 pt-2">
        {isSelected ? (
          <Box className="w-full py-2 rounded-lg bg-linear-to-r from-[#3B82F6] to-[#9234EA] flex items-center justify-center">
            <Text as="span" className="font-outfit font-bold text-[12px] text-white leading-none">
              {t("upgradeMembership.selectedButton")}
            </Text>
          </Box>
        ) : (
          <Box className="w-full py-2 rounded-lg border border-white/20 flex items-center justify-center">
            <Text as="span" className="font-outfit font-medium text-[12px] text-white/70 leading-none">
              {t("upgradeMembership.selectButton")}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

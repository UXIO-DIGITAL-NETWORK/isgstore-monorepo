import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import SectionCard from "@/features/checkout/components/SectionCard";
import PaymentOptionRow from "./fragments/PaymentOptionRow";
import type { PaymentGroup } from "@/features/checkout/types/checkout.type";

interface Props {
  groups: PaymentGroup[];
  selectedPaymentId: string | null;
  onSelectPayment: (id: string) => void;
}

export default function PaymentMethods({
  groups,
  selectedPaymentId,
  onSelectPayment,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("ewallet");

  const toggleGroup = (type: string) => {
    setExpandedGroup((prev) => (prev === type ? null : type));
  };

  return (
    <SectionCard stepNumber={3} title={t("payment.title")}>
      <Box className="flex flex-col gap-2">
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.type;
          const hasSelected = group.options.some((o) => o.id === selectedPaymentId);

          return (
            <Box
              key={group.type}
              className="rounded-xl border border-white/8 overflow-hidden"
            >
              {/* Group header */}
              <Box
                as="button"
                type="button"
                onClick={() => toggleGroup(group.type)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 cursor-pointer outline-none transition-colors",
                  isExpanded ? "bg-[rgba(147,51,234,0.1)]" : "bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <Box className="flex items-center gap-2">
                  {hasSelected && (
                    <Box className="w-2 h-2 rounded-full bg-[#9234EA] shrink-0" />
                  )}
                  <Text
                    as="span"
                    className={cn(
                      "font-outfit font-medium text-[13px] leading-none",
                      hasSelected ? "text-[#C084FC]" : "text-white/80",
                    )}
                  >
                    {t(`payment.groups.${group.type}`)}
                  </Text>
                </Box>

                {/* Chevron */}
                <Box
                  className={cn(
                    "w-4 h-4 flex items-center justify-center transition-transform duration-200",
                    isExpanded ? "rotate-180" : "rotate-0",
                  )}
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
              </Box>

              {/* Options list */}
              {isExpanded && (
                <Box className="flex flex-col gap-1.5 p-2 border-t border-white/6 bg-[rgba(0,0,0,0.15)]">
                  {group.options.map((option) => (
                    <PaymentOptionRow
                      key={option.id}
                      option={option}
                      isSelected={selectedPaymentId === option.id}
                      onSelect={onSelectPayment}
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </SectionCard>
  );
}

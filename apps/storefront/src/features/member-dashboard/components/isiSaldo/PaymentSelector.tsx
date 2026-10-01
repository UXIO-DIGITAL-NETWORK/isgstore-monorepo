import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import type { PaymentGroup, PaymentGroupType } from "@/features/member-dashboard/types/isiSaldo.type";
import SectionCard from "./SectionCard";
import PaymentLogoChip from "./PaymentLogoChip";

interface Props {
  groups: PaymentGroup[];
  selectedPaymentId: string | null;
  onSelectPayment: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function PaymentSelector({
  groups,
  selectedPaymentId,
  onSelectPayment,
  isLoading = false,
  isError = false,
  onRetry,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const [expandedGroups, setExpandedGroups] = useState<Record<PaymentGroupType, boolean>>({
    ewallet: true,
    va: true,
    qris: true,
  });

  const toggleGroup = (type: PaymentGroupType) => {
    setExpandedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <SectionCard stepNumber={2} title={t("isiSaldo.payment.sectionTitle")}>
      <Box className="flex flex-col gap-2">
        {isError ? (
          <ErrorState variant="inline" onRetry={onRetry} />
        ) : isLoading ? (
          <Box aria-busy="true" className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))}
          </Box>
        ) : groups.length === 0 ? (
          <EmptyState compact title={t("isiSaldo.payment.empty")} />
        ) : (
          groups.map((group) => {
          const isExpanded = expandedGroups[group.type];
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
                  isExpanded
                    ? "bg-[rgba(208,201,129,0.1)]"
                    : "bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <Box className="flex items-center gap-2">
                  {hasSelected && (
                    <Box className="w-2 h-2 rounded-full bg-[rgb(208,201,129)] shrink-0" />
                  )}
                  <Text
                    as="span"
                    className={cn(
                      "font-outfit font-medium text-[13px] leading-none",
                      hasSelected ? "text-[rgb(208,201,129)]" : "text-white/80",
                    )}
                  >
                    {t(`isiSaldo.payment.groups.${group.type}`)}
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
                    <path
                      d="M1 1l4 4 4-4"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              </Box>

              {/* Logo chips */}
              {isExpanded && (
                <Box className="flex flex-wrap gap-2 p-3 border-t border-white/6 bg-[rgba(0,0,0,0.15)]">
                  {group.options.map((option) => (
                    <PaymentLogoChip
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
        })
        )}
      </Box>
    </SectionCard>
  );
}

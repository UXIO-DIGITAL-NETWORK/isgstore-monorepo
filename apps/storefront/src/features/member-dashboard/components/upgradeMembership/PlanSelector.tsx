import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import type { MembershipPlan } from "@/features/member-dashboard/types/upgradeMembership.type";
import SectionCard from "./SectionCard";
import PlanCard from "./PlanCard";

interface Props {
  plans: MembershipPlan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  isLoading = false,
  isError = false,
  onRetry,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <SectionCard stepNumber={1} title={t("upgradeMembership.planSectionTitle")}>
      {isError ? (
        <ErrorState variant="inline" onRetry={onRetry} />
      ) : isLoading ? (
        <Box aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </Box>
      ) : plans.length === 0 ? (
        <EmptyState compact title={t("upgradeMembership.plansEmpty")} />
      ) : (
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={onSelectPlan}
            />
          ))}
        </Box>
      )}
    </SectionCard>
  );
}

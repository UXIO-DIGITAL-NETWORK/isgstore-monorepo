import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import type { MembershipPlan } from "@/features/member-dashboard/types/upgradeMembership.type";
import SectionCard from "./SectionCard";
import PlanCard from "./PlanCard";

interface Props {
  plans: MembershipPlan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
}

export default function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <SectionCard stepNumber={1} title={t("upgradeMembership.planSectionTitle")}>
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
    </SectionCard>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useUpgradeMembership } from "@/features/member-dashboard/hooks/useUpgradeMembership";
import { MEMBERSHIP_PLANS, PAYMENT_GROUPS } from "@/features/member-dashboard/data/upgradeMembership.mock";
import PlanSelector from "@/features/member-dashboard/components/upgradeMembership/PlanSelector";
import PaymentSelector from "@/features/member-dashboard/components/upgradeMembership/PaymentSelector";
import SummaryCard from "@/features/member-dashboard/components/upgradeMembership/SummaryCard";

export default function UpgradeMembershipPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const {
    selectedPlanId,
    selectedPaymentId,
    selectedPlan,
    adminFee,
    total,
    selectedPaymentName,
    creditsBalance,
    handleSelectPlan,
    handleSelectPayment,
  } = useUpgradeMembership();

  const handleSubmit = () => {
    // TODO: wire to backend when Monetapay integration is ready
    window.alert(t("upgradeMembership.submitSuccess", { plan: selectedPlan ? t(selectedPlan.nameKey) : "" }));
  };

  return (
    <Box className="flex flex-col gap-6">
      {/* Page header */}
      <Box className="flex flex-col gap-1">
        <Box className="flex items-center gap-3">
          <Box className="w-1 h-5 rounded-full bg-[#3B82F6] shrink-0" />
          <Text
            as="span"
            className="font-outfit font-bold text-[22px] uppercase tracking-[-0.3px] text-white leading-none"
          >
            {t("upgradeMembership.title")}
          </Text>
        </Box>
        <Text as="span" className="text-[13px] font-inter text-white/50 leading-none pl-4">
          {t("upgradeMembership.subtitle")}
        </Text>
      </Box>

      {/* Single-column content */}
      <Box className="flex flex-col gap-5">
        <PlanSelector
          plans={MEMBERSHIP_PLANS}
          selectedPlanId={selectedPlanId}
          onSelectPlan={handleSelectPlan}
        />

        <PaymentSelector
          groups={PAYMENT_GROUPS}
          creditsBalance={creditsBalance}
          selectedPaymentId={selectedPaymentId}
          onSelectPayment={handleSelectPayment}
        />

        <SummaryCard
          planNameKey={selectedPlan?.nameKey}
          adminFee={adminFee}
          total={total}
          selectedPaymentName={selectedPaymentName}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  );
}

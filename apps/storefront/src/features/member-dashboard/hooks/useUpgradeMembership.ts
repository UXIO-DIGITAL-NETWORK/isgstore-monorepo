import { useState, useMemo } from "react";
import {
  MEMBERSHIP_PLANS,
  PAYMENT_GROUPS,
  CREDITS_BALANCE,
} from "@/features/member-dashboard/data/upgradeMembership.mock";
import type { MembershipPlan } from "@/features/member-dashboard/types/upgradeMembership.type";

export interface UseUpgradeMembershipReturn {
  selectedPlanId: string;
  selectedPaymentId: string | null;
  selectedPlan: MembershipPlan | undefined;
  planPrice: number;
  adminFee: number;
  total: number;
  selectedPaymentName: string | undefined;
  creditsBalance: number;
  handleSelectPlan: (id: string) => void;
  handleSelectPayment: (id: string) => void;
}

export function useUpgradeMembership(): UseUpgradeMembershipReturn {
  /** Default to "basic" — matches the pre-selected state in the design. */
  const [selectedPlanId, setSelectedPlanId] = useState<string>("basic");
  /** Default to "qris" — matches the design's shown total of Rp 50.080. */
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>("qris");

  const selectedPlan = useMemo<MembershipPlan | undefined>(
    () => MEMBERSHIP_PLANS.find((p) => p.id === selectedPlanId),
    [selectedPlanId],
  );

  const planPrice = useMemo<number>(() => selectedPlan?.price ?? 0, [selectedPlan]);

  /** Admin fee of the currently selected payment option. */
  const adminFee = useMemo<number>(() => {
    if (!selectedPaymentId) return 0;
    for (const group of PAYMENT_GROUPS) {
      const found = group.options.find((o) => o.id === selectedPaymentId);
      if (found) return found.fee ?? 0;
    }
    return 0;
  }, [selectedPaymentId]);

  const total = useMemo<number>(() => planPrice + adminFee, [planPrice, adminFee]);

  const selectedPaymentName = useMemo<string | undefined>(() => {
    if (!selectedPaymentId) return undefined;
    for (const group of PAYMENT_GROUPS) {
      const found = group.options.find((o) => o.id === selectedPaymentId);
      if (found) return found.name;
    }
    return undefined;
  }, [selectedPaymentId]);

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
  };

  /** Toggle-off on re-click (consistent with useIsiSaldo behaviour). */
  const handleSelectPayment = (id: string) => {
    setSelectedPaymentId((prev) => (prev === id ? null : id));
  };

  return {
    selectedPlanId,
    selectedPaymentId,
    selectedPlan,
    planPrice,
    adminFee,
    total,
    selectedPaymentName,
    creditsBalance: CREDITS_BALANCE,
    handleSelectPlan,
    handleSelectPayment,
  };
}

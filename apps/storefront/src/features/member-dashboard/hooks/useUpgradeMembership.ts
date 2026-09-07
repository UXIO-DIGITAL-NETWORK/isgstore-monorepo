import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/store/useAuthStore";
import { membershipService } from "@/features/member-dashboard/services/membership.service";
import { asArray } from "@/features/member-dashboard/lib/mappers";
import { usePaymentGroups } from "@/features/member-dashboard/hooks/usePaymentGroups";
import type { MembershipPlan, PaymentGroup } from "@/features/member-dashboard/types/upgradeMembership.type";

export interface UseUpgradeMembershipReturn {
  selectedPlanId: string;
  selectedPaymentId: string | null;
  selectedPlan: MembershipPlan | undefined;
  plans: MembershipPlan[];
  paymentGroups: PaymentGroup[];
  planPrice: number;
  adminFee: number;
  total: number;
  selectedPaymentName: string | undefined;
  creditsBalance: number;
  isSubmitting: boolean;
  submitError: string | null;
  handleSelectPlan: (id: string) => void;
  handleSelectPayment: (id: string) => void;
  handleSubmit: () => void;
}

export function useUpgradeMembership(): UseUpgradeMembershipReturn {
  const { i18n } = useTranslation("dashboard");
  const locale = i18n.language;
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: plansResponse } = useQuery({
    queryKey: ["membership-plans", locale],
    queryFn: () => membershipService.plans(locale),
  });

  const plans = useMemo<MembershipPlan[]>(
    () =>
      asArray(plansResponse?.data).map((plan) => ({
        id: String(plan.id),
        name: plan.name,
        price: plan.price,
        benefits: plan.benefits,
        durationDays: plan.duration_days,
        popular: plan.is_popular,
      })),
    [plansResponse],
  );

  // Falls back to the first plan once they arrive: the page used to default to
  // a hardcoded "basic" id, which no longer exists now that ids come from the
  // database.
  const effectivePlanId = selectedPlanId || plans[0]?.id || "";
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === effectivePlanId), [plans, effectivePlanId]);

  const { groups: paymentGroups } = usePaymentGroups();

  const planPrice = selectedPlan?.price ?? 0;

  const findOption = (id: string | null) => {
    if (!id) return undefined;
    for (const group of paymentGroups) {
      const found = group.options.find((option) => option.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const selectedOption = findOption(selectedPaymentId);

  const subscribe = useMutation({
    mutationFn: (planId: number) => membershipService.subscribe(planId),
    onSuccess: () => {
      setSubmitError(null);
      // The purchase changes both the wallet balance and the role, and the
      // role prices every subsequent order — so the cached profile has to be
      // refetched rather than left stale.
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      setSubmitError(error.response?.data?.message ?? null),
  });

  return {
    selectedPlanId: effectivePlanId,
    selectedPaymentId,
    selectedPlan,
    plans,
    paymentGroups,
    planPrice,
    adminFee: selectedOption?.fee ?? 0,
    total: planPrice + (selectedOption?.fee ?? 0),
    selectedPaymentName: selectedOption?.name,
    // A membership is bought with the wallet, so the credits card shows the
    // member's real balance rather than a hardcoded zero.
    creditsBalance: user?.balance ?? 0,
    isSubmitting: subscribe.isPending,
    submitError,
    handleSelectPlan: (id: string) => setSelectedPlanId(id),
    /** Toggle-off on re-click (consistent with useIsiSaldo). */
    handleSelectPayment: (id: string) => setSelectedPaymentId((prev) => (prev === id ? null : id)),
    handleSubmit: () => {
      if (!selectedPlan) return;
      subscribe.mutate(Number(selectedPlan.id));
    },
  };
}

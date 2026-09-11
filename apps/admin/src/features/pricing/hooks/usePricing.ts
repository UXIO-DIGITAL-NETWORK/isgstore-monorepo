import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { pricingService } from "../services/pricing.service";
import type { PricingRuleInput } from "../types/pricingRule.type";

const KEY = "pricing-rules";

export const usePricingRules = () => useQuery({ queryKey: [KEY, "list"], queryFn: pricingService.list });

export const useCategoryOptions = () =>
  useQuery({ queryKey: ["categories", "options"], queryFn: pricingService.categoryOptions });

export const usePlanOptions = () =>
  useQuery({ queryKey: ["membership-plans", "options"], queryFn: pricingService.planOptions });

export const useCreatePricingRule = () => {
  const { t } = useTranslation("pricing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PricingRuleInput) => pricingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("created"));
    },
    onError: () => toast.error(t("saveFailed")),
  });
};

export const useUpdatePricingRule = () => {
  const { t } = useTranslation("pricing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PricingRuleInput }) => pricingService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("updated"));
    },
    onError: () => toast.error(t("saveFailed")),
  });
};

export const useDeletePricingRule = () => {
  const { t } = useTranslation("pricing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("deleted"));
    },
    onError: () => toast.error(t("deleteFailed")),
  });
};

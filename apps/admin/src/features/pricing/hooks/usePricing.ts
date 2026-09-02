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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PricingRuleInput) => pricingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Pricing rule created");
    },
    onError: () => toast.error("Failed to save pricing rule"),
  });
};

export const useUpdatePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PricingRuleInput }) => pricingService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Pricing rule updated");
    },
    onError: () => toast.error("Failed to save pricing rule"),
  });
};

export const useDeletePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Pricing rule deleted");
    },
    onError: () => toast.error("Failed to delete pricing rule"),
  });
};

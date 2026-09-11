import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { membershipService } from "../services/membership.service";
import type { MembershipListParams, MembershipPlanInput } from "../types/membership.type";

const KEY = "membership-plans";

export const useMembershipPlanList = (params: MembershipListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => membershipService.list(params) });

export const useCreateMembershipPlan = () => {
  const { t } = useTranslation("membership");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MembershipPlanInput) => membershipService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("created"));
    },
    onError: () => toast.error(t("createFailed")),
  });
};

export const useUpdateMembershipPlan = () => {
  const { t } = useTranslation("membership");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MembershipPlanInput> }) =>
      membershipService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("updated"));
    },
    onError: () => toast.error(t("updateFailed")),
  });
};

export const useDeleteMembershipPlan = () => {
  const { t } = useTranslation("membership");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("deleted"));
    },
    onError: () => toast.error(t("deleteFailed")),
  });
};

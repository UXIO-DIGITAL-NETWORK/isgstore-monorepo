import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { membershipService } from "../services/membership.service";
import type { MembershipListParams, MembershipPlanInput } from "../types/membership.type";

const KEY = "membership-plans";

export const useMembershipPlanList = (params: MembershipListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => membershipService.list(params) });

export const useCreateMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MembershipPlanInput) => membershipService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Plan created");
    },
    onError: () => toast.error("Failed to create plan"),
  });
};

export const useUpdateMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MembershipPlanInput> }) =>
      membershipService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Plan updated");
    },
    onError: () => toast.error("Failed to update plan"),
  });
};

export const useDeleteMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Plan deleted");
    },
    onError: () => toast.error("Failed to delete plan"),
  });
};

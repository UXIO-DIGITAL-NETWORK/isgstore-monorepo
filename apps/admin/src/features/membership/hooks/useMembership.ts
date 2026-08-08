import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { membershipService } from "../services/membership.service";
import type { MembershipListParams } from "../types/membership.type";

export const useMembershipTierList = (params: MembershipListParams) =>
  useQuery({ queryKey: ["membership-tiers", "list", params], queryFn: () => membershipService.list(params) });

export const useDeleteMembershipTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers"] });
      toast.success("Tier deleted");
    },
    onError: () => toast.error("Failed to delete tier"),
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { promosService, type PromoInput } from "../services/promos.service";
import type { MarketingListParams } from "../types/marketing.type";

const KEY = "promos";

export const usePromoList = (params: MarketingListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => promosService.list(params) });

export const usePromo = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => promosService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromoInput) => promosService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Promo created");
    },
    onError: () => toast.error("Failed to create promo"),
  });
};

export const useUpdatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PromoInput> }) => promosService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Promo updated");
    },
    onError: () => toast.error("Failed to update promo"),
  });
};

export const useDeletePromos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => promosService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Promo deleted" : `${ids.length} promos deleted`);
    },
    onError: () => toast.error("Failed to delete promos"),
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { flashSalesService, type FlashSaleInput } from "../services/flashSales.service";
import type { MarketingListParams } from "../types/marketing.type";

const KEY = "flash-sales";

export const useFlashSaleList = (params: MarketingListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => flashSalesService.list(params) });

export const useFlashSale = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => flashSalesService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FlashSaleInput) => flashSalesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Flash sale created");
    },
    onError: () => toast.error("Failed to create flash sale"),
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FlashSaleInput> }) => flashSalesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Flash sale updated");
    },
    onError: () => toast.error("Failed to update flash sale"),
  });
};

export const useDeleteFlashSales = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => flashSalesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Flash sale deleted" : `${ids.length} flash sales deleted`);
    },
    onError: () => toast.error("Failed to delete flash sales"),
  });
};

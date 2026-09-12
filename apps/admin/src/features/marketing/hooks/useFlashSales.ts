import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("marketing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FlashSaleInput) => flashSalesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("flashSaleCreated"));
    },
    onError: () => toast.error(t("flashSaleCreateFailed")),
  });
};

export const useUpdateFlashSale = () => {
  const { t } = useTranslation("marketing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FlashSaleInput> }) => flashSalesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("flashSaleUpdated"));
    },
    onError: () => toast.error(t("flashSaleUpdateFailed")),
  });
};

export const useDeleteFlashSales = () => {
  const { t } = useTranslation("marketing");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => flashSalesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Flash sale deleted" : `${ids.length} flash sales deleted`);
    },
    onError: () => toast.error(t("flashSaleDeleteFailed")),
  });
};

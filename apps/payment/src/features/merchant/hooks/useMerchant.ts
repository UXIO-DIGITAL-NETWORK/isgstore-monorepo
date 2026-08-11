import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { merchantService } from "../services/merchant.service";
import type { CreateWithdrawalPayload } from "../types/merchant.type";

export const useMerchantDashboard = () =>
  useQuery({ queryKey: ["merchant", "dashboard"], queryFn: merchantService.dashboard });

export const useMerchantTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "transactions", params], queryFn: () => merchantService.transactions(params) });

export const useMerchantMutations = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "mutations", params], queryFn: () => merchantService.mutations(params) });

export const useMerchantWithdrawals = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "withdrawals", params], queryFn: () => merchantService.withdrawals(params) });

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWithdrawalPayload) => merchantService.createWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success("Permintaan penarikan berhasil dibuat");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat penarikan");
    },
  });
};

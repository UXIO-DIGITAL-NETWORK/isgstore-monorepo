import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { financeService } from "../services/finance.service";

export const useFinanceDashboard = () =>
  useQuery({ queryKey: ["finance", "dashboard"], queryFn: financeService.dashboard });

export const useFinanceMerchants = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "merchants", params], queryFn: () => financeService.merchants(params) });

export const useFinanceTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "transactions", params], queryFn: () => financeService.transactions(params) });

export const useFinanceWithdrawals = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "withdrawals", params], queryFn: () => financeService.withdrawals(params) });

export const useApproveWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method }: { id: number; method?: "manual" | "monetapay" }) =>
      financeService.approve(id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Penarikan disetujui");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menyetujui penarikan");
    },
  });
};

export const useRejectWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => financeService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Penarikan ditolak, dana dikembalikan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menolak penarikan");
    },
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { financeService } from "../services/finance.service";
import type { AdminFeeSetting } from "../types/finance.type";

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
    mutationFn: ({ id, method, proof }: { id: number; method?: "manual" | "monetapay"; proof?: File }) =>
      financeService.approve(id, { method, proof }),
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

// ── Settings ──────────────────────────────────────────────────────────────────

export const useChannelFees = () =>
  useQuery({ queryKey: ["finance", "channels"], queryFn: financeService.channels });

export const useUpdateChannelFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { fee_flat?: number; fee_percent?: number; is_active?: boolean };
    }) => financeService.updateChannel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "channels"] });
      toast.success("Biaya channel berhasil disimpan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menyimpan biaya channel");
    },
  });
};

export const useAdminFee = () =>
  useQuery({ queryKey: ["finance", "admin-fee"], queryFn: financeService.adminFee });

export const useUpdateAdminFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminFeeSetting) => financeService.updateAdminFee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "admin-fee"] });
      toast.success("Biaya admin berhasil disimpan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menyimpan biaya admin");
    },
  });
};

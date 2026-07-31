import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  paymentChannelsService,
  settingsService,
  usersService,
  type PaymentChannelInput,
} from "../services/administration.service";
import type { AdministrationListParams } from "../types/administration.type";

export const usePaymentChannelList = (params: AdministrationListParams) =>
  useQuery({ queryKey: ["payment-channels", "list", params], queryFn: () => paymentChannelsService.list(params) });

export const usePaymentChannel = (id?: string) =>
  useQuery({
    queryKey: ["payment-channels", "detail", id],
    queryFn: () => paymentChannelsService.getById(id as string),
    enabled: Boolean(id),
  });

export const useUpdatePaymentChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PaymentChannelInput> }) =>
      paymentChannelsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-channels"] });
      toast.success("Payment channel updated");
    },
    onError: () => toast.error("Failed to update payment channel"),
  });
};

export const useDeletePaymentChannels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => paymentChannelsService.remove(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-channels"] });
      toast.success("Payment channel deleted");
    },
    // The API refuses to delete a channel that has transactions, since that
    // would orphan historical orders — say so rather than a generic failure.
    onError: () => toast.error("Channels with transactions cannot be deleted. Deactivate instead."),
  });
};

export const useUserList = (params: AdministrationListParams) =>
  useQuery({ queryKey: ["users", "list", params], queryFn: () => usersService.list(params) });

export const useDeleteUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => usersService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(ids.length === 1 ? "User deleted" : `${ids.length} users deleted`);
    },
    onError: () => toast.error("Failed to delete users"),
  });
};

export const useSettings = (group?: string) =>
  useQuery({ queryKey: ["settings", group], queryFn: () => settingsService.list(group) });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Record<string, string | number | boolean>) => settingsService.update(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });
};

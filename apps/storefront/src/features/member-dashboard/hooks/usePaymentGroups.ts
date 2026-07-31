import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import { resolvePaymentLogo } from "@/constants/paymentLogos";
import type { ApiResponse } from "@/types/api.type";
import type { PaymentChannelModel } from "@/types/models/product.model";
import type { PaymentGroup, PaymentGroupType } from "@/features/member-dashboard/types/upgradeMembership.type";

/** API `payment_type` → the three groups these pages render. */
const GROUP_OF: Record<string, PaymentGroupType> = {
  ewallet: "ewallet",
  virtual_account: "va",
  qris: "qris",
};

const GROUP_ORDER: PaymentGroupType[] = ["ewallet", "va", "qris"];

const GROUP_LABELS: Record<PaymentGroupType, string> = {
  ewallet: "E-Wallet",
  va: "Virtual Account",
  qris: "QRIS",
};

/**
 * Real payment channels, grouped the way the wallet and membership pages
 * render them.
 *
 * The `balance` channel is excluded: it is the wallet itself, so it can pay
 * for neither a top-up of that same wallet nor a membership bought from it.
 * Logos stay bundled and keyed on `channel_code` — the API stores no artwork
 * for these, and a missing remote image would render as a broken chip.
 */
export const usePaymentGroups = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-channels", "wallet"],
    queryFn: async (): Promise<ApiResponse<PaymentChannelModel[]>> =>
      await api.get(`${API_VERSION}/storefront/payment-channels`),
  });

  const groups = useMemo<PaymentGroup[]>(() => {
    const channels = (data?.data ?? []).filter((channel) => channel.channel_code !== "balance");

    return GROUP_ORDER.map((type) => ({
      type,
      label: GROUP_LABELS[type],
      options: channels
        .filter((channel) => GROUP_OF[channel.payment_type] === type)
        .map((channel) => ({
          // The channel id, because that is what the top-up endpoint expects.
          id: String(channel.id),
          name: channel.name,
          logo: resolvePaymentLogo(channel.channel_code),
          // Flat fee only: every seeded channel has fee_percent 0, and a
          // percentage fee cannot be shown as one number before an amount is
          // chosen anyway.
          fee: channel.fee_flat,
        })),
    })).filter((group) => group.options.length > 0);
  }, [data]);

  return { groups, isLoading };
};

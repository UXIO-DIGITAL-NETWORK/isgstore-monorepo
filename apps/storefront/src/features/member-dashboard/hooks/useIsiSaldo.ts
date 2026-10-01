import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { useSettingsQuery } from "@/hooks/useSettingsQuery";
import { walletService } from "@/features/member-dashboard/services/wallet.service";
import { usePaymentGroups } from "@/features/member-dashboard/hooks/usePaymentGroups";
import type { PaymentGroup } from "@/features/member-dashboard/types/upgradeMembership.type";

export interface UseIsiSaldoReturn {
  presets: number[];
  paymentGroups: PaymentGroup[];
  isSubmitting: boolean;
  submitError: string | null;
  /** Gateway instructions returned once a top-up is opened. */
  instructions: Record<string, string> | null;
  handleSubmit: () => void;
  selectedNominal: number;
  customAmount: string;
  selectedPaymentId: string | null;
  /** The effective top-up amount: custom input overrides preset. */
  nominal: number;
  selectedPaymentName: string | undefined;
  handleSelectPreset: (value: number) => void;
  handleCustomChange: (raw: string) => void;
  handleSelectPayment: (id: string) => void;
  /** The payment-channels query, for the selector's loading / error / empty states. */
  paymentQuery: ReturnType<typeof usePaymentGroups>["query"];
}

/**
 * Placing a balance top-up: how much, and by which channel.
 *
 * There is deliberately no voucher field. Promo codes resolve through
 * `PromoResolver` against a *product* (its scope is global/product/category),
 * and the top-up endpoint takes only an amount and a channel — so the code
 * this screen used to accept was validated for display and then never sent,
 * promising a discount that could not be applied. See
 * `CreateBalanceTopupAction`.
 */
export function useIsiSaldo(): UseIsiSaldoReturn {
  const { data: settings } = useSettingsQuery();
  const payments = usePaymentGroups();
  const paymentGroups = payments.groups;

  // Nominal presets are operations-configurable rather than a bundled
  // constant, so changing them does not need a front-end deploy.
  const presets = useMemo<number[]>(() => {
    const raw = settings?.data?.balance_topup_presets;
    return Array.isArray(raw) && raw.length ? (raw as number[]) : [10000, 25000, 50000, 100000, 500000];
  }, [settings]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string> | null>(null);
  const [selectedNominal, setSelectedNominal] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const nominal = useMemo<number>(() => {
    if (customAmount.trim() !== "") {
      const digits = customAmount.replace(/\D/g, "");
      const parsed = parseInt(digits, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedNominal;
  }, [customAmount, selectedNominal]);

  const selectedPaymentName = useMemo<string | undefined>(() => {
    if (!selectedPaymentId) return undefined;
    for (const group of paymentGroups) {
      const found = group.options.find((o) => o.id === selectedPaymentId);
      if (found) return found.name;
    }
    return undefined;
  }, [selectedPaymentId, paymentGroups]);

  const handleSelectPreset = (value: number) => {
    setSelectedNominal(value);
    setCustomAmount(""); // preset overrides custom input
  };

  const handleCustomChange = (raw: string) => {
    setCustomAmount(raw);
  };

  const handleSelectPayment = (id: string) => {
    setSelectedPaymentId((prev) => (prev === id ? null : id));
  };

  const createTopup = useMutation({
    mutationFn: walletService.createTopup,
    onSuccess: (response) => {
      setSubmitError(null);
      setInstructions(response.data.payment.instructions);
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      setSubmitError(error.response?.data?.message ?? null),
  });

  return {
    presets,
    paymentGroups,
    isSubmitting: createTopup.isPending,
    submitError,
    instructions,
    handleSubmit: () => {
      if (!selectedPaymentId || nominal <= 0) return;
      createTopup.mutate({ amount: nominal, payment_channel_id: Number(selectedPaymentId) });
    },
    selectedNominal,
    customAmount,
    selectedPaymentId,
    nominal,
    selectedPaymentName,
    handleSelectPreset,
    handleCustomChange,
    handleSelectPayment,
    paymentQuery: payments.query,
  };
}

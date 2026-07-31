import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { useSettingsQuery } from "@/hooks/useSettingsQuery";
import { useValidatePromoMutation } from "@/hooks/usePromoQuery";
import { walletService } from "@/features/member-dashboard/services/wallet.service";
import { usePaymentGroups } from "@/features/member-dashboard/hooks/usePaymentGroups";
import type { VoucherInfo } from "@/features/member-dashboard/types/isiSaldo.type";
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
  appliedVoucher: VoucherInfo | null;
  nominal: number;
  discount: number;
  total: number;
  selectedPaymentName: string | undefined;
  handleSelectPreset: (value: number) => void;
  handleCustomChange: (raw: string) => void;
  handleSelectPayment: (id: string) => void;
  applyVoucher: (code: string) => void;
  clearVoucher: () => void;
}

export function useIsiSaldo(): UseIsiSaldoReturn {
  const { data: settings } = useSettingsQuery();
  const { groups: paymentGroups } = usePaymentGroups();
  const validatePromo = useValidatePromoMutation();

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
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherInfo | null>(null);

  /** The effective top-up amount: custom input overrides preset. */
  const nominal = useMemo<number>(() => {
    if (customAmount.trim() !== "") {
      const digits = customAmount.replace(/\D/g, "");
      const parsed = parseInt(digits, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedNominal;
  }, [customAmount, selectedNominal]);

  const discount = useMemo<number>(
    () =>
      appliedVoucher && nominal > 0
        ? Math.round((nominal * appliedVoucher.discountPercent) / 100)
        : 0,
    [appliedVoucher, nominal],
  );

  const total = useMemo<number>(() => Math.max(0, nominal - discount), [nominal, discount]);

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

  /**
   * Validated server-side. The API returns the resolved rupiah discount, so
   * the percentage stored here is derived purely for display — the amount the
   * customer is actually charged is never computed on the client.
   */
  const applyVoucher = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || nominal <= 0) return;

    validatePromo.mutate(
      { code: trimmed, amount: nominal },
      {
        onSuccess: (response) => {
          if (!response.data.valid) {
            setAppliedVoucher(null);
            setSubmitError(response.message);
            return;
          }
          setSubmitError(null);
          setAppliedVoucher({
            code: trimmed,
            discountPercent: Math.round((response.data.discount_amount / nominal) * 100),
          });
        },
      },
    );
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

  const clearVoucher = () => setAppliedVoucher(null);

  return {
    presets,
    paymentGroups,
    isSubmitting: createTopup.isPending,
    submitError,
    instructions,
    handleSubmit: () => {
      if (!selectedPaymentId || nominal <= 0) return;
      // The gateway is charged the nominal amount; any promo discount is
      // settled server-side, so the client never sends a computed total.
      createTopup.mutate({ amount: nominal, payment_channel_id: Number(selectedPaymentId) });
    },
    selectedNominal,
    customAmount,
    selectedPaymentId,
    appliedVoucher,
    nominal,
    discount,
    total,
    selectedPaymentName,
    handleSelectPreset,
    handleCustomChange,
    handleSelectPayment,
    applyVoucher,
    clearVoucher,
  };
}

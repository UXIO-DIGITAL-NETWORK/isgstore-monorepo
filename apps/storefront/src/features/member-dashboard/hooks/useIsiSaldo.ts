import { useState, useMemo } from "react";
import { PAYMENT_GROUPS, MOCK_VOUCHER } from "@/features/member-dashboard/data/isiSaldo.mock";
import type { VoucherInfo } from "@/features/member-dashboard/types/isiSaldo.type";

export interface UseIsiSaldoReturn {
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
  const [selectedNominal, setSelectedNominal] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>("qris");
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
    for (const group of PAYMENT_GROUPS) {
      const found = group.options.find((o) => o.id === selectedPaymentId);
      if (found) return found.name;
    }
    return undefined;
  }, [selectedPaymentId]);

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

  const applyVoucher = (code: string) => {
    if (code.trim()) {
      // In this mock any non-empty code applies the 10% discount
      setAppliedVoucher({ ...MOCK_VOUCHER, code });
    }
  };

  const clearVoucher = () => setAppliedVoucher(null);

  return {
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

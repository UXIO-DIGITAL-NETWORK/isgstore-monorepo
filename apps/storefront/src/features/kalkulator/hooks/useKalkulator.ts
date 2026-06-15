import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { winRateSchema, type WinRateFormData } from "@/features/kalkulator/schemas/kalkulator.schema";
import type { WinRateResult } from "@/features/kalkulator/types/kalkulator.type";

export function useKalkulator() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WinRateFormData>({
    resolver: zodResolver(winRateSchema),
    mode: "onSubmit",
  });

  const [result, setResult] = useState<WinRateResult | null>(null);

  const onSubmit = (data: WinRateFormData) => {
    const { totalMatch, currentWR, targetWR } = data;
    const c = currentWR / 100;
    const r = targetWR / 100;

    if (targetWR <= currentWR) {
      setResult({ status: "reached", winsNeeded: 0, targetWR });
    } else if (targetWR >= 100) {
      setResult({ status: "impossible", winsNeeded: 0, targetWR });
    } else {
      const winsNeeded = Math.ceil((totalMatch * (r - c)) / (1 - r));
      setResult({ status: "normal", winsNeeded, targetWR });
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    result,
  };
}

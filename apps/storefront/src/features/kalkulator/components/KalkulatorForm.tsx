import React from "react";
import { useTranslation } from "react-i18next";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Gamepad2, TrendingUp, Target, Calculator } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { WinRateFormData } from "@/features/kalkulator/schemas/kalkulator.schema";

interface KalkulatorFormProps {
  register: UseFormRegister<WinRateFormData>;
  errors: FieldErrors<WinRateFormData>;
}

function FieldLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box className="flex items-center gap-1.5 mb-1.5">
      <Box as="span" className="text-[rgb(208,201,129)]">
        {icon}
      </Box>
      <Text as="span" className="font-inter text-[13px] text-white/70 font-medium">
        {label}
      </Text>
    </Box>
  );
}

export default function KalkulatorForm({
  register,
  errors,
}: KalkulatorFormProps): React.JSX.Element {
  const { t } = useTranslation("kalkulator");

  return (
    <Box className="rounded-2xl border border-white/10 bg-[rgba(67,86,32,0.05)] backdrop-blur-[6px] p-6 md:p-8 flex flex-col gap-5">
      {/* ── Total Match ── */}
      <Box>
        <FieldLabel icon={<Gamepad2 size={15} />} label={t("form.totalMatch.label")} />
        <Input
          type="number"
          inputMode="numeric"
          placeholder={t("form.totalMatch.placeholder")}
          {...register("totalMatch", { valueAsNumber: true })}
        />
        {errors.totalMatch && (
          <Text as="p" className="font-inter text-[12px] text-red-400 mt-1">
            {t(errors.totalMatch.message ?? "")}
          </Text>
        )}
      </Box>

      {/* ── WR Saat Ini + Target WR (2-col) ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WR Saat Ini */}
        <Box>
          <FieldLabel icon={<TrendingUp size={15} />} label={t("form.currentWR.label")} />
          <Input
            type="number"
            inputMode="decimal"
            placeholder={t("form.currentWR.placeholder")}
            {...register("currentWR", { valueAsNumber: true })}
          />
          {errors.currentWR && (
            <Text as="p" className="font-inter text-[12px] text-red-400 mt-1">
              {t(errors.currentWR.message ?? "")}
            </Text>
          )}
        </Box>

        {/* Target WR */}
        <Box>
          <FieldLabel icon={<Target size={15} />} label={t("form.targetWR.label")} />
          <Input
            type="number"
            inputMode="decimal"
            placeholder={t("form.targetWR.placeholder")}
            {...register("targetWR", { valueAsNumber: true })}
          />
          {errors.targetWR && (
            <Text as="p" className="font-inter text-[12px] text-red-400 mt-1">
              {t(errors.targetWR.message ?? "")}
            </Text>
          )}
        </Box>
      </Box>

      {/* ── Submit Button ── */}
      <Button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 text-[15px] rounded-full"
      >
        <Calculator size={16} />
        {t("form.submit")}
      </Button>
    </Box>
  );
}

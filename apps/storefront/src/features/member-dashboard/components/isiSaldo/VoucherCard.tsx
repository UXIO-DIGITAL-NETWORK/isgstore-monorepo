import React, { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, CheckCircle } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  voucherSchema,
  type VoucherFormValues,
} from "@/features/member-dashboard/schemas/voucher.schema";
import type { VoucherInfo } from "@/features/member-dashboard/types/isiSaldo.type";

interface Props {
  appliedVoucher: VoucherInfo | null;
  onApplyVoucher: (code: string) => void;
  onClearVoucher: () => void;
}

export default function VoucherCard({
  appliedVoucher,
  onApplyVoucher,
  onClearVoucher,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const { register, handleSubmit, reset } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (data: VoucherFormValues) => {
    onApplyVoucher(data.code.trim());
    reset();
  };

  return (
    <Box className="p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA]">
      <Box className="rounded-[15px] bg-[#0D1117] p-4 flex flex-col gap-3">
        {/* Title */}
        <Box className="flex flex-col gap-0.5">
          <Text as="span" className="text-[13px] font-outfit font-semibold text-white leading-none">
            {t("isiSaldo.voucher.title")}
          </Text>
          <Text as="span" className="text-[11px] font-inter text-white/45 leading-none">
            {t("isiSaldo.voucher.subtitle")}
          </Text>
        </Box>

        {/* Applied badge */}
        {appliedVoucher && (
          <Box className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0EA42E]/10 border border-[#0EA42E]/30">
            <CheckCircle className="w-4 h-4 text-[#0EA42E] shrink-0" />
            <Text as="span" className="text-[12px] font-inter text-[#0EA42E] leading-none">
              {t("isiSaldo.voucher.applied")} — <strong>{appliedVoucher.code}</strong>
            </Text>
            <Box
              as="button"
              type="button"
              onClick={onClearVoucher}
              className="ml-auto text-[11px] font-inter text-white/40 hover:text-white/70 cursor-pointer transition-colors"
            >
              ✕
            </Box>
          </Box>
        )}

        {/* Input + button */}
        {!appliedVoucher && (
          <Box
            as="form"
            onSubmit={(e: FormEvent) => {
              void handleSubmit(onSubmit)(e);
            }}
            className="flex items-center gap-2"
          >
            <Input
              {...register("code")}
              type="text"
              placeholder={t("isiSaldo.voucher.placeholder")}
              className="flex-1 rounded-xl text-[13px]"
            />
            <Button type="submit" className="shrink-0 text-[13px] py-2.5 px-4">
              {t("isiSaldo.voucher.button")}
            </Button>
          </Box>
        )}

        {/* Info note */}
        <Box className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-[1px]" />
          <Text as="span" className="text-[11px] font-inter text-white/45 leading-snug">
            {t("isiSaldo.voucher.note")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

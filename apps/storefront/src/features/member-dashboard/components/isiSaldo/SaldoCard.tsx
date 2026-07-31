import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Wallet, ShieldCheck } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";

export default function SaldoCard(): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const balance = useAuthStore((state) => state.user?.balance ?? 0);

  return (
    <Box className="p-[1px] rounded-2xl bg-linear-to-br from-[#3B82F6] to-[#9234EA]">
      <Box className="bg-[#0C0E1A] rounded-[15px] p-5 flex flex-col gap-4">
        {/* Header */}
        <Box className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#9234EA]" />
          <Text
            as="span"
            className="text-[11px] font-outfit font-semibold text-white/50 uppercase tracking-widest leading-none"
          >
            {t("isiSaldo.saldo.title")}
          </Text>
        </Box>

        {/* Balance */}
        <Box
          className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[32px] leading-none"
        >
          {formatCurrency(balance, locale)}
        </Box>

        {/* Secure note */}
        <Box className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(59,130,246,0.06)] border border-white/8">
          <Box className="p-1.5 rounded-full bg-[#0EA42E]/10 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#0EA42E]" />
          </Box>
          <Box className="flex flex-col gap-0.5">
            <Text as="span" className="text-[12px] font-outfit font-semibold text-white leading-none">
              {t("isiSaldo.saldo.secureNote")}
            </Text>
            <Text as="span" className="text-[11px] font-inter text-white/45 leading-snug">
              {t("isiSaldo.saldo.secureSubtitle")}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

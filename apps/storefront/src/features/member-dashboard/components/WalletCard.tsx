import React from "react";
import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { WalletInfo } from "@/features/member-dashboard/types/dashboard.type";
import iconCredit from "@/assets/images/checkout/icon_credit.png";

interface Props {
  wallet: WalletInfo;
}

export default function WalletCard({ wallet }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  return (
    <Box className="flex-1 min-w-0 p-[1px] rounded-2xl bg-linear-to-br from-[#3B82F6] to-[#9234EA]">
    <Box className="bg-[#0C0E1A] rounded-[15px] p-5 h-full flex flex-col gap-4">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[#9234EA]" />
        <Text
          as="span"
          className="text-[11px] font-outfit font-semibold text-white/50 uppercase tracking-widest leading-none"
        >
          {t("wallet.title")}
        </Text>
      </Box>

      {/* Balance — vertically centered row */}
      <Box className="flex items-center gap-4 flex-1">
        {/* icon_credit coin */}
        <Box
          as="img"
          src={iconCredit}
          alt="credit coin"
          className="w-14 h-14 shrink-0 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]"
        />

        <Box className="flex flex-col gap-1.5">
          <Box className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[32px] md:text-[36px] leading-none">
            {formatCurrency(wallet.balance, locale)}
          </Box>
          <Text as="span" className="text-[13px] font-inter text-white/40 leading-none">
            {formatNumber(wallet.points, locale)} {t("wallet.points")}
          </Text>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box className="flex items-center gap-2 mt-auto">
        <Box
          as="button"
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Text as="span" className="text-[12px] font-outfit font-bold text-white leading-none">
            {t("wallet.topUpBalance")}
          </Text>
        </Box>

        <Box
          as="button"
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Text as="span" className="text-[12px] font-outfit font-semibold text-white/80 leading-none">
            {t("wallet.transactionHistory")}
          </Text>
        </Box>
      </Box>
    </Box>
    </Box>
  );
}

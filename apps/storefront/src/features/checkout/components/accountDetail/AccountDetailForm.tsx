import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";

interface Props {
  userId: string;
  serverId: string;
  onUserIdChange: (val: string) => void;
  onServerIdChange: (val: string) => void;
}

export default function AccountDetailForm({
  userId,
  serverId,
  onUserIdChange,
  onServerIdChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <SectionCard stepNumber={1} title={t("accountDetail.title")} gradientBorder>
      <Box className="flex flex-col gap-4">
        {/* User ID */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
            {t("accountDetail.userId")}
            <Text as="span" className="text-red-400 ml-0.5">*</Text>
          </Text>
          <Input
            type="text"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            placeholder={t("accountDetail.userIdPlaceholder")}
          />
        </Box>

        {/* Server ID */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
            {t("accountDetail.serverId")}
            <Text as="span" className="text-red-400 ml-0.5">*</Text>
          </Text>
          <Input
            type="text"
            value={serverId}
            onChange={(e) => onServerIdChange(e.target.value)}
            placeholder={t("accountDetail.serverIdPlaceholder")}
          />
        </Box>

        {/* Guide link */}
        <Box className="flex items-center gap-2 cursor-pointer group">
          <Box className="w-5 h-5 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0">
            <Text as="span" className="font-outfit font-bold text-[10px] text-white leading-none">?</Text>
          </Box>
          <Text
            as="span"
            className="font-inter text-[12px] text-white/60 leading-none group-hover:text-white/90 transition-colors"
          >
            {t("accountDetail.viewGuide")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}

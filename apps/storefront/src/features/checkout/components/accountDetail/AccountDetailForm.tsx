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
    <SectionCard stepNumber={1} title={t("accountDetail.title")}>
      <Box className="flex flex-col gap-4">
        {/* User ID */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
            {t("accountDetail.userId")}
            <Text as="span" className="text-[#C084FC] ml-0.5">*</Text>
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
            <Text as="span" className="text-[#C084FC] ml-0.5">*</Text>
          </Text>
          <Input
            type="text"
            value={serverId}
            onChange={(e) => onServerIdChange(e.target.value)}
            placeholder={t("accountDetail.serverIdPlaceholder")}
          />
        </Box>

        {/* Nickname preview row */}
        <Box className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(147,51,234,0.07)] border border-[rgba(147,51,234,0.2)]">
          <Text as="span" className="font-inter text-[12px] text-white/40 leading-none">
            {t("accountDetail.nickname")}:
          </Text>
          <Text as="span" className="font-inter font-medium text-[12px] text-white/50 italic leading-none">
            {userId.trim()
              ? t("accountDetail.nicknameLoading")
              : t("accountDetail.nicknamePending")}
          </Text>
        </Box>

        {/* Helper note */}
        <Box className="flex items-start gap-2">
          <Text as="span" className="text-[#C084FC] text-[12px] leading-none shrink-0 mt-0.5">ℹ</Text>
          <Text as="span" className="font-inter text-[11px] text-white/40 leading-relaxed">
            {t("accountDetail.helper")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}

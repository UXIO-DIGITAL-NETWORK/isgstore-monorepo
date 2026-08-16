import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useIntegrasi } from "@/features/member-dashboard/hooks/useIntegrasi";
import ApiKeyCard from "@/features/member-dashboard/components/integrasi/ApiKeyCard";
import CallbackUrlCard from "@/features/member-dashboard/components/integrasi/CallbackUrlCard";
import WhitelistIpCard from "@/features/member-dashboard/components/integrasi/WhitelistIpCard";

export default function IntegrasiPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const {
    apiKey,
    isKeyVisible,
    toggleKeyVisibility,
    regenerateKey,
    isRegenerating,
    callbackUrl,
    setCallbackUrl,
    submitCallback,
    isSavingCallback,
    whitelistIps,
    ipDraft,
    setIpDraft,
    addIp,
    removeIp,
    isMutatingWhitelist,
  } = useIntegrasi();

  return (
    <Box className="flex flex-col gap-6">
      {/* Page header */}
      <Box className="flex flex-col gap-1">
        <Box className="flex items-center gap-3">
          <Box className="w-1 h-5 rounded-full bg-[#3B82F6] shrink-0" />
          <Text
            as="span"
            className="font-outfit font-bold text-[22px] uppercase tracking-[-0.3px] text-white leading-none"
          >
            {t("integrasi.title")}
          </Text>
        </Box>
        <Text as="span" className="text-[13px] font-inter text-white/50 leading-none pl-4">
          {t("integrasi.subtitle")}
        </Text>
      </Box>

      {/* Section cards — single column */}
      <Box className="flex flex-col gap-5">
        <ApiKeyCard
          apiKey={apiKey}
          isKeyVisible={isKeyVisible}
          onToggleVisibility={toggleKeyVisibility}
          onRegenerate={regenerateKey}
          loading={isRegenerating}
        />

        <CallbackUrlCard
          callbackUrl={callbackUrl}
          onChangeUrl={setCallbackUrl}
          onSubmit={submitCallback}
          loading={isSavingCallback}
        />

        <WhitelistIpCard
          whitelistIps={whitelistIps}
          ipDraft={ipDraft}
          onChangeDraft={setIpDraft}
          onAddIp={addIp}
          onRemoveIp={removeIp}
          loading={isMutatingWhitelist}
        />
      </Box>
    </Box>
  );
}

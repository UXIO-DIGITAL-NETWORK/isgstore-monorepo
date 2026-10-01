import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
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
    query,
  } = useIntegrasi();

  const hasCredential = (query.data?.data.credentials.length ?? 0) > 0;

  return (
    <Box className="flex flex-col gap-6">
      {/* Page header */}
      <Box className="flex flex-col gap-1">
        <Box className="flex items-center gap-3">
          <Box className="w-1 h-5 rounded-full bg-[rgb(67,86,32)] shrink-0" />
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
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Box aria-busy="true" className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </Box>
      ) : !hasCredential ? (
        <EmptyState title={t("integrasi.empty")} />
      ) : (
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
      )}
    </Box>
  );
}

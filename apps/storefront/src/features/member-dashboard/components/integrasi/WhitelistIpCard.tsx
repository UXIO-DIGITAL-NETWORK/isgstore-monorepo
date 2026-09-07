import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import SectionCard from "@/features/member-dashboard/components/integrasi/SectionCard";
import IpChip from "@/features/member-dashboard/components/integrasi/IpChip";
import { Spinner } from "@/components/common/Spinner";

interface WhitelistIpCardProps {
  whitelistIps: string[];
  ipDraft: string;
  onChangeDraft: (value: string) => void;
  onAddIp: () => void;
  onRemoveIp: (ip: string) => void;
  loading: boolean;
}

export default function WhitelistIpCard({
  whitelistIps,
  ipDraft,
  onChangeDraft,
  onAddIp,
  onRemoveIp,
  loading,
}: WhitelistIpCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onAddIp();
  };

  return (
    <SectionCard title={t("integrasi.whitelist.title")}>
      <Box className="flex flex-col gap-3">
        {/* Input + add row */}
        <Box className="flex items-center gap-3">
          <Box
            as="input"
            type="text"
            value={ipDraft}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("integrasi.whitelist.placeholder")}
            className="flex-1 min-w-0 bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white font-plex placeholder:text-white/30 placeholder:font-inter text-sm outline-none focus:border-[#3B82F6]/60 transition-all"
          />
          <Box
            as="button"
            type="button"
            onClick={onAddIp}
            disabled={loading}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {t("integrasi.whitelist.addButton")}
          </Box>
        </Box>

        {/* IP chips */}
        {whitelistIps.length > 0 && (
          <Box className="flex flex-wrap gap-2">
            {whitelistIps.map((ip) => (
              <IpChip key={ip} ip={ip} onRemove={onRemoveIp} disabled={loading} />
            ))}
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}

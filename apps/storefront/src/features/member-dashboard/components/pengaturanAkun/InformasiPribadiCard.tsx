import React from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/pengaturanAkun/SectionCard";

const inputClass =
  "w-full bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#3B82F6]/60 transition-all";

const labelClass = "block text-[12px] font-outfit font-medium text-white/60 leading-none mb-2";

interface InformasiPribadiCardProps {
  fullName: string;
  onChangeFullName: (v: string) => void;
  username: string;
  onChangeUsername: (v: string) => void;
  email: string;
  onChangeEmail: (v: string) => void;
  whatsapp: string;
  onChangeWhatsapp: (v: string) => void;
  onSubmit: () => void;
}

export default function InformasiPribadiCard({
  fullName,
  onChangeFullName,
  username,
  onChangeUsername,
  email,
  onChangeEmail,
  whatsapp,
  onChangeWhatsapp,
  onSubmit,
}: InformasiPribadiCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const sectionTitle = (
    <Box className="flex items-center gap-2">
      <User className="w-4 h-4 text-white/70 shrink-0" />
      <Text
        as="span"
        className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
      >
        {t("pengaturanAkun.personalInfo.sectionTitle")}
      </Text>
    </Box>
  );

  return (
    <SectionCard title={sectionTitle}>
      <Box className="flex flex-col gap-4">
        {/* Row 1: Nama Lengkap + Username */}
        <Box className="grid grid-cols-2 gap-4">
          <Box>
            <Text as="span" className={labelClass}>
              {t("pengaturanAkun.personalInfo.fullName")}
            </Text>
            <Box
              as="input"
              type="text"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeFullName(e.target.value)}
              placeholder={t("pengaturanAkun.personalInfo.fullName")}
              className={inputClass}
            />
          </Box>
          <Box>
            <Text as="span" className={labelClass}>
              {t("pengaturanAkun.personalInfo.username")}
            </Text>
            <Box
              as="input"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeUsername(e.target.value)}
              placeholder={t("pengaturanAkun.personalInfo.username")}
              className={inputClass}
            />
          </Box>
        </Box>

        {/* Row 2: Email (full-width) */}
        <Box>
          <Text as="span" className={labelClass}>
            {t("pengaturanAkun.personalInfo.email")}
          </Text>
          <Box
            as="input"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeEmail(e.target.value)}
            placeholder={t("pengaturanAkun.personalInfo.email")}
            className={inputClass}
          />
        </Box>

        {/* Row 3: No. WhatsApp with +62 prefix */}
        <Box>
          <Text as="span" className={labelClass}>
            {t("pengaturanAkun.personalInfo.whatsapp")}
          </Text>
          <Box className="flex items-center gap-2">
            {/* +62 prefix chip */}
            <Box className="shrink-0 px-4 py-2.5 bg-[#0A0D14] border border-white/10 rounded-full">
              <Text as="span" className="text-sm font-inter text-white/70 leading-none">
                +62
              </Text>
            </Box>
            <Box
              as="input"
              type="tel"
              value={whatsapp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeWhatsapp(e.target.value)}
              placeholder="8xxx xxxx xxxx"
              className={inputClass}
            />
          </Box>
          <Text as="span" className="block text-[11px] font-inter text-white/40 leading-relaxed mt-1.5 px-1">
            {t("pengaturanAkun.personalInfo.whatsappNote")}
          </Text>
        </Box>

        {/* Submit button — right-aligned */}
        <Box className="flex justify-end">
          <Box
            as="button"
            type="button"
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
          >
            {t("pengaturanAkun.personalInfo.saveButton")}
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );
}

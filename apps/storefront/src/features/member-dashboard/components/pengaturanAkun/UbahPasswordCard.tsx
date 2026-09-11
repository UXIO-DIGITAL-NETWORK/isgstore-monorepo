import React from "react";
import { useTranslation } from "react-i18next";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/pengaturanAkun/SectionCard";
import { Spinner } from "@/components/common/Spinner";

const inputClass =
  "w-full bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 pr-11 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#3B82F6]/60 transition-all";

const labelClass = "block text-[12px] font-outfit font-medium text-white/60 leading-none mb-2";

interface UbahPasswordCardProps {
  currentPassword: string;
  onChangeCurrentPassword: (v: string) => void;
  showCurrent: boolean;
  onToggleCurrent: () => void;
  newPassword: string;
  onChangeNewPassword: (v: string) => void;
  showNew: boolean;
  onToggleNew: () => void;
  confirmPassword: string;
  onChangeConfirmPassword: (v: string) => void;
  showConfirm: boolean;
  onToggleConfirm: () => void;
  onSubmit: () => void;
  loading: boolean;
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <Box>
      <Text as="span" className={labelClass}>
        {label}
      </Text>
      <Box className="relative">
        <Box
          as="input"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder ?? "Password"}
          className={inputClass}
        />
        <Box
          as="button"
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Box>
      </Box>
    </Box>
  );
}

export default function UbahPasswordCard({
  currentPassword,
  onChangeCurrentPassword,
  showCurrent,
  onToggleCurrent,
  newPassword,
  onChangeNewPassword,
  showNew,
  onToggleNew,
  confirmPassword,
  onChangeConfirmPassword,
  showConfirm,
  onToggleConfirm,
  onSubmit,
  loading,
}: UbahPasswordCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const sectionTitle = (
    <Box className="flex items-center gap-2">
      <Lock className="w-4 h-4 text-white/70 shrink-0" />
      <Text
        as="span"
        className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
      >
        {t("pengaturanAkun.password.sectionTitle")}
      </Text>
    </Box>
  );

  return (
    <SectionCard title={sectionTitle}>
      <Box className="flex flex-col gap-4">
        {/* Current password — full width */}
        <PasswordField
          label={t("pengaturanAkun.password.current")}
          value={currentPassword}
          onChange={onChangeCurrentPassword}
          show={showCurrent}
          onToggle={onToggleCurrent}
          placeholder={t("pengaturanAkun.password.placeholder")}
        />

        {/* New + Confirm — 2 columns */}
        <Box className="grid grid-cols-2 gap-4">
          <PasswordField
            label={t("pengaturanAkun.password.new")}
            value={newPassword}
            onChange={onChangeNewPassword}
            show={showNew}
            onToggle={onToggleNew}
            placeholder={t("pengaturanAkun.password.placeholder")}
          />
          <PasswordField
            label={t("pengaturanAkun.password.confirm")}
            value={confirmPassword}
            onChange={onChangeConfirmPassword}
            show={showConfirm}
            onToggle={onToggleConfirm}
            placeholder={t("pengaturanAkun.password.placeholder")}
          />
        </Box>

        {/* Submit button — right-aligned */}
        <Box className="flex justify-end">
          <Box
            as="button"
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {t("pengaturanAkun.password.saveButton")}
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );
}

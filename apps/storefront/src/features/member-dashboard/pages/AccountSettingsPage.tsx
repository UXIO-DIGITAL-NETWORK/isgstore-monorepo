import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { usePengaturanAkun } from "@/features/member-dashboard/hooks/usePengaturanAkun";
import InformasiPribadiCard from "@/features/member-dashboard/components/pengaturanAkun/InformasiPribadiCard";
import UbahPasswordCard from "@/features/member-dashboard/components/pengaturanAkun/UbahPasswordCard";
import DuaFaktorCard from "@/features/member-dashboard/components/pengaturanAkun/DuaFaktorCard";

export default function AccountSettingsPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const {
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    whatsapp,
    setWhatsapp,
    avatarPreview,
    selectPhoto,
    removeAvatar,
    submitProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    toggleShowCurrent,
    showNew,
    toggleShowNew,
    showConfirm,
    toggleShowConfirm,
    submitPassword,
    setup2fa,
  } = usePengaturanAkun();

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
            {t("pengaturanAkun.title")}
          </Text>
        </Box>
        <Text as="span" className="text-[13px] font-inter text-white/50 leading-none pl-4">
          {t("pengaturanAkun.subtitle")}
        </Text>
      </Box>

      {/* Section cards */}
      <Box className="flex flex-col gap-5">
        <InformasiPribadiCard
          fullName={fullName}
          onChangeFullName={setFullName}
          username={username}
          onChangeUsername={setUsername}
          email={email}
          onChangeEmail={setEmail}
          whatsapp={whatsapp}
          onChangeWhatsapp={setWhatsapp}
          avatarPreview={avatarPreview}
          onSelectPhoto={selectPhoto}
          onRemovePhoto={removeAvatar}
          onSubmit={submitProfile}
        />
        <UbahPasswordCard
          currentPassword={currentPassword}
          onChangeCurrentPassword={setCurrentPassword}
          showCurrent={showCurrent}
          onToggleCurrent={toggleShowCurrent}
          newPassword={newPassword}
          onChangeNewPassword={setNewPassword}
          showNew={showNew}
          onToggleNew={toggleShowNew}
          confirmPassword={confirmPassword}
          onChangeConfirmPassword={setConfirmPassword}
          showConfirm={showConfirm}
          onToggleConfirm={toggleShowConfirm}
          onSubmit={submitPassword}
        />
        <DuaFaktorCard onSetup2fa={setup2fa} />
      </Box>
    </Box>
  );
}

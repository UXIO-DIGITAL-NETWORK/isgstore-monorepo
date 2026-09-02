import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/pengaturanAkun/SectionCard";
import { Spinner } from "@/components/common/Spinner";
import { compressImage } from "@/lib/imageCompression";
import { sanitizePhoneInput } from "@/lib/phone";

const inputClass =
  "w-full bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#3B82F6]/60 transition-all";

const labelClass = "block text-[12px] font-outfit font-medium text-white/60 leading-none mb-2";

/** Matches the API's `max:2048` on the avatar field. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface InformasiPribadiCardProps {
  fullName: string;
  onChangeFullName: (v: string) => void;
  username: string;
  onChangeUsername: (v: string) => void;
  email: string;
  onChangeEmail: (v: string) => void;
  whatsapp: string;
  onChangeWhatsapp: (v: string) => void;
  avatarPreview: string | null;
  onSelectPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onSubmit: () => void;
  loading: boolean;
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
  avatarPreview,
  onSelectPhoto,
  onRemovePhoto,
  onSubmit,
  loading,
}: InformasiPribadiCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected later
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("pengaturanAkun.personalInfo.photoNotAnImage"));
      return;
    }

    // Re-encode to WebP first — a phone photo is several MB as shot and a few
    // hundred KB after, so the size check below must run on what actually gets
    // uploaded, not on what came off the camera.
    const optimised = await compressImage(file);

    if (optimised.size > MAX_AVATAR_BYTES) {
      toast.error(t("pengaturanAkun.personalInfo.photoTooLarge"));
      return;
    }

    onSelectPhoto(optimised);
  };

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

        {/* ── Tambahkan Foto Profil ── */}
        {/* Hidden file input */}
        <Box
          as="input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          ref={fileInputRef}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => void handleFileChange(e)}
          className="hidden"
        />

        {/* Centered avatar + buttons */}
        <Box className="flex flex-col items-center gap-3">
          {/* Avatar circle */}
          <Box className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0">
            {avatarPreview ? (
              <Box
                as="img"
                src={avatarPreview}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Box className="w-full h-full bg-linear-to-br from-[#3B82F6] to-[#9234EA] flex items-center justify-center">
                <Text
                  as="span"
                  className="text-[28px] font-outfit font-bold text-white leading-none select-none"
                >
                  {fullName.charAt(0).toUpperCase()}
                </Text>
              </Box>
            )}
          </Box>

          {/* Upload button */}
          <Box
            as="button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[12px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
          >
            {t("pengaturanAkun.personalInfo.photoUploadButton")}
          </Box>

          {/* Remove button — only shown when a photo is set */}
          {avatarPreview && (
            <Box
              as="button"
              type="button"
              onClick={onRemovePhoto}
              className="text-[12px] font-inter text-white/50 hover:text-white/80 transition-colors cursor-pointer leading-none"
            >
              {t("pengaturanAkun.personalInfo.photoRemoveButton")}
            </Box>
          )}

          {/* Helper text */}
          <Text as="span" className="text-[11px] font-inter text-white/40 leading-none">
            {t("pengaturanAkun.personalInfo.photoHint")}
          </Text>
        </Box>

        {/* Divider */}
        <Box className="h-px bg-white/10" />

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

        {/* Row 3: No. WhatsApp. The field holds the whole number, country code
            included — it is seeded from the stored value, so stripping the code
            here would silently rewrite a foreign number on every save. */}
        <Box>
          <Text as="span" className={labelClass}>
            {t("pengaturanAkun.personalInfo.whatsapp")}
          </Text>
          <Box className="flex items-center gap-2">
            {/* A hint, not a fixed prefix. */}
            <Box className="shrink-0 px-4 py-2.5 bg-[#0A0D14] border border-white/10 rounded-full">
              <Text as="span" className="text-sm font-inter text-white/40 leading-none">
                +
              </Text>
            </Box>
            <Box
              as="input"
              type="tel"
              value={whatsapp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeWhatsapp(sanitizePhoneInput(e.target.value))}
              placeholder="08xx xxxx xxxx"
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
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {t("pengaturanAkun.personalInfo.saveButton")}
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );
}

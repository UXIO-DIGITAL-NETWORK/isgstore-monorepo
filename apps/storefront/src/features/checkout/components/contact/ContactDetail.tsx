import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";
import { sanitizePhoneInput } from "@/lib/phone";

interface Props {
  whatsapp: string;
  onWhatsappChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactDetail({ whatsapp, onWhatsappChange, email, onEmailChange }: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");
  const [touched, setTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const hasError = touched && whatsapp.trim() === "";
  const emailEmpty = email.trim() === "";
  const emailInvalidFormat = !emailEmpty && !EMAIL_PATTERN.test(email.trim());
  const emailError = emailTouched && (emailEmpty || emailInvalidFormat);

  return (
    <SectionCard stepNumber={5} title={t("contact.title")} gradientBorder>
      <Box className="flex flex-col gap-3">
        {/* WhatsApp field */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none flex items-center gap-0.5">
            {t("contact.whatsapp")}
            <Text as="span" className="text-red-500 text-[13px] leading-none">*</Text>
          </Text>
          <Box className="relative">
            {/* A hint, not a fixed prefix. The number is Indonesian unless the
                customer types their own "+<code>", which the field now keeps. */}
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <Text as="span" className="font-inter font-medium text-[13px] text-white/40 leading-none">
                +
              </Text>
              <Text as="span" className="text-white/20 text-sm leading-none">|</Text>
            </Box>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(sanitizePhoneInput(e.target.value))}
              onBlur={() => setTouched(true)}
              placeholder={t("contact.whatsappPlaceholder")}
              className={`pl-[36px] ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
          </Box>
          {/* Required field error */}
          {hasError && (
            <Text as="span" className="font-inter text-[11px] text-red-400 leading-none px-1">
              {t("contact.whatsappRequired", "Nomor WhatsApp wajib diisi")}
            </Text>
          )}
          {/* Inline helper note */}
          {!hasError && (
            <Text as="span" className="font-inter text-[11px] text-white/40 leading-none px-1">
              **{t("contact.helperNote")}
            </Text>
          )}
        </Box>

        {/* Email field */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none flex items-center gap-0.5">
            {t("contact.email", "Email")}
            <Text as="span" className="text-red-500 text-[13px] leading-none">*</Text>
          </Text>
          <Input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder={t("contact.emailPlaceholder", "you@email.com")}
            className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {emailError ? (
            <Text as="span" className="font-inter text-[11px] text-red-400 leading-none px-1">
              {emailEmpty
                ? t("contact.emailRequired", "Email wajib diisi")
                : t("contact.emailInvalid", "Format email tidak valid")}
            </Text>
          ) : (
            <Text as="span" className="font-inter text-[11px] text-white/40 leading-none px-1">
              **{t("contact.emailHelperNote", "Bukti pembelian akan dikirim ke email ini")}
            </Text>
          )}
        </Box>

        {/* Receipt info box */}
        <Box className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#9333EA]/50 bg-[#9333EA]/10">
          <Text as="span" className="text-[#C084FC] text-[14px] leading-none shrink-0">ⓘ</Text>
          <Text as="span" className="font-inter text-[12px] text-[#C084FC] leading-relaxed">
            {t("contact.receiptNote")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}

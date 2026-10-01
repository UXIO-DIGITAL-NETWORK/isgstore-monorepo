import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Mail, MessageCircle, Settings, User } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { MemberProfile } from "@/features/member-dashboard/types/dashboard.type";

interface Props {
  profile: MemberProfile;
}

export default function MemberIdCard({ profile }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const navigate = useNavigate();

  return (
    /* Gradient border wrapper: 1px gradient bg + dark forest inner */
    <Box className="flex-1 min-w-0 p-px rounded-2xl bg-linear-to-br from-[rgb(67,86,32)] to-[rgb(208,201,129)]">
      <Box className="bg-[rgb(14,20,10)] rounded-[15px] p-5 h-full flex flex-col gap-5">

        {/* ── Header row ── */}
        <Box className="flex items-center justify-between gap-3">
          <Box className="flex items-center gap-2">
            <User className="w-4 h-4 text-[rgb(208,201,129)] shrink-0" />
            <Text
              as="span"
              className="text-[11px] font-outfit font-bold text-white uppercase tracking-[0.15em] leading-none"
            >
              {t("memberCard.title")}
            </Text>
          </Box>

          {/* Gradient "Edit Profil" button */}
          <Box
            as="button"
            type="button"
            onClick={() =>
              navigate({ to: "/$locale/pengaturan-akun", params: { locale: locale ?? "id" } })
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-white shrink-0" />
            <Text as="span" className="text-[12px] font-outfit font-bold text-white leading-none">
              {t("memberCard.editProfile")}
            </Text>
          </Box>
        </Box>

        {/* ── Content: left (avatar + name + badge) | divider | right (contacts) ── */}
        <Box className="flex items-center flex-1">

          {/* Left: avatar, name, badge — centered */}
          <Box className="flex flex-col items-center gap-2.5 pr-5 shrink-0 w-37.5">
            {/* Avatar circle */}
            <Box className="w-18 h-18 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0">
              {profile.avatarUrl ? (
                <Box
                  as="img"
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Box className="w-full h-full bg-linear-to-br from-[rgb(67,86,32)] to-[rgb(208,201,129)] flex items-center justify-center">
                  <Text
                    as="span"
                    className="text-[26px] font-outfit font-bold text-white leading-none select-none"
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </Box>
              )}
            </Box>

            {/* Name */}
            <Text
              as="span"
              className="font-outfit font-bold text-[15px] text-white leading-tight text-center whitespace-nowrap"
            >
              {profile.name}
            </Text>

            {/* MEMBER badge — rectangular with gold border */}
            <Box className="px-3 border border-[rgb(208,201,129)] rounded-full bg-[rgb(208,201,129)]/5">
              <Text
                as="span"
                className="text-[10px] font-outfit font-bold text-[rgb(208,201,129)] uppercase tracking-[0.18em]"
              >
                {t("memberCard.memberBadge")}
              </Text>
            </Box>
          </Box>

          {/* Vertical divider */}
          <Box className="w-px self-stretch bg-white/10 shrink-0" />

          {/* Right: contact rows */}
          <Box className="flex flex-col justify-center gap-4 pl-5 flex-1 min-w-0">
            {/* Email */}
            <Box className="flex items-center gap-3">
              <Box className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-white/40" />
              </Box>
              <Text
                as="span"
                className="text-[13px] font-inter text-white/60 leading-none truncate"
              >
                {profile.email}
              </Text>
            </Box>

            {/* Phone / WhatsApp */}
            <Box className="flex items-center gap-3">
              <Box className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-white/40" />
              </Box>
              <Text
                as="span"
                className="text-[13px] font-inter text-white/60 leading-none"
              >
                {profile.phone}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

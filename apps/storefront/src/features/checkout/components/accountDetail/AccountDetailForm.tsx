import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";
import type { OrderFormField } from "@/types/models/game.model";

interface Props {
  /**
   * Declared by the game itself (`GET /v1/games/{slug}`). Field #1 maps to
   * `target_uid` and field #2 to `target_server` — checkout accepts no others.
   */
  fields: OrderFormField[];
  values: string[];
  onValueChange: (index: number, value: string) => void;
  /** Resolved in-game nickname; the line is hidden while this is null. */
  nickname?: string | null;
  isValidatingNickname?: boolean;
  /** Whether this game offers a username check (drives the "Cek Username" button). */
  supportsNicknameCheck?: boolean;
  onCheckUsername?: () => void;
  /** True once a check has run for the current id — lets us show "not found". */
  nicknameChecked?: boolean;
}

/** Fallback placeholders for the legacy two-field layout. */
const DEFAULT_FIELD_KEYS = ["userId", "serverId"] as const;

export default function AccountDetailForm({
  fields,
  values,
  onValueChange,
  nickname,
  isValidatingNickname,
  supportsNicknameCheck,
  onCheckUsername,
  nicknameChecked,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  // The account id is the first field; the check needs it filled in.
  const canCheck = Boolean((values[0] ?? "").trim()) && !isValidatingNickname;

  return (
    <SectionCard stepNumber={1} title={t("accountDetail.title")} gradientBorder>
      <Box className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const fallbackKey = DEFAULT_FIELD_KEYS[index];

          return (
            <Box key={field.key} className="flex flex-col gap-1.5">
              <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
                {field.label}
                {field.required && <Text as="span" className="text-red-400 ml-0.5">*</Text>}
              </Text>

              {field.type === "select" && field.options.length > 0 ? (
                // Only ever rendered for a legacy game whose schema explicitly
                // declares a select. A zone is always free text — a dropdown
                // produced wrong ids that failed at the supplier, after payment.
                <Box
                  as="select"
                  value={values[index] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(index, e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 font-inter text-[13px] text-white outline-none focus-visible:border-[#C084FC]"
                >
                  <Box as="option" value="">
                    {field.placeholder ?? field.label}
                  </Box>
                  {field.options.map((option) => (
                    <Box as="option" key={option.value} value={option.value}>
                      {option.label}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Input
                  type="text"
                  // `number` still renders a text input — a real number input
                  // strips the leading zeros some supplier ids carry.
                  inputMode={field.type === "number" ? "numeric" : "text"}
                  maxLength={field.max_length ?? undefined}
                  value={values[index] ?? ""}
                  onChange={(e) => onValueChange(index, e.target.value)}
                  placeholder={
                    field.placeholder ??
                    (fallbackKey ? t(`accountDetail.${fallbackKey}Placeholder`) : field.label)
                  }
                />
              )}

              {field.help && (
                <Text as="span" className="font-inter text-[11px] text-white/40 leading-none px-1">
                  {field.help}
                </Text>
              )}
            </Box>
          );
        })}

        {/* "Cek Username" — button-triggered because for some games this runs a
            paid supplier lookup. Only shown when the game supports a check. */}
        {supportsNicknameCheck && (
          <Box className="flex flex-col gap-2">
            <Box
              as="button"
              type="button"
              onClick={() => canCheck && onCheckUsername?.()}
              aria-disabled={!canCheck}
              className={`h-10 self-start rounded-xl border border-[#C084FC]/40 bg-[#C084FC]/10 px-4 font-inter font-medium text-[13px] text-[#E9D5FF] leading-none transition-colors ${
                canCheck ? "hover:bg-[#C084FC]/20 cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
            >
              {isValidatingNickname ? t("accountDetail.nicknameLoading") : t("accountDetail.checkUsername")}
            </Box>

            {/* Resolved name, or "not found" once a check has run and returned nothing. */}
            {nickname ? (
              <Box className="flex items-center gap-2">
                <Text as="span" className="font-inter text-[12px] text-white/45 leading-none">
                  {t("accountDetail.nickname")}:
                </Text>
                <Text as="span" className="font-inter font-medium text-[12px] text-[#C084FC] leading-none">
                  {nickname}
                </Text>
              </Box>
            ) : (
              nicknameChecked &&
              !isValidatingNickname && (
                <Text as="span" className="font-inter text-[12px] text-red-400 leading-none">
                  {t("accountDetail.nicknameError")}
                </Text>
              )
            )}
          </Box>
        )}

        {/* Guide link */}
        <Box className="flex items-center gap-2 cursor-pointer group">
          <Box className="w-5 h-5 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0">
            <Text as="span" className="font-outfit font-bold text-[10px] text-white leading-none">?</Text>
          </Box>
          <Text
            as="span"
            className="font-inter text-[12px] text-white/60 leading-none group-hover:text-white/90 transition-colors"
          >
            {t("accountDetail.viewGuide")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}

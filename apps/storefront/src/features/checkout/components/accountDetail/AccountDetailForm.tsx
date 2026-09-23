import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";
import type { OrderFormFieldError } from "@/features/checkout/lib/orderFormValidation";
import type { OrderFormField } from "@/types/models/game.model";

interface Props {
  /**
   * Declared by the game itself (`GET /v1/games/{slug}`) — one to five
   * identifiers, in the order the operator configured them. The first two are
   * mirrored into the API's `target_uid`/`target_server` columns; all of them
   * travel as `order_fields`.
   */
  fields: OrderFormField[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  /** Rule violations by field key; `null` (or absent) means valid. */
  errors?: Record<string, OrderFormFieldError | null>;
  /** Errors stay hidden until the buyer has actually tried to check out. */
  showErrors?: boolean;
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
  errors,
  showErrors = false,
  nickname,
  isValidatingNickname,
  supportsNicknameCheck,
  onCheckUsername,
  nicknameChecked,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  // The account id is the first declared field; the check needs it filled in.
  const canCheck = Boolean((values[fields[0]?.key ?? ""] ?? "").trim()) && !isValidatingNickname;

  return (
    <SectionCard stepNumber={1} title={t("accountDetail.title")} gradientBorder>
      <Box className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const fallbackKey = DEFAULT_FIELD_KEYS[index];
          const error = showErrors ? (errors?.[field.key] ?? null) : null;

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
                  value={values[field.key] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(field.key, e.target.value)}
                  aria-invalid={error ? true : undefined}
                  className={`w-full h-11 rounded-xl border bg-white/[0.03] px-3 font-inter text-[13px] text-white outline-none focus-visible:border-[#C084FC] ${
                    error ? "border-red-400/60" : "border-white/10"
                  }`}
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
                  value={values[field.key] ?? ""}
                  onChange={(e) => onValueChange(field.key, e.target.value)}
                  aria-invalid={error ? true : undefined}
                  className={error ? "border-red-400/60" : undefined}
                  placeholder={
                    field.placeholder ??
                    (fallbackKey ? t(`accountDetail.${fallbackKey}Placeholder`) : field.label)
                  }
                />
              )}

              {error ? (
                <Text as="span" className="font-inter text-[11px] text-red-400 leading-none px-1">
                  {t(error.key, error.values)}
                </Text>
              ) : (
                field.help && (
                  <Text as="span" className="font-inter text-[11px] text-white/40 leading-none px-1">
                    {field.help}
                  </Text>
                )
              )}
            </Box>
          );
        })}

        {/* "Cek Username" — button-triggered because for some games this runs a
            paid supplier lookup. Only shown when the game supports a check.
            Pressing "Top Up Sekarang" without pressing this runs it too. */}
        {supportsNicknameCheck && (
          <Box className="flex flex-col gap-2">
            <Box
              as="button"
              type="button"
              onClick={() => onCheckUsername?.()}
              disabled={!canCheck}
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

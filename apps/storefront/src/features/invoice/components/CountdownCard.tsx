import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useCountdownTo } from "@/hooks/useCountdown";

function DigitCell({ value }: { value: string }) {
  return (
    <Box
      className="w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-xl flex items-center justify-center shadow-glow-violet"
      style={{ background: "rgba(88, 28, 135, 0.5)", border: "1px solid #9333EA" }}
    >
      <Text
        as="span"
        className="text-[24px] md:text-[28px] font-bold leading-none tabular-nums font-plex text-white"
      >
        {value}
      </Text>
    </Box>
  );
}

function Separator() {
  return (
    <Text
      as="span"
      className="font-plex font-bold text-[28px] text-violet-75 leading-none self-start mt-2"
    >
      :
    </Text>
  );
}

interface Props {
  /**
   * Server-issued payment deadline. Counting to an absolute instant rather
   * than from a fixed duration means a page refresh cannot hand the customer
   * a fresh 24 hours the backend never granted.
   */
  expiresAt: string | null;
}

export default function CountdownCard({ expiresAt }: Props): React.JSX.Element | null {
  const { t } = useTranslation("invoice");
  const { hours, minutes, seconds } = useCountdownTo(expiresAt);

  // Channels with no configured expiry window get no timer at all, rather than
  // an invented one.
  if (!expiresAt) return null;

  return (
    <Box className="flex justify-center">
      <Box
        className="rounded-2xl px-6 py-4 border border-[rgba(147,51,234,0.3)] bg-[rgba(11,5,29,0.6)]"
        style={{ backdropFilter: "blur(6px)" }}
      >
        <Box className="flex items-start gap-3">
          {/* Hours */}
          <Box className="flex flex-col items-center gap-1.5">
            <DigitCell value={hours} />
            <Text as="span" className="font-inter text-[11px] text-white/50 leading-none">
              {t("timer.hours")}
            </Text>
          </Box>

          <Separator />

          {/* Minutes */}
          <Box className="flex flex-col items-center gap-1.5">
            <DigitCell value={minutes} />
            <Text as="span" className="font-inter text-[11px] text-white/50 leading-none">
              {t("timer.minutes")}
            </Text>
          </Box>

          <Separator />

          {/* Seconds */}
          <Box className="flex flex-col items-center gap-1.5">
            <DigitCell value={seconds} />
            <Text as="span" className="font-inter text-[11px] text-white/50 leading-none">
              {t("timer.seconds")}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

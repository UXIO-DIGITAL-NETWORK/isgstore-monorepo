import React from "react";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import SectionCard from "@/features/checkout/components/SectionCard";
import { applyPoints, maxRedeemablePoints } from "@/features/checkout/lib/points";
import { formatCurrency, formatNumber } from "@/lib/format";

interface Props {
  stepNumber: number;
  /** The member's point balance; null for a guest, who cannot redeem. */
  balance: number | null;
  /** Rupiah one point is worth. */
  rate: number;
  /** The package price the points are applied to. */
  price: number;
  value: number;
  onChange: (points: number) => void;
  /** False when the member's plan already buys a discount. */
  allowed: boolean;
}

/**
 * Redeeming loyalty points.
 *
 * Deliberately a discount step rather than a payment method: points usually
 * cover part of an order, and modelling them as a channel would make a small
 * balance useless until it grew. When they do cover everything, the order simply
 * owes nothing and no gateway is called.
 */
export default function PointsRedeem({
  stepNumber,
  balance,
  rate,
  price,
  value,
  onChange,
  allowed,
}: Props): React.JSX.Element | null {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;

  // A guest has no balance, and a member with none has nothing to offer.
  if (balance === null || balance <= 0) return null;

  const max = maxRedeemablePoints(price, balance, rate);
  const applied = applyPoints(price, balance, rate, value);

  return (
    <SectionCard stepNumber={stepNumber} title={t("points.title")} gradientBorder>
      <Box className="flex flex-col gap-3">
        <Text as="p" className="font-inter text-[12px] text-white/55 leading-relaxed">
          {t("points.available", {
            points: formatNumber(balance, locale),
            value: formatCurrency(balance * rate, locale),
          })}
        </Text>

        {!allowed ? (
          <Box className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
              {t("points.notAllowed")}
            </Text>
          </Box>
        ) : (
          <>
            <Box className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={max}
                value={value === 0 ? "" : String(value)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  onChange(Number.isFinite(next) ? Math.max(0, Math.min(next, max)) : 0);
                }}
                placeholder="0"
              />
              <Button
                type="button"
                onClick={() => onChange(max)}
                className="shrink-0 px-4 py-2.5 text-[12px]"
              >
                <Coins className="w-3.5 h-3.5 shrink-0" />
                {t("points.useMax")}
              </Button>
            </Box>

            {applied.points > 0 && (
              <Text as="p" className="font-inter text-[12px] text-green-400 leading-relaxed">
                {applied.coversEverything
                  ? t("points.coversAll")
                  : t("points.applied", { value: formatCurrency(applied.discount, locale) })}
              </Text>
            )}
          </>
        )}
      </Box>
    </SectionCard>
  );
}

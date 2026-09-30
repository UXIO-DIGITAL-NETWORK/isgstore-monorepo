import React from "react";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Checkbox } from "@/components/ui/Checkbox";
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
  checked: boolean;
  onToggle: (checked: boolean) => void;
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
 *
 * One checkbox, no amount to type: ticking it spends as many points as the
 * order can absorb. A part-redemption never made anyone better off — points are
 * worth a fixed rate whenever they are spent — so the number input was friction
 * charging the customer a decision it could make for them.
 */
export default function PointsRedeem({
  stepNumber,
  balance,
  rate,
  price,
  checked,
  onToggle,
  allowed,
}: Props): React.JSX.Element | null {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;

  // A guest has no balance, and a member with none has nothing to offer.
  if (balance === null || balance <= 0) return null;

  const max = maxRedeemablePoints(price, balance, rate);
  const applied = applyPoints(price, balance, rate, checked ? max : 0);

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
            <Box
              as="label"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 cursor-pointer hover:border-[rgb(67,86,32)]/40 transition-colors"
            >
              <Checkbox
                checked={checked}
                // Nothing to redeem against an empty cart — the order has to be
                // worth at least one point before the choice means anything.
                disabled={max <= 0}
                onChange={(e) => onToggle(e.target.checked)}
              />
              <Coins className="w-4 h-4 text-[rgb(208,201,129)] shrink-0" />
              <Text as="span" className="font-inter text-[12px] text-white/80 leading-snug">
                {t("points.useAll", {
                  points: formatNumber(max, locale),
                  value: formatCurrency(max * rate, locale),
                })}
              </Text>
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

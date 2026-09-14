import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Zap } from "lucide-react";
import { useFlashSaleQuery } from "@/hooks/useFlashSaleQuery";
import type { FlashSaleItem } from "@/features/home/types/flashSale.type";
import TimerBox from "./fragments/TimerBox";
import FlashSaleCard from "./fragments/FlashSaleCard";

/**
 * Counts down to the sale's real end time rather than a fixed duration from
 * page load — the old version restarted the clock on every refresh, so the
 * timer never agreed with when the sale actually ended.
 */
function useCountdown(endsAt: string | undefined) {
  // Derived from `endsAt` rather than reset inside the effect: with no end
  // time there is nothing to count, and writing state in an effect just to
  // express that is both a lint error and an extra render.
  const endTime = endsAt ? Date.parse(endsAt) : null;
  const [remaining, setRemaining] = useState<number>(() =>
    endTime ? Math.max(0, Math.round((endTime - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (endTime === null) return;

    const tick = () => setRemaining(Math.max(0, Math.round((endTime - Date.now()) / 1000)));

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return {
    hours: String(Math.floor(remaining / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"),
    seconds: String(remaining % 60).padStart(2, "0"),
  };
}

export default function FlashSale(): React.JSX.Element {
  const { t } = useTranslation("home");
  const { data } = useFlashSaleQuery();
  const sale = data?.data ?? null;
  const { hours, minutes, seconds } = useCountdown(sale?.ends_at);

  const items: FlashSaleItem[] = (sale?.items ?? []).map((item) => ({
    id: String(item.id),
    gameSlug: item.game_slug ?? "",
    name: item.name,
    game: item.game ?? "",
    image: item.image_url ?? "",
    salePrice: item.sale_price,
    originalPrice: item.original_price,
    discount: item.discount,
    stockAvailable: item.stock_available,
    stockTotal: item.stock_total,
  }));

  // Nothing running means no block at all, rather than an empty card grid
  // under a zeroed timer.
  if (!sale || items.length === 0) return <></>;

  return (
    <Box className="w-fulls pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        <Box
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(147, 51, 234, 0.05)",
            border: "1px solid rgba(147, 51, 234, 0.5)",
          }}
        >
          {/* Header */}
          <Box
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4"
            style={{ background: "rgba(146, 52, 234, 0.1)" }}
          >
            <Box>
              <Box className="flex items-center gap-2.5 mb-1.5">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
                <Text as="span" className="text-2xl font-bold tracking-wide uppercase">
                  {t("flashSale.title")}
                </Text>
              </Box>
              <Text as="p" className="text-sm" style={{ color: "#767676" }}>
                {t("flashSale.subtitle")}
              </Text>
            </Box>

            {/* Countdown timer */}
            <Box
              className="flex items-center gap-2 px-4 py-3 shrink-0 rounded-xl"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(147, 51, 234, 0.2)",
              }}
            >
              <TimerBox value={hours} />
              <Text as="span" className="text-xl font-bold leading-none">:</Text>
              <TimerBox value={minutes} />
              <Text as="span" className="text-xl font-bold leading-none">:</Text>
              <TimerBox value={seconds} />
            </Box>
          </Box>

          {/* Divider */}
          <Box style={{ height: "1px", background: "rgba(146, 52, 234, 0.5)" }} />

          {/* Card body */}
          <Box className="p-5">
            <Box className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {items.map((item, idx) => (
                <FlashSaleCard key={item.id} item={item} isActive={idx === 0} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

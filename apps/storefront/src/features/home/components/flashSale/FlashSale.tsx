import React, { useState, useEffect } from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Zap } from "lucide-react";
import { FLASH_SALE_ITEMS, FLASH_SALE_DURATION_SECONDS } from "@/features/home/data/flashSale.data";
import TimerBox from "./fragments/TimerBox";
import FlashSaleCard from "./fragments/FlashSaleCard";

function useCountdown(durationSeconds: number) {
  const [endTime] = useState(() => Date.now() + durationSeconds * 1000);
  const [remaining, setRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
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
  const { hours, minutes, seconds } = useCountdown(FLASH_SALE_DURATION_SECONDS);

  return (
    <Box className="w-full bg-[#0B0A11] pt-6 pb-8 md:pt-8 md:pb-12">
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
                  Flash Sale
                </Text>
              </Box>
              <Text as="p" className="text-sm" style={{ color: "#767676" }}>
                Pesan sekarang! Persediaan terbatas
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
              {FLASH_SALE_ITEMS.map((item, idx) => (
                <FlashSaleCard key={item.id} item={item} isActive={idx === 0} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

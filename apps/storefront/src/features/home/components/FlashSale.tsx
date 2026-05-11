import React, { useState, useEffect } from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Zap } from "lucide-react";
import { FLASH_SALE_ITEMS, FLASH_SALE_DURATION_SECONDS } from "../data/flash-sale.data";
import type { FlashSaleItem } from "../types/flash-sale.type";

function formatPrice(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

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

function TimerBox({ value, isAccent }: { value: string; isAccent?: boolean }) {
  return (
    <Box
      className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
        isAccent
          ? "bg-violet-600/20 border-violet-500/60 text-violet-400"
          : "bg-[#1E1A30] border-violet-500/25 text-white"
      }`}
    >
      <Text
        as="span"
        className="text-lg font-black leading-none tabular-nums"
      >
        {value}
      </Text>
    </Box>
  );
}

function FlashSaleCard({ item, isActive }: { item: FlashSaleItem; isActive: boolean }) {
  const stockPercent = Math.round((item.stockAvailable / item.stockTotal) * 100);

  return (
    <Box
      className={`shrink-0 w-[195px] rounded-xl border p-4 flex flex-col gap-2.5 ${
        isActive ? "border-violet-500/70 bg-[#13111F]" : "border-white/8 bg-[#13111F]"
      }`}
      style={isActive ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 0 28px rgba(139,92,246,0.12)" } : undefined}
    >
      {/* Game thumbnail */}
      <Box className="flex justify-center pt-1">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 rounded-xl object-cover"
          loading="lazy"
        />
      </Box>

      {/* Name + game label */}
      <Box className="text-center">
        <Text
          as="p"
          className="text-sm font-bold text-white leading-snug"
        >
          {item.name}
        </Text>
        <Text
          as="p"
          className="text-xs text-white/40 mt-0.5 leading-none"
        >
          {item.game}
        </Text>
      </Box>

      {/* Sale price */}
      <Text
        as="p"
        className="text-[17px] font-black text-white text-center leading-tight tabular-nums"
      >
        {formatPrice(item.salePrice)}
      </Text>

      {/* Original price + discount badge */}
      <Box className="flex items-center justify-between gap-1.5">
        <Text
          as="span"
          className="text-[11px] text-white/35 line-through tabular-nums"
        >
          {formatPrice(item.originalPrice)}
        </Text>
        <Box className="rounded-full px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 shrink-0 inline-flex justify-center items-center">
          <Text
            as="span"
            className="text-[10px] font-semibold text-emerald-400 whitespace-nowrap tabular-nums"
          >
            - {formatPrice(item.discount)}
          </Text>
        </Box>
      </Box>

      {/* Stock availability */}
      <Box>
        <Box className="flex items-center justify-between mb-1.5">
          <Text
            as="span"
            className="text-[10px] font-bold text-white/35 uppercase tracking-widest"
          >
            Tersedia
          </Text>
          <Text
            as="span"
            className="text-[10px] text-white/35 tabular-nums"
          >
            {item.stockAvailable} / {item.stockTotal}
          </Text>
        </Box>
        <Box className="h-[3px] rounded-full bg-white/8">
          <Box
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500"
            style={{ width: `${stockPercent}%` }}
          />
        </Box>
      </Box>

      {/* CTA button */}
      <Box
        as="button"
        type="button"
        className={`w-full h-10 rounded-full text-sm font-semibold transition-all cursor-pointer outline-none active:scale-95 mt-0.5 ${
          isActive
            ? "bg-linear-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"
            : "bg-white/6 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white"
        }`}
      >
        Top Up Sekarang
      </Box>
    </Box>
  );
}

export default function FlashSale(): React.JSX.Element {
  const { hours, minutes, seconds } = useCountdown(FLASH_SALE_DURATION_SECONDS);

  return (
    <Box className="w-full bg-[#0B0A11] pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        {/* ── Outer purple card ── */}
        <Box
          className="rounded-2xl border border-violet-500/35 overflow-hidden"
          style={{ boxShadow: "0 0 48px rgba(139,92,246,0.08)" }}
        >
          {/* ── Card title — brighter purple header ── */}
          <Box className="flex items-center justify-between px-5 py-4 bg-[#1A1535]">
            <Box>
              <Box className="flex items-center gap-2.5 mb-1.5">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
                <Text as="span" className="text-2xl font-black text-white tracking-wide uppercase">
                  Flash Sale
                </Text>
              </Box>
              <Text as="p" className="text-sm text-white/40">
                Pesan sekarang! Persediaan terbatas
              </Text>
            </Box>

            {/* ── Countdown timer ── */}
            <Box className="flex items-center gap-1.5 shrink-0">
              <TimerBox value={hours} />
              <Text as="span" className="text-white/45 font-bold text-xl leading-none pb-0.5">
                :
              </Text>
              <TimerBox value={minutes} />
              <Text as="span" className="text-white/45 font-bold text-xl leading-none pb-0.5">
                :
              </Text>
              <TimerBox value={seconds} isAccent />
            </Box>
          </Box>

          {/* ── Divider ── */}
          <Box className="h-px bg-violet-500/20" />

          {/* ── Card body — product cards ── */}
          <Box className="p-5 bg-[#0E0C1A]">
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

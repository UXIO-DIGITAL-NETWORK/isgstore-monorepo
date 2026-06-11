import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { formatCurrency } from "@/lib/format";
import type { PendingOrder } from "@/store/useCheckoutStore";

interface Props {
  order: PendingOrder;
}

function InfoRow({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <Box className="flex items-center gap-2">
      <Text as="span" className="font-inter text-[13px] text-white/55 w-[90px] shrink-0 leading-snug">
        {label}
      </Text>
      <Text as="span" className="font-inter text-[13px] text-white/55 shrink-0">:</Text>
      <Text
        as="span"
        className={[
          "text-[13px] text-white leading-snug",
          numeric ? "font-plex font-medium" : "font-inter",
        ].join(" ")}
      >
        {value}
      </Text>
    </Box>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center justify-between">
      <Text as="span" className="font-inter text-[13px] text-white/55">
        {label}
      </Text>
      <Text as="span" className="font-plex text-[13px] text-white font-medium">
        {value}
      </Text>
    </Box>
  );
}

export default function OrderDetailCard({ order }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("invoice");
  const locale = i18n.language;

  return (
    <Box className="rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#0D1117] overflow-hidden">
      {/* Top: thumbnail + game/package info + player data */}
      <Box className="p-4 flex gap-3">
        {/* Game thumbnail */}
        <Box className="w-[90px] h-[110px] rounded-xl overflow-hidden shrink-0 border border-violet-75/20">
          <img
            src={order.gameThumbnail}
            alt={order.gameName}
            className="w-full h-full object-cover"
          />
        </Box>

        {/* Right: title + player data */}
        <Box className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Text as="p" className="font-outfit font-bold text-[14px] text-white leading-tight">
            {order.gameName} {order.gameRegion}
          </Text>
          <Text as="p" className="font-inter text-[13px] text-white/55 leading-none mb-1">
            {order.packageLabel}
          </Text>

          <Box className="flex flex-col gap-1.5 mt-1">
            <InfoRow label={t("orderDetail.userId")} value={order.userId} numeric />
            <InfoRow label={t("orderDetail.serverId")} value={order.serverId} numeric />
            <InfoRow label={t("orderDetail.username")} value={order.username} />
          </Box>
        </Box>
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8 mx-4" />

      {/* Price breakdown */}
      <Box className="px-4 pt-3 pb-2 flex flex-col gap-2">
        <PriceRow
          label={t("orderDetail.price")}
          value={formatCurrency(order.price, locale)}
        />
        <PriceRow
          label={t("orderDetail.adminFee")}
          value={formatCurrency(order.adminFee, locale)}
        />
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8 mx-4" />

      {/* Total */}
      <Box className="px-4 py-3 flex items-center justify-between">
        <Text as="span" className="font-outfit font-bold text-[14px] text-white">
          {t("orderDetail.totalPayment")}
        </Text>
        <PriceText className="text-[20px]">
          {formatCurrency(order.total, locale)}
        </PriceText>
      </Box>
    </Box>
  );
}

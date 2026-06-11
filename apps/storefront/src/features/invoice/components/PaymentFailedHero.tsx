import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import paymentFailedImg from "@/assets/images/checkout/payment_failed.png";

export default function PaymentFailedHero(): React.JSX.Element {
  const { t } = useTranslation("invoice");

  return (
    <Box className="flex flex-col items-center gap-4 pt-10 pb-2">
      <img
        src={paymentFailedImg}
        alt="Payment Failed"
        className="w-[180px] h-[180px] object-contain drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]"
      />
      <Box className="flex flex-col items-center gap-2">
        <Text
          as="p"
          className="font-outfit font-bold text-[32px] md:text-[38px] text-white uppercase tracking-wide leading-tight text-center"
        >
          {t("failed.heading")}
        </Text>
        <Text
          as="p"
          className="font-inter text-[14px] text-white/55 leading-snug text-center max-w-xs"
        >
          {t("failed.subtitle")}
        </Text>
      </Box>
    </Box>
  );
}

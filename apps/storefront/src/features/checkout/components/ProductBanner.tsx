import React from "react";
import { Box } from "@/components/common/Box";
import checkoutBanner from "@/assets/images/banner/checkout_banner.png";

export default function ProductBanner(): React.JSX.Element {
  return (
    <Box className="w-full h-55 md:h-80 overflow-hidden">
      <img
        src={checkoutBanner}
        alt="Promo Top Up Spesial"
        className="w-full h-full object-fill object-center block"
        loading="eager"
        decoding="sync"
      />
    </Box>
  );
}

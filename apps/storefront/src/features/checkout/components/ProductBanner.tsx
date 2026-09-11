import React from "react";
import { Box } from "@/components/common/Box";
import checkoutBanner from "@/assets/images/banner/checkout_banner.png";

export default function ProductBanner(): React.JSX.Element {
  return (
    <Box className="w-full h-55 md:h-80 overflow-hidden">
      {/* Decorative: a bundled banner beside the real product details, not
          content. An empty alt keeps a screen reader from announcing a promise
          the image does not actually make — and is the right answer here rather
          than a translated one. */}
      <img
        src={checkoutBanner}
        alt=""
        className="w-full h-full object-fill object-center block"
        loading="eager"
        decoding="sync"
      />
    </Box>
  );
}

import reactLogo from "@/assets/react.svg";
// Hero banners: a 1x-friendly fallback plus a responsive srcset so phones pull
// the ~480/768px variant instead of the desktop-sized file.
import banner7 from "@/assets/images/banner/banner_7.jpeg?w=1112&format=webp";
import banner7Set from "@/assets/images/banner/banner_7.jpeg?format=webp&w=480;768;1112&as=srcset";
import banner8 from "@/assets/images/banner/banner_8.jpeg?w=1112&format=webp";
import banner8Set from "@/assets/images/banner/banner_8.jpeg?format=webp&w=480;768;1112&as=srcset";
import banner9 from "@/assets/images/banner/banner_9.jpeg?w=1112&format=webp";
import banner9Set from "@/assets/images/banner/banner_9.jpeg?format=webp&w=480;768;1112&as=srcset";
import flashSale1 from "@/assets/images/flash_sale/flash_sale_1.png?w=400&format=webp";

export const IMAGES = {
  REACT_LOGO: reactLogo,
  BANNER_7: banner7,
  BANNER_7_SRCSET: banner7Set,
  BANNER_8: banner8,
  BANNER_8_SRCSET: banner8Set,
  BANNER_9: banner9,
  BANNER_9_SRCSET: banner9Set,
  FLASH_SALE_1: flashSale1,
};

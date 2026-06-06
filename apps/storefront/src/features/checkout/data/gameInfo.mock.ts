import mlLogo from "@/assets/images/game_logo/mobile_legends.png";
import mlThumbnail from "@/assets/images/games/games_1.png";
import type { GameInfo } from "@/features/checkout/types/checkout.type";

export const GAME_INFO_MOCK: GameInfo = {
  name: "Mobile Legends",
  publisher: "Moonton",
  region: "Indonesia",
  slug: "mobile-legends",
  logo: mlLogo,
  thumbnail: mlThumbnail,
};

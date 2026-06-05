import popularGameImage1 from "@/assets/images/popular_games/popular_games_1.png";
import popularGameImage2 from "@/assets/images/popular_games/popular_games_2.png";
import popularGameImage3 from "@/assets/images/popular_games/popular_games_3.png";
import popularGameImage4 from "@/assets/images/popular_games/popular_games_4.png";
import popularGameImage5 from "@/assets/images/popular_games/popular_games_5.png";
import popularGameImage6 from "@/assets/images/popular_games/popular_games_6.png";
import type { PopularGame } from "@/features/home/types/popularGames.type";

// TODO: replace with per-game artwork when assets are available
export const POPULAR_GAMES: PopularGame[] = [
  {
    id: "ml-id",
    title: "Mobile Legends",
    subtitle: "Moonton",
    region: "Indonesia",
    image: popularGameImage1,
    badge: { emoji: "🔥", label: "TRENDING", labelKey: "popular.badges.trending" },
  },
  {
    id: "ml-global",
    title: "Mobile Legends",
    subtitle: "Moonton",
    region: "Global",
    image: popularGameImage2,
    badge: { emoji: "⭐", label: "BEST SELLER", labelKey: "popular.badges.bestSeller" },
  },
  {
    id: "ff-id",
    title: "Free Fire Garena",
    subtitle: "Moonton",
    region: "Indonesia",
    image: popularGameImage3,
    badge: { emoji: "🔥", label: "TRENDING", labelKey: "popular.badges.trending" },
  },
  {
    id: "roblox-id",
    title: "Roblox",
    subtitle: "Sandboxed",
    region: "Indonesia",
    image: popularGameImage4,
    badge: { emoji: "⭐", label: "BEST SELLER", labelKey: "popular.badges.bestSeller" },
  },
  {
    id: "pubg-id",
    title: "PUBG MOBILE",
    subtitle: "Battle Royale",
    region: "Indonesia",
    image: popularGameImage5,
    badge: { emoji: "🔥", label: "TRENDING", labelKey: "popular.badges.trending" },
  },
  {
    id: "genshin-id",
    title: "Genshin Impact",
    subtitle: "miHoYo",
    region: "Indonesia",
    image: popularGameImage6,
    badge: { emoji: "🔥", label: "TRENDING", labelKey: "popular.badges.trending" },
  },
];

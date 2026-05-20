import popularGameImage from "@/assets/images/popular_games/popular_games_1.png";
import type { PopularGame } from "@/features/home/types/popularGames.type";

// TODO: replace with per-game artwork when assets are available
export const POPULAR_GAMES: PopularGame[] = [
  {
    id: "ml-id",
    title: "Mobile Legends Indonesia",
    subtitle: "Moonton",
    image: popularGameImage,
    badge: { emoji: "🔥", label: "TRENDING" },
  },
  {
    id: "ml-global",
    title: "Mobile Legends Global",
    subtitle: "Moonton",
    image: popularGameImage,
    badge: { emoji: "⭐", label: "BEST SELLER" },
  },
  {
    id: "ff-id",
    title: "Free Fire Garena Indonesia",
    subtitle: "Moonton",
    image: popularGameImage,
    badge: { emoji: "🔥", label: "TRENDING" },
  },
  {
    id: "roblox-id",
    title: "Roblox Game Indonesia",
    subtitle: "Sandboxed",
    image: popularGameImage,
    badge: { emoji: "⭐", label: "BEST SELLER" },
  },
  {
    id: "pubg-id",
    title: "PUBG MOBILE Indonesia",
    subtitle: "Battle Royale",
    image: popularGameImage,
    badge: { emoji: "🔥", label: "TRENDING" },
  },
  {
    id: "genshin-id",
    title: "Genshine Impact Indonesia",
    subtitle: "moHoyo",
    image: popularGameImage,
    badge: { emoji: "🔥", label: "TRENDING" },
  },
];

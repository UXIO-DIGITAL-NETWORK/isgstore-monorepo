import type { Game } from "@/types/game.type";

// Placeholder art — replace with per-game artwork when assets are available
import placeholder from "@/assets/images/popular_games/popular_games_1.png";
import gameLogo from "@/assets/images/game_logo/mobile_legends.png";

export const GAMES: Game[] = [
  // Row 1
  {
    id: "ml-id-1",
    title: "Mobile Legends",
    region: "Indonesia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "azure",
  },
  {
    id: "ml-global-1",
    title: "Mobile Legends",
    region: "Global",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "violet",
  },
  {
    id: "ml-my-1",
    title: "Mobile Legends",
    region: "Malaysia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "azure",
  },
  {
    id: "ff-id-1",
    title: "Free Fire",
    region: "Indonesia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "battle-royale",
    borderColor: "violet",
  },
  {
    id: "genshin-1",
    title: "Genshin Impact",
    region: "moHoyo",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "pc-games",
    borderColor: "azure",
  },
  {
    id: "pubg-1",
    title: "PUBG Mobile",
    region: "Level Infinite",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "fps",
    borderColor: "violet",
  },
  // Row 2
  {
    id: "ml-global-2",
    title: "Mobile Legends",
    region: "Global",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "azure",
  },
  {
    id: "ml-my-2",
    title: "Mobile Legends",
    region: "Malaysia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "violet",
  },
  {
    id: "ml-id-2",
    title: "Mobile Legends",
    region: "Indonesia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "moba",
    borderColor: "azure",
  },
  {
    id: "genshin-2",
    title: "Genshin Impact",
    region: "moHoyo",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "pc-games",
    borderColor: "violet",
  },
  {
    id: "pubg-2",
    title: "PUBG Mobile",
    region: "Level Infinite",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "fps",
    borderColor: "azure",
  },
  {
    id: "ff-id-2",
    title: "Free Fire",
    region: "Indonesia",
    bgImage: placeholder,
    logoImage: gameLogo,
    category: "battle-royale",
    borderColor: "violet",
  },
];

/**
 * Curated subset shown as "Pencarian Populer" when the search bar is focused
 * but the query is empty. Order matches the mockup: ML-ID, FF, Genshin, PUBG, ML-Global.
 */
export const POPULAR_SEARCH_GAMES: Game[] = ["ml-id-1", "ff-id-1", "genshin-1", "pubg-1", "ml-global-1"].map(
  (id) => GAMES.find((g) => g.id === id)!
);

import gamesImg1 from "@/assets/images/games/games_1.png";
import gamesImg2 from "@/assets/images/games/games_2.png";
import gamesImg3 from "@/assets/images/games/games_3.png";
import gamesImg4 from "@/assets/images/games/games_4.png";
import gamesImg5 from "@/assets/images/games/games_5.png";
import gamesImg6 from "@/assets/images/games/games_6.png";

export interface TrackOrderGame {
  id: string;
  name: string;
  logo: string;
}

/**
 * Canonical list of games displayed in the "Cek Pesanan" table.
 * Logo images are sourced from src/assets/images/games/.
 *
 * TODO: Replace with API-driven data once the backend returns gameId with each transaction.
 */
export const TRACK_ORDER_GAMES: TrackOrderGame[] = [
  { id: "ml-id",      name: "Mobile Legends",  logo: gamesImg1 },
  { id: "ml-global",  name: "Mobile Legends",  logo: gamesImg2 },
  { id: "ff-id",      name: "Free Fire",        logo: gamesImg3 },
  { id: "genshin",    name: "Genshin Impact",   logo: gamesImg4 },
  { id: "ml-my",      name: "Mobile Legends",   logo: gamesImg5 },
  { id: "pubg",       name: "PUBG Mobile",      logo: gamesImg6 },
];

/** Quick lookup by game id — O(1) after build */
export const TRACK_ORDER_GAMES_MAP = new Map<string, TrackOrderGame>(
  TRACK_ORDER_GAMES.map((g) => [g.id, g])
);

import { useQuery } from "@tanstack/react-query";
import { storefrontService } from "@/services/storefront.service";
import { toGames } from "@/lib/games";
import type { Game, GameCategory } from "@/types/game.type";

/** Big enough to hold the whole catalog for a storefront of this size. */
const CATALOG_PAGE_SIZE = 100;

interface Options {
  sort?: "name" | "popular";
  search?: string;
  perPage?: number;
  enabled?: boolean;
}

/**
 * The public game catalog.
 *
 * Shared by the homepage grid, the "popular" rail and the navbar search — it
 * lives in `src/hooks/` rather than a feature so none of them has to import
 * from another feature.
 */
export const useGamesQuery = ({ sort = "name", search, perPage = CATALOG_PAGE_SIZE, enabled = true }: Options = {}) =>
  useQuery({
    queryKey: ["games", sort, search ?? "", perPage],
    queryFn: async () => {
      const response = await storefrontService.games({ sort, search, per_page: perPage });
      return toGames(response.data.data);
    },
    enabled,
    // The catalog changes when an admin edits it, not between page views.
    staleTime: 5 * 60 * 1000,
  });

/**
 * Tabs derived from the categories actually present in the catalog, so a tab
 * never leads to an empty grid.
 */
export function deriveCategoryTabs(games: Game[]): { key: GameCategory; label: string }[] {
  const seen = new Map<string, string>();

  for (const game of games) {
    if (!seen.has(game.category)) {
      seen.set(game.category, toLabel(game.category));
    }
  }

  return [...seen].map(([key, label]) => ({ key: key as GameCategory, label }));
}

function toLabel(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

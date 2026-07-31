import placeholderArt from "@/assets/images/popular_games/popular_games_1.png";
import placeholderLogo from "@/assets/images/game_logo/mobile_legends.png";
import type { Game } from "@/types/game.type";
import type { GameModel } from "@/types/models/game.model";

/**
 * Adapts a catalog game into the `Game` shape the cards already render.
 *
 * `id` carries the slug rather than a numeric id because every card links to
 * `/checkout/{id}` and the checkout route is addressed by slug.
 *
 * `borderColor` alternates by position. It has no server-side meaning — it is
 * the grid's existing azure/violet rhythm, preserved so a data-driven list
 * looks identical to the hand-written one it replaces.
 */
export function toGame(model: GameModel, index: number): Game {
  return {
    id: model.slug,
    title: model.name,
    region: model.region ?? model.sub_name ?? "",
    bgImage: model.thumbnail_url ?? placeholderArt,
    logoImage: model.logo_url ?? placeholderLogo,
    category: normaliseCategory(model.category_type?.name),
    borderColor: index % 2 === 0 ? "azure" : "violet",
  };
}

export function toGames(models: GameModel[]): Game[] {
  return models.map(toGame);
}

/**
 * Category types are admin-managed free text, so they are slugified into the
 * tab key rather than matched against a fixed list — a new type added in the
 * back office shows up without a frontend change.
 */
function normaliseCategory(name: string | undefined): Game["category"] {
  if (!name) return "moba";

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") as Game["category"];
}

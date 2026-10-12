import { ok, paginate, strParam } from "../envelope";
import { MOCK_GAME_DETAILS, MOCK_GAMES, MOCK_PRODUCTS, MOCK_REVIEWS } from "../data/games";
import type { MockHandler } from "../types";

export const gameHandlers: MockHandler[] = [
  // Specific sub-routes first: `/v1/games/:slug/products` must beat `/v1/games/:slug`.
  {
    method: "GET",
    pattern: /^\/v1\/games\/([^/]+)\/products$/,
    resolve: ({ match }) => ok(MOCK_PRODUCTS[decodeURIComponent(match[1])] ?? { groups: [], products: [] }),
  },
  {
    method: "GET",
    pattern: /^\/v1\/games\/([^/]+)\/reviews$/,
    resolve: () => ok(MOCK_REVIEWS),
  },
  {
    method: "POST",
    pattern: /^\/v1\/games\/([^/]+)\/validate-id$/,
    resolve: () => ok({ nickname: "Mock Player", validated: true, supported: true }),
  },
  {
    method: "GET",
    pattern: /^\/v1\/games\/([^/]+)$/,
    resolve: ({ match }) => ok(MOCK_GAME_DETAILS[decodeURIComponent(match[1])] ?? null),
  },
  {
    method: "GET",
    pattern: /^\/v1\/games$/,
    resolve: ({ params }) => {
      const search = strParam(params.search).toLowerCase();
      const sort = strParam(params.sort);

      let rows = MOCK_GAMES.filter((game) => !search || game.name.toLowerCase().includes(search));

      rows = sort === "popular"
        // The rail takes the first six — the same six the Figma shows.
        ? rows.slice(0, 6)
        : [...rows].sort((a, b) => a.name.localeCompare(b.name));

      return paginate(rows, params, "/v1/games");
    },
  },
];

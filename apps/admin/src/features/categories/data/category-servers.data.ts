import type { CategoryServer } from "../types/categoryServer.type";

/**
 * Server/region option groups a category can expose on the buyer's order
 * form. The reference's own two rows ("Genshin Impact", "Mobile Legends
 * Login") are sensible here and are kept — unlike the Category Type
 * reference, whose rows were games rather than types.
 *
 * Ids and timestamps are literals, not generated: the contract test depends
 * on the fixtures being deterministic. One row deliberately has no options,
 * so the empty case is covered.
 */
export const CATEGORY_SERVERS: CategoryServer[] = [
  {
    id: "cserver-1",
    name: "Genshin Impact",
    options: [
      { name: "Asia", value: "os_asia" },
      { name: "Europe", value: "os_euro" },
      { name: "America", value: "os_usa" },
      { name: "TW, HK, MO", value: "os_cht" },
    ],
    created_at: "2026-03-14T09:12:00Z",
    updated_at: "2026-06-20T09:15:00Z",
  },
  {
    id: "cserver-2",
    name: "Mobile Legends Login",
    options: [
      { name: "Moonton Account", value: "moonton" },
      { name: "Facebook", value: "facebook" },
      { name: "Google", value: "google" },
    ],
    created_at: "2026-03-21T15:44:00Z",
    updated_at: "2026-06-18T11:40:00Z",
  },
  {
    id: "cserver-3",
    name: "Free Fire Region",
    options: [],
    created_at: "2026-04-06T11:28:00Z",
    updated_at: "2026-06-15T10:00:00Z",
  },
];

import type { MockHandler } from "../types";
import { authHandlers } from "./auth";
import { commerceHandlers } from "./commerce";
import { contentHandlers } from "./content";
import { gameHandlers } from "./games";
import { memberHandlers } from "./member";
import { refundHandlers } from "./refund";
import { storefrontHandlers } from "./storefront";
import { walletHandlers } from "./wallet";

/**
 * Every fixture route, in match order (first hit wins). Specific paths must
 * precede their catch-all siblings — see `handlers/games.ts`.
 */
export const handlers: MockHandler[] = [
  ...gameHandlers,
  ...storefrontHandlers,
  ...contentHandlers,
  ...commerceHandlers,
  ...authHandlers,
  ...memberHandlers,
  ...walletHandlers,
  ...refundHandlers,
];

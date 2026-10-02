import { ok, paginate, strParam } from "../envelope";
import { MOCK_CHECKOUT_RESULT, MOCK_PRICE_LIST, mockInvoice } from "../data/commerce";
import { MOCK_TRANSACTIONS } from "../data/member";
import type { MockHandler } from "../types";

export const commerceHandlers: MockHandler[] = [
  {
    method: "GET",
    pattern: /^\/v1\/price-list$/,
    resolve: ({ params }) => {
      const search = strParam(params.search).toLowerCase();
      const game = strParam(params.game);

      const rows = MOCK_PRICE_LIST.filter((row) => {
        if (game && row.game_slug !== game) return false;
        if (search && !row.service_name.toLowerCase().includes(search)) return false;
        return true;
      });

      return paginate(rows, params, "/v1/price-list");
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/checkout$/,
    resolve: () => ok(MOCK_CHECKOUT_RESULT, "Pesanan berhasil dibuat."),
  },
  {
    method: "GET",
    pattern: /^\/v1\/invoices\/([^/]+)$/,
    resolve: ({ match }) => ok(mockInvoice(decodeURIComponent(match[1]))),
  },
  { method: "GET", pattern: /^\/v1\/orders\/track$/, resolve: () => ok(MOCK_TRANSACTIONS) },
];

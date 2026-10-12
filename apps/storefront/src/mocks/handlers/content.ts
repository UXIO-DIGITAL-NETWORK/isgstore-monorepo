import { ok, paginate, strParam } from "../envelope";
import { MOCK_ARTICLE_CATEGORIES, MOCK_ARTICLE_DETAILS, MOCK_ARTICLES, MOCK_FAQS, MOCK_PAGES } from "../data/content";
import type { MockHandler } from "../types";

export const contentHandlers: MockHandler[] = [
  {
    method: "GET",
    pattern: /^\/v1\/storefront\/articles$/,
    resolve: ({ params }) => {
      const category = strParam(params.category);
      const type = strParam(params.type);
      const search = strParam(params.search).toLowerCase();

      const rows = MOCK_ARTICLES.filter((article) => {
        if (category && article.category.key !== category) return false;
        if (type && article.type !== type) return false;
        if (search && !article.title.toLowerCase().includes(search)) return false;
        return true;
      });

      return paginate(rows, params, "/v1/storefront/articles");
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/storefront\/articles\/([^/]+)$/,
    resolve: ({ match }) => ok(MOCK_ARTICLE_DETAILS[decodeURIComponent(match[1])] ?? null),
  },
  { method: "GET", pattern: /^\/v1\/storefront\/article-categories$/, resolve: () => ok(MOCK_ARTICLE_CATEGORIES) },
  { method: "GET", pattern: /^\/v1\/storefront\/faqs$/, resolve: () => ok(MOCK_FAQS) },
  {
    method: "GET",
    pattern: /^\/v1\/storefront\/pages\/([^/]+)$/,
    resolve: ({ match }) => ok(MOCK_PAGES[decodeURIComponent(match[1])] ?? null),
  },
];

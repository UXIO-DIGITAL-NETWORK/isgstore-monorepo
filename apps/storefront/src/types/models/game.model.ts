/**
 * A game in the public catalog — a `categories` row on the API side.
 *
 * Mirrors `App\Http\Resources\Api\Storefront\GameResource`. Every `*_url` is
 * nullable: the API returns null rather than a broken link when artwork is
 * missing, and the storefront falls back to its bundled placeholder.
 */
export interface GameModel {
  id: number;
  name: string;
  sub_name: string | null;
  /** Publisher or server region, e.g. "Indonesia". */
  region: string | null;
  slug: string;
  code: string;
  logo_url: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  /** Two-letter tile shown when there is no artwork. */
  initials: string;
  category_type?: { id: number; name: string };
}

/** One input the game's order form asks for, as declared by the API. */
export interface OrderFormField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
  min_length: number | null;
  max_length: number | null;
  pattern: string | null;
  options: { label: string; value: string }[];
  placeholder: string | null;
  help: string | null;
}

/** `GET /v1/games/{slug}` — GameModel plus checkout-page detail. */
export interface GameDetailModel extends GameModel {
  description: string | null;
  order_form_fields: OrderFormField[];
  /** Whether the storefront should offer a "Cek Username" action for this game. */
  supports_nickname_check: boolean;
  meta: {
    title: string | null;
    description: string | null;
    keywords: string[];
    robots: string | null;
    og_image_url: string | null;
  };
}

import placeholderThumbnail from "@/assets/images/games/games_1.png";
import type { PendingOrder } from "@/store/useCheckoutStore";
import type { InvoiceModel } from "@/types/models/transaction.model";

/**
 * Adapts the API invoice into the `PendingOrder` shape the detail cards already
 * render, so wiring in live data required no changes to their markup.
 */
export function toOrder(invoice: InvoiceModel): PendingOrder {
  return {
    invoiceNumber: invoice.invoice_number,
    gameName: invoice.game?.name ?? "",
    gameRegion: invoice.game?.region ?? "",
    gameThumbnail: invoice.game?.thumbnail_url ?? invoice.game?.logo_url ?? placeholderThumbnail,
    packageLabel: invoice.product.name ?? "",
    userId: invoice.target.uid ?? "",
    serverId: invoice.target.server ?? "",
    // Empty rather than a placeholder name: games without a lookup provider
    // legitimately have no nickname, and inventing one would misinform.
    username: invoice.target.nickname ?? "",
    paymentName: invoice.payment.channel ?? "",
    price: invoice.amount.base,
    adminFee: invoice.amount.fee,
    total: invoice.amount.total,
    createdAt: Date.parse(invoice.created_at),
  };
}

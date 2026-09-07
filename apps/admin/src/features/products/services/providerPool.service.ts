import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  PoolCandidate,
  PoolCandidateListParams,
  PoolResult,
  PoolSummary,
  PromotePublishResult,
  PromoteResult,
  PublishResult,
} from "../types/product.type";

/**
 * The provider pool: which upstream SKUs are on offer, pulling them in, and
 * moving them on to a draft product and then to the storefront.
 *
 * Kept apart from `provider.service.ts` (which manages mappings that already
 * exist) because this half is about SKUs that are not ours yet — a different
 * lifecycle, a different set of endpoints.
 */
const UXIOLABS = `${API_VERSION}/uxiolabs`;
const SUPPLIER_PRODUCTS = `${API_VERSION}/supplier-products`;

interface PoolCandidateApiRow {
  buyer_sku_code: string;
  name: string;
  provider_category: string;
  mapped_category_name: string | null;
  cost: number;
  available: boolean;
  already_pooled: boolean;
  already_promoted: boolean;
  is_new: boolean;
}

export const providerPoolService = {
  /**
   * SKUs the Add panel may offer. Only categories with a Category Provider
   * mapping are returned, which is what makes adding a Category Provider the
   * act that surfaces a game's catalogue.
   */
  candidates: async (params: PoolCandidateListParams = {}): Promise<PaginatedResponse<PoolCandidate>> => {
    const response: ApiResponse<PaginatedResponse<PoolCandidateApiRow>> = await api.get(
      `${UXIOLABS}/pool-candidates`,
      { params },
    );
    // DataTable is generic over `{ id: string }`; the SKU is the natural key here.
    return unwrapPaginated(response, (row) => ({ ...row, id: row.buyer_sku_code }));
  },

  summary: async (): Promise<PoolSummary> => {
    const response: ApiResponse<PoolSummary> = await api.get(`${UXIOLABS}/pool-summary`);
    return response.data;
  },

  /** Pull SKUs into the pool. Single add is the same call with one code. */
  pool: async (buyerSkuCodes: string[]): Promise<PoolResult> => {
    const response: ApiResponse<PoolResult> = await api.post(`${UXIOLABS}/pool`, {
      buyer_sku_codes: buyerSkuCodes,
    });
    return response.data;
  },

  promote: async (id: string): Promise<void> => {
    await api.post(`${SUPPLIER_PRODUCTS}/${id}/promote`, {});
  },

  bulkPromote: async (ids: string[]): Promise<PromoteResult> => {
    const response: ApiResponse<PromoteResult> = await api.post(`${SUPPLIER_PRODUCTS}/bulk/promote`, {
      ids: ids.map(toFk),
    });
    return response.data;
  },

  publish: async (id: string): Promise<void> => {
    await api.post(`${SUPPLIER_PRODUCTS}/${id}/publish`, {});
  },

  bulkPromoteAndPublish: async (ids: string[]): Promise<PromotePublishResult> => {
    const response: ApiResponse<PromotePublishResult> = await api.post(`${SUPPLIER_PRODUCTS}/bulk/promote-publish`, {
      ids: ids.map(toFk),
    });

    return response.data;
  },

  bulkPublish: async (ids: string[]): Promise<PublishResult> => {
    const response: ApiResponse<PublishResult> = await api.post(`${SUPPLIER_PRODUCTS}/bulk/publish`, {
      ids: ids.map(toFk),
    });
    return response.data;
  },
};

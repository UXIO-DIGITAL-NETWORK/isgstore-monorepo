import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { providerPoolService } from "../services/providerPool.service";
import type { PoolCandidateListParams } from "../types/product.type";

/** Everything the pool touches, invalidated together. */
const POOL_KEYS = [["supplier-products"], ["products"], ["uxiotopup", "pool-candidates"], ["uxiotopup", "pool-summary"]];

const invalidatePool = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const queryKey of POOL_KEYS) queryClient.invalidateQueries({ queryKey });
};

export const usePoolCandidates = (params: PoolCandidateListParams, enabled = true) =>
  useQuery({
    queryKey: ["uxiotopup", "pool-candidates", params],
    queryFn: () => providerPoolService.candidates(params),
    enabled,
  });

export const usePoolSummary = () =>
  useQuery({
    queryKey: ["uxiotopup", "pool-summary"],
    queryFn: () => providerPoolService.summary(),
  });

export const usePoolSkus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (buyerSkuCodes: string[]) => providerPoolService.pool(buyerSkuCodes),
    onSuccess: (result) => {
      invalidatePool(queryClient);
      // Report the skips: pooling is per-row resilient, so a partial success is
      // the normal outcome and silently showing only the total would mislead.
      if (result.skipped.length > 0) {
        toast.warning(`${result.pooled} added to the pool, ${result.skipped.length} skipped`, {
          description: result.skipped[0]?.reason,
        });
        return;
      }
      toast.success(`${result.pooled} added to the pool`);
    },
    onError: () => {
      toast.error("Failed to add SKUs to the pool");
    },
  });
};

export const usePromoteProviderProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => providerPoolService.bulkPromote(ids),
    onSuccess: (result) => {
      invalidatePool(queryClient);
      if (result.skipped.length > 0) {
        toast.warning(`${result.promoted} promoted, ${result.skipped.length} skipped`, {
          description: result.skipped[0]?.reason,
        });
        return;
      }
      toast.success(`${result.promoted} promoted to draft products`);
    },
    onError: () => {
      toast.error("Failed to promote");
    },
  });
};

/**
 * Promote and publish in one call — the pool's onboarding path.
 *
 * `promoted` and `published` can differ: a SKU the provider has switched off
 * becomes a draft product but does not go on sale. Saying so beats a bare
 * success count that quietly overstates what happened.
 */
export const usePromoteAndPublishProviderProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => providerPoolService.bulkPromoteAndPublish(ids),
    onSuccess: (result) => {
      invalidatePool(queryClient);

      if (result.skipped.length > 0) {
        toast.warning(`${result.published} published, ${result.skipped.length} skipped`, {
          description: result.skipped[0]?.reason,
        });
        return;
      }

      toast.success(`${result.published} promoted and published`);
    },
    onError: () => toast.error("Failed to promote and publish"),
  });
};

export const usePublishProviderProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => providerPoolService.bulkPublish(ids),
    onSuccess: (result) => {
      invalidatePool(queryClient);
      if (result.skipped.length > 0) {
        toast.warning(`${result.published} published, ${result.skipped.length} skipped`, {
          description: result.skipped[0]?.reason,
        });
        return;
      }
      toast.success(`${result.published} published`);
    },
    onError: () => {
      toast.error("Failed to publish");
    },
  });
};

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { checkoutService } from "../services/checkout.service";
import {
  toCategoryTabs,
  toDiamondPackages,
  toGameInfo,
  toMemberCredits,
  toPaymentGroups,
  toReviews,
} from "../lib/mappers";

const VALIDATE_DEBOUNCE_MS = 500;
/** Below this, an id is still being typed and lookups are just noise. */
const MIN_VALIDATABLE_ID_LENGTH = 4;

export const useGameQuery = (slug: string) =>
  useQuery({
    queryKey: ["checkout", "game", slug],
    queryFn: async () => {
      const response = await checkoutService.game(slug);
      return { detail: response.data, info: toGameInfo(response.data) };
    },
    enabled: Boolean(slug),
  });

export const useGameProductsQuery = (slug: string) => {
  // Prices are role-resolved server-side, so the cached list belongs to whoever
  // was signed in when it was fetched. Keying on the user forces a refetch on
  // login/logout instead of showing a member the guest price.
  const userId = useAuthStore((state) => state.user?.id ?? null);

  return useQuery({
    queryKey: ["checkout", "products", slug, userId],
    queryFn: async () => {
      const response = await checkoutService.products(slug);
      return {
        packages: toDiamondPackages(response.data),
        categories: toCategoryTabs(response.data),
      };
    },
    enabled: Boolean(slug),
  });
};

export const usePaymentChannelsQuery = () => {
  const userId = useAuthStore((state) => state.user?.id ?? null);

  return useQuery({
    // Same reason as above: the `balance` channel only exists for a member.
    queryKey: ["checkout", "payment-channels", userId],
    queryFn: async () => {
      const response = await checkoutService.paymentChannels();
      return {
        groups: toPaymentGroups(response.data.channels),
        memberCredits: toMemberCredits(response.data.channels),
        // Global admin markup, so the summary can show the same total the
        // backend will charge before checkout is submitted.
        adminFee: response.data.admin_fee,
      };
    },
  });
};

export const useGameReviewsQuery = (slug: string) =>
  useQuery({
    queryKey: ["checkout", "reviews", slug],
    queryFn: async () => {
      const response = await checkoutService.reviews(slug);
      return { summary: response.data.summary, reviews: toReviews(response.data) };
    },
    enabled: Boolean(slug),
  });

/**
 * Nickname lookup for the entered game id.
 *
 * Debounced so a lookup fires when typing pauses, not per keystroke. Never
 * blocks checkout: a game with no provider, or a provider that is down,
 * resolves to `nickname: null` and the UI simply omits the line.
 */
export const useValidateGameIdQuery = (slug: string, userId: string, serverId: string) => {
  const debouncedUserId = useDebouncedValue(userId.trim(), VALIDATE_DEBOUNCE_MS);
  const debouncedServerId = useDebouncedValue(serverId.trim(), VALIDATE_DEBOUNCE_MS);

  return useQuery({
    queryKey: ["checkout", "validate-id", slug, debouncedUserId, debouncedServerId],
    queryFn: async () => {
      const response = await checkoutService.validateGameId(slug, {
        target_uid: debouncedUserId,
        target_server: debouncedServerId || undefined,
      });
      return response.data;
    },
    enabled: Boolean(slug) && debouncedUserId.length >= MIN_VALIDATABLE_ID_LENGTH,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCheckoutMutation = () =>
  useMutation({
    mutationFn: checkoutService.checkout,
  });

import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bannersService, type BannerInput } from "../services/banners.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "banners";

export const useBannerList = (params: ContentListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => bannersService.list(params) });

export const useBanner = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => bannersService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateBanner = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BannerInput) => bannersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("bannerCreated"));
    },
    onError: () => toast.error(t("bannerCreateFailed")),
  });
};

export const useUpdateBanner = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BannerInput> }) => bannersService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("bannerUpdated"));
    },
    onError: () => toast.error(t("bannerUpdateFailed")),
  });
};

/** One mutation for both delete paths — row menu and bulk toolbar. */
export const useDeleteBanners = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => bannersService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Banner deleted" : `${ids.length} banners deleted`);
    },
    onError: () => toast.error(t("bannerDeleteFailed")),
  });
};

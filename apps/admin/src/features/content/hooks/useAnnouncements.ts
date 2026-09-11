import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { announcementsService, type AnnouncementInput } from "../services/banners.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "announcements";

export const useAnnouncementList = (params: ContentListParams) =>
  useQuery({ queryKey: [KEY, "list", params], queryFn: () => announcementsService.list(params) });

export const useAnnouncement = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => announcementsService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateAnnouncement = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AnnouncementInput) => announcementsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("announcementCreated"));
    },
    onError: () => toast.error(t("announcementCreateFailed")),
  });
};

export const useUpdateAnnouncement = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AnnouncementInput> }) => announcementsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("announcementUpdated"));
    },
    onError: () => toast.error(t("announcementUpdateFailed")),
  });
};

/** One mutation for both delete paths — row menu and bulk toolbar. */
export const useDeleteAnnouncements = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => announcementsService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Announcement deleted" : `${ids.length} announcements deleted`);
    },
    onError: () => toast.error(t("announcementDeleteFailed")),
  });
};

import { createFileRoute } from "@tanstack/react-router";
import { BannerListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/banners/")({
  component: BannerListPage,
});

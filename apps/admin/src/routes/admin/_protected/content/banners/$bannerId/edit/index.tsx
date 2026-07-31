import { createFileRoute } from "@tanstack/react-router";
import { BannerFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/banners/$bannerId/edit/")({
  component: BannerFormPage,
});

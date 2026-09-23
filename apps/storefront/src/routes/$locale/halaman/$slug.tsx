import { createFileRoute } from "@tanstack/react-router";
import { StaticPagePage } from "@/features/static-page";

export const Route = createFileRoute("/$locale/halaman/$slug")({
  component: StaticPagePage,
});

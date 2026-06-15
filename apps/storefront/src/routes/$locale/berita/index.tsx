import { createFileRoute } from "@tanstack/react-router";
import { BeritaPage } from "@/features/berita";

export const Route = createFileRoute("/$locale/berita/")({
  component: BeritaPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { TrackOrderPage } from "@/features/track-order";

export const Route = createFileRoute("/$locale/cek-pesanan/")({
  component: TrackOrderPage,
});

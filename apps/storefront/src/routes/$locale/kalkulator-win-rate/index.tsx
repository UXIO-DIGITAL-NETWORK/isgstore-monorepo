import { createFileRoute } from "@tanstack/react-router";
import { KalkulatorPage } from "@/features/kalkulator";

export const Route = createFileRoute("/$locale/kalkulator-win-rate/")({
  component: KalkulatorPage,
});

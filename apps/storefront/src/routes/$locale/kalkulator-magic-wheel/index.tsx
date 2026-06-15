import { createFileRoute } from "@tanstack/react-router";
import { MagicWheelPage } from "@/features/magic-wheel";

export const Route = createFileRoute("/$locale/kalkulator-magic-wheel/")({
  component: MagicWheelPage,
});

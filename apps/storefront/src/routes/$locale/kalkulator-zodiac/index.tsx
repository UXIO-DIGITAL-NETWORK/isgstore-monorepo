import { createFileRoute } from "@tanstack/react-router";
import { ZodiacPage } from "@/features/zodiac";

export const Route = createFileRoute("/$locale/kalkulator-zodiac/")({
  component: ZodiacPage,
});

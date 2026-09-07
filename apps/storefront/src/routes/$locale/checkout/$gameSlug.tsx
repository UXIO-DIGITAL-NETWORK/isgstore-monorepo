import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/features/checkout";

export const Route = createFileRoute("/$locale/checkout/$gameSlug")({
  component: CheckoutPage,
});

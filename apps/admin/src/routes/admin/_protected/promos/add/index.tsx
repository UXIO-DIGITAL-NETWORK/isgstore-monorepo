import { createFileRoute } from "@tanstack/react-router";
import { PromoFormPage } from "@/features/marketing";

export const Route = createFileRoute("/admin/_protected/promos/add/")({
  component: PromoFormPage,
});

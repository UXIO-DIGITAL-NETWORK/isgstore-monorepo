import { createFileRoute } from "@tanstack/react-router";
import { FlashSaleFormPage } from "@/features/marketing";

export const Route = createFileRoute("/admin/_protected/flash-sales/$flashSaleId/edit/")({
  component: FlashSaleFormPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { MainProductAddBulkPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/main/add-bulk/")({
  component: MainProductAddBulkPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { AddMainProductPage } from "@/features/products";

export const Route = createFileRoute("/admin/_preview/products-preview/main/add/")({
  component: AddMainProductPage,
});

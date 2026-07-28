import { createFileRoute } from "@tanstack/react-router";
import { AddMainProductPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/main/add/")({
  component: AddMainProductPage,
});

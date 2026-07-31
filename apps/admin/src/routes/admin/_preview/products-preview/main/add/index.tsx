import { createFileRoute } from "@tanstack/react-router";
import { MainProductFormPage } from "@/features/products";

export const Route = createFileRoute("/admin/_preview/products-preview/main/add/")({
  component: MainProductFormPage,
});

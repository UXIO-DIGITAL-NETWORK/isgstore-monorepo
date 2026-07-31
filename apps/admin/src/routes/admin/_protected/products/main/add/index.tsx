import { createFileRoute } from "@tanstack/react-router";
import { MainProductFormPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/main/add/")({
  component: MainProductFormPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { TestimonialListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/testimonials/")({
  component: TestimonialListPage,
});

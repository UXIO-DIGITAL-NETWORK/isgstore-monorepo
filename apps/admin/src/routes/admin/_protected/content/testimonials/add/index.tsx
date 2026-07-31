import { createFileRoute } from "@tanstack/react-router";
import { TestimonialFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/testimonials/add/")({
  component: TestimonialFormPage,
});

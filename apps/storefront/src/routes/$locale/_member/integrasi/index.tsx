import { createFileRoute } from "@tanstack/react-router";
import IntegrasiPage from "@/features/member-dashboard/pages/IntegrasiPage";

export const Route = createFileRoute("/$locale/_member/integrasi/")({
  component: IntegrasiPage,
});

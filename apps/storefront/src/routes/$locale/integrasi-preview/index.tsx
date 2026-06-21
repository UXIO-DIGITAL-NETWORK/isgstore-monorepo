import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import IntegrasiPage from "@/features/member-dashboard/pages/IntegrasiPage";

function IntegrasiPreview() {
  return (
    <MemberLayout>
      <IntegrasiPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/integrasi-preview/")({
  component: IntegrasiPreview,
});

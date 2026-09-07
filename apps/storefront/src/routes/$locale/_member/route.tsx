import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import { requireAuth } from "@/middlewares/auth.guard";

export const Route = createFileRoute("/$locale/_member")({
  beforeLoad: ({ params }) => requireAuth({ role: "member", locale: params.locale }),
  component: MemberLayout,
});

import { createFileRoute } from "@tanstack/react-router";
import MemberRefundsPage from "@/features/member-dashboard/pages/MemberRefundsPage";

export const Route = createFileRoute("/$locale/_member/pengembalian-dana/")({
  component: MemberRefundsPage,
});

import { createFileRoute } from "@tanstack/react-router";
import IsiSaldoPage from "@/features/member-dashboard/pages/IsiSaldoPage";

export const Route = createFileRoute("/$locale/_member/isi-saldo/")({
  component: IsiSaldoPage,
});

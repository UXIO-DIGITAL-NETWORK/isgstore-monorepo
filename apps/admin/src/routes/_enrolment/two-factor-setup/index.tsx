import { createFileRoute } from "@tanstack/react-router";
import { TwoFactorEnrolmentPage } from "@/features/auth";

export const Route = createFileRoute("/_enrolment/two-factor-setup/")({
  component: TwoFactorEnrolmentPage,
});

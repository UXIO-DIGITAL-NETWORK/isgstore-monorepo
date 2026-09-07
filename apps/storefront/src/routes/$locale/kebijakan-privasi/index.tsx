import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyPage } from "@/features/privacy-policy";

export const Route = createFileRoute("/$locale/kebijakan-privasi/")({
  component: PrivacyPolicyPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/features/auth";

export const Route = createFileRoute("/$locale/_auth/register/")({
  component: RegisterPage,
});

import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "@/components/layouts/RootLayout";
import { NotFoundPage, ServerErrorPage } from "@/components/common/ErrorPages";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ServerErrorPage,
});

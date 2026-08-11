import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "@/components/layouts/RootLayout";
import { StatusPage } from "@/components/common/StatusPage";

const notFoundCopy = {
  illustrationSrc: "/illustrations/page-not-found.svg",
  illustrationAlt: "Illustration of a page not found",
  illustrationWidth: 320,
  illustrationHeight: 212,
  title: "Oops!",
  subtitle: "Page not found",
  body: "The page you're looking for isn't found. We suggest going back to the home page.",
  actionLabel: "Back to home page",
};

const serverErrorCopy = {
  illustrationSrc: "/illustrations/server-error.svg",
  illustrationAlt: "Illustration of a server error",
  illustrationWidth: 320,
  illustrationHeight: 248,
  code: "503",
  title: "Oops!",
  subtitle: "Something went wrong on our end",
  body: "We're working to fix the issue. Please try again in a few minutes.",
  actionLabel: "Back to home page",
};

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <StatusPage {...notFoundCopy} />,
  errorComponent: () => <StatusPage {...serverErrorCopy} />,
});

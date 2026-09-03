import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";
import { Box } from "@/components/common/Box";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { SiteHead } from "@/components/shared/SiteHead";

export function RootLayout(): React.JSX.Element {
  return (
    <Box className="min-h-screen bg-[#0A0A0C] font-inter text-white">
      {/* Head tags and the maintenance flag both come from the same public
          settings query, which is cached — mounting them here costs one request
          for the whole app. */}
      <SiteHead />
      <MaintenanceGate>
        <Outlet />
      </MaintenanceGate>
      {/* Mounted once at the root so any feature can report an API failure
          without adding a provider of its own. Themed to the dark surface —
          sonner's default light toast would be jarring on this palette. */}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "!bg-[#0D1117] !border !border-white/10 !text-white !font-inter",
            error: "!border-red-500/40",
            success: "!border-[#C084FC]/40",
          },
        }}
      />
      <TanStackRouterDevtools initialIsOpen={false} />
    </Box>
  );
}

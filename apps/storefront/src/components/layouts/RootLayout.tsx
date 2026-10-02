import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Box } from "@/components/common/Box";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { SiteClosedGate } from "@/components/shared/SiteClosedGate";
import { SiteHead } from "@/components/shared/SiteHead";

export function RootLayout(): React.JSX.Element {
  return (
    <Box className="min-h-screen bg-[rgb(0,0,0)] font-inter text-white">
      {/* Head tags and the maintenance flag both come from the same public
          settings query, which is cached — mounting them here costs one request
          for the whole app. */}
      <SiteHead />
      {/* Two gates, deliberately not merged. Maintenance is the operator's own
          flag and fails open; SiteClosedGate reflects the server refusing every
          public request because the Hub switched this deployment off. It sits
          outside, because when it is up nothing behind it can load anyway. */}
      <SiteClosedGate>
        <MaintenanceGate>
          <Outlet />
        </MaintenanceGate>
      </SiteClosedGate>
      {/* Mounted once at the root so any feature can report an API failure
          without adding a provider of its own. Themed to the dark surface —
          sonner's default light toast would be jarring on this palette. */}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "!bg-[rgb(14,20,10)] !border !border-white/10 !text-white !font-inter",
            error: "!border-red-500/40",
            success: "!border-[rgb(208,201,129)]/40",
          },
        }}
      />
    </Box>
  );
}

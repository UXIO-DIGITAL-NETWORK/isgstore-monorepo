import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Box } from "@/components/common/Box";

export function RootLayout() {
  return (
    <Box className="min-h-screen bg-slate-50 font-sans">
      <Outlet />

      <TanStackRouterDevtools initialIsOpen={false} />
    </Box>
  );
}

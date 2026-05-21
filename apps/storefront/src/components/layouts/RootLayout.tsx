import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Box } from "@/components/common/Box";

export function RootLayout(): React.JSX.Element {
  return (
    <Box className="min-h-screen bg-[#0A0A0C] font-inter text-white">
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={false} />
    </Box>
  );
}

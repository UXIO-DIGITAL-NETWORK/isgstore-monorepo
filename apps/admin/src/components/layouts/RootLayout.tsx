import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";

export function RootLayout() {
  return (
    <Box className="min-h-svh bg-background font-sans">
      <Outlet />
    </Box>
  );
}

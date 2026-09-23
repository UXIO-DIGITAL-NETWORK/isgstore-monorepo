import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";

export function RootLayout() {
  return (
    <Box className="min-h-screen bg-slate-50 font-sans">
      <Outlet />
    </Box>
  );
}

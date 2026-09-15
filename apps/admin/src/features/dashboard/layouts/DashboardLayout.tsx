import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { DashboardNavbar } from "../components/DashboardNavbar";

export function DashboardLayout() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <SidebarInset className="min-w-0">
        <DashboardNavbar />
        <Box
          as="main"
          className="min-w-0 flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}

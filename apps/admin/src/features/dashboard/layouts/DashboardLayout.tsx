import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { DashboardNavbar } from "../components/DashboardNavbar";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardNavbar />
        <Box
          as="main"
          className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}

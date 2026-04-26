import { Search, Plus, Bell, History } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardNavbar() {
  return (
    <Box
      as="header"
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-white px-4 lg:px-6"
    >
      <Box className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="-ml-1" />
        <form className="hidden sm:block flex-1 max-w-sm">
          <Box className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search anything...   HK"
              className="w-[280px] rounded-full bg-slate-100/80 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-xs"
            />
          </Box>
        </form>
      </Box>

      <Box className="flex items-center gap-4">
        <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4">
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Order
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-slate-100">
          <History className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500 border border-white" />
        </Button>
        <Avatar className="h-8 w-8 bg-blue-600 text-white rounded-full cursor-pointer">
          <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">AS</AvatarFallback>
        </Avatar>
      </Box>
    </Box>
  );
}

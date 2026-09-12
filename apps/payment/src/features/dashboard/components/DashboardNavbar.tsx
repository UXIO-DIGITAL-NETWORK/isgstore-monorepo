import { ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Text } from "@/components/common/Text";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { initials } from "@/utils/initials";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationBell } from "@/features/finance";

export function DashboardNavbar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    navigate({ to: "/login" });
  };

  return (
    <Box
      as="header"
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6"
    >
      <Box className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </Box>

      <Box className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />

        {/* Ungated: the feed is scoped to the caller by the API, and a client
            now has notifications of their own — their subscription lapsing is
            their bill, not ours. */}
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 h-auto items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Avatar size="sm">
                <AvatarFallback>{user ? initials(user.name) : ""}</AvatarFallback>
              </Avatar>
              <Box className="hidden flex-col items-start text-left sm:flex">
                <Text
                  as="span"
                  className="text-sm leading-tight font-medium text-foreground"
                >
                  {user?.name}
                </Text>
                <Text
                  as="span"
                  className="text-xs leading-tight text-muted-foreground"
                >
                  {user?.email}
                </Text>
              </Box>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
            >
              <LogOut className="mr-2 size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Box>
    </Box>
  );
}

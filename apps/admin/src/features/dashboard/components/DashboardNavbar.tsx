import { Bell, ChevronDown, HelpCircle, LogOut, Zap } from "lucide-react";
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
import { useAuthStore } from "@/store/useAuthStore";
import { useOperator } from "../hooks/useDashboard";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function DashboardNavbar() {
  const { data: operator } = useOperator();
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
        <Text
          as="span"
          className="text-sm font-medium text-foreground"
        >
          Dashboard
        </Text>
      </Box>

      <Box className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <HelpCircle className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Help
          </Text>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <Zap className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Quick actions
          </Text>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <Bell className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Notifications
          </Text>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 h-auto items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Avatar size="sm">
                <AvatarFallback>{operator ? getInitials(operator.name) : ""}</AvatarFallback>
              </Avatar>
              <Box className="hidden flex-col items-start text-left sm:flex">
                <Text
                  as="span"
                  className="text-sm leading-tight font-medium text-foreground"
                >
                  {operator?.name}
                </Text>
                <Text
                  as="span"
                  className="text-xs leading-tight text-muted-foreground"
                >
                  {operator?.email}
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

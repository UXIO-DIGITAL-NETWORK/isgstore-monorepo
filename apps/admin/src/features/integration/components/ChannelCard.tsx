import { Eye, MoreVertical, Pencil, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/currency";
import type { IntegrationChannel } from "../types/integration.type";

interface ChannelCardProps {
  channel: IntegrationChannel;
}

// Row-menu items are inferred, not confirmed by any reference (no reference
// shows the menu open) — a sensible default: re-check connectivity now,
// edit the connection's config, or view its full detail. No API this phase,
// so each action is a toast stub rather than a real mutation.
export function ChannelCard({ channel }: ChannelCardProps) {
  const isConnected = channel.connection_status === "connected";

  return (
    <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <Box className="flex flex-col gap-3">
        {channel.logo_url ? (
          <Image
            src={channel.logo_url}
            alt={channel.name}
            width={88}
            height={56}
            className="shrink-0 rounded-lg"
          />
        ) : (
          <Box
            aria-hidden="true"
            className="h-14 w-22 shrink-0 rounded-lg bg-muted"
          />
        )}
        <Box className="flex flex-col gap-0.5">
          <Heading
            level={3}
            variant="default"
            className="text-lg md:text-lg"
          >
            {channel.name}
          </Heading>
          {channel.currency_config ? <Text variant="muted">{channel.currency_config}</Text> : null}
        </Box>
      </Box>

      <Box className="flex items-center justify-between gap-2">
        <Box className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isConnected
                ? "border-success/20 bg-success/10 text-success"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }
          >
            {isConnected ? <Wifi /> : <WifiOff />}
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          {channel.balance !== undefined ? (
            <Badge
              variant="outline"
              className="border-border text-foreground tabular-nums"
            >
              {formatCurrency(channel.balance, { fractionDigits: 0 })}
            </Badge>
          ) : null}
        </Box>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
            >
              <MoreVertical className="size-4" />
              <Text
                as="span"
                className="sr-only"
              >
                {`Actions for ${channel.name}`}
              </Text>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info(`Pinging ${channel.name}...`)}>
              <RefreshCw /> Ping / refresh now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info(`Edit connection for ${channel.name}`)}>
              <Pencil /> Edit connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${channel.name}`)}>
              <Eye /> View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Box>
    </Box>
  );
}

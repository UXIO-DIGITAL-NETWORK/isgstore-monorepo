import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/utils/date";
import { useActivityLog } from "../hooks/useDashboard";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function ActivityFeedCard() {
  const { data, isLoading, isError, refetch } = useActivityLog();

  return (
    <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <Box className="flex items-center justify-between">
        <Heading
          level={3}
          variant="section"
          className="text-lg"
        >
          Recent Log Activity
        </Heading>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground"
        >
          Show More
        </Button>
      </Box>

      <Box className="flex flex-col gap-4">
        {isError ? (
          <Box className="flex flex-col items-start gap-2">
            <Text variant="muted">Failed to load recent activity.</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </Box>
        ) : isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-10 w-full"
            />
          ))
        ) : (
          data.map((entry) => (
            <Box
              key={entry.id}
              className="flex items-center gap-3"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(entry.actor)}</AvatarFallback>
              </Avatar>
              <Box className="flex flex-1 flex-col">
                <Text
                  as="span"
                  className="text-sm font-medium text-foreground"
                >
                  {entry.action}
                </Text>
                <Text variant="small">{`By ${entry.actor} as ${entry.role}`}</Text>
              </Box>
              <Text
                as="span"
                variant="small"
                className="shrink-0 tabular-nums"
              >
                {formatRelativeTime(entry.timestamp)}
              </Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

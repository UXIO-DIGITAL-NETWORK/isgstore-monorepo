import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

export function TeamMembersList() {
  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <Text className="text-sm text-muted-foreground">Invite your team members to collaborate.</Text>
      </CardHeader>
      <CardContent className="space-y-6">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="@shadcn"
              />
              <AvatarFallback>DK</AvatarFallback>
            </Avatar>
            <Box>
              <Text className="text-sm font-medium leading-none">Dale Komen</Text>
              <Text className="text-sm text-muted-foreground mt-1">dale@example.com</Text>
            </Box>
          </Box>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-1"
          >
            Member
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Box>

        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
            <Box>
              <Text className="text-sm font-medium leading-none">Sofia Davis</Text>
              <Text className="text-sm text-muted-foreground mt-1">m@example.com</Text>
            </Box>
          </Box>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-1"
          >
            Owner
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Box>

        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Box>
              <Text className="text-sm font-medium leading-none">Jackson Davis</Text>
              <Text className="text-sm text-muted-foreground mt-1">p@example.com</Text>
            </Box>
          </Box>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-1"
          >
            Member
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

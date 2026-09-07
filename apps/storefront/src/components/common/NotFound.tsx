import { Box } from "@/components/common/Box";
import { Container } from "@/components/common/Container";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { Ghost } from "lucide-react";

export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Box className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Container className="flex w-full flex-col items-center justify-center text-center">
        <Box className="mb-8 flex h-32 w-32 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 shadow-2xl">
          <Ghost className="h-16 w-16 animate-pulse text-neutral-500" />
        </Box>
        
        <Heading className="mb-4 text-6xl font-extrabold tracking-tight text-white md:text-8xl">
          404
        </Heading>
        
        <Heading className="mb-6 text-2xl font-bold text-neutral-300 md:text-3xl tracking-tight">
          Oops! This page went AFK or got lost in the void.
        </Heading>
        
        <Text className="mb-10 max-w-lg text-lg text-neutral-500">
          The base you are trying to reach has either been destroyed by the enemy or never existed in the current server instance.
        </Text>
        
        <Button 
          onPress={() => navigate({ to: "/" })}
          className="h-14 rounded-full bg-sky-500 px-10 text-lg font-bold text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all hover:bg-sky-600 hover:shadow-[0_0_30px_rgba(14,165,233,0.6)]"
        >
          Return to Base
        </Button>
      </Container>
    </Box>
  );
};

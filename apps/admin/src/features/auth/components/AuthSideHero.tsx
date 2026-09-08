import { Gem } from "lucide-react";
import { Link } from "@/components/common/Link";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";

export function AuthSideHero() {
  return (
    <Box className="hidden lg:flex w-[60%] flex-col relative px-16 py-12 justify-center text-white overflow-hidden bg-radial-[at_top_left] from-black via-neutral-800 to-white">
      <Link
        href="/"
        className="absolute top-12 left-16 flex items-center space-x-3"
      >
        <Gem className="w-8 h-8 text-white drop-shadow-md" />
        <Box>
          <Text className="text-xl text-white font-bold tracking-tight drop-shadow-md">ISG Store Admin</Text>
          <Text className="text-xs text-slate-300 tracking-wide">UXIOLABS</Text>
        </Box>
      </Link>

      <Box className="relative z-10 w-full max-w-2xl mt-8">
        <Box className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 mb-8 border border-white/10 shadow-sm">
          <Box className="w-2.5 h-2.5 rounded-full bg-white"></Box>
          <Text className="text-xs font-semibold tracking-wide text-slate-300">Internal Operations</Text>
        </Box>

        <Heading
          level={1}
          className="text-[64px] leading-[1.05] text-white font-extrabold tracking-tight mb-8"
        >
          Manage the ISG Store top-up platform.
        </Heading>

        <Text className="text-[17px] font-medium text-slate-300 leading-relaxed max-w-md mb-8">
          Sign in to monitor transactions, oversee finances, and manage top-up operations across every game.
        </Text>
      </Box>

      <Box className="absolute bottom-12 left-16">
        <Text className="text-white text-xs font-medium font-mono tracking-wide">
          © 2026 ISG Store. Internal use only.
        </Text>
      </Box>
    </Box>
  );
}

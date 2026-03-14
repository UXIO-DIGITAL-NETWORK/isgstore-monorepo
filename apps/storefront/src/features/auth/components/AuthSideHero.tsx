import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";

export function AuthSideHero() {
  return (
    <Box className="hidden lg:flex w-[60%] flex-col relative px-16 py-12 justify-center text-white overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-blue-950">
      <Box className="absolute top-12 left-16 flex items-center space-x-3">
        <Zap className="w-8 h-8 text-blue-400 drop-shadow-md" />
        <Link to="/">
          <Text className="text-xl text-white font-bold tracking-tight drop-shadow-md">React Enterprise</Text>
        </Link>
      </Box>

      <Box className="relative z-10 w-full max-w-2xl mt-8">
        <Box className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 mb-8 border border-white/10 shadow-sm">
          <Box className="w-2.5 h-2.5 rounded-full bg-blue-500"></Box>
          <Text className="text-xs font-semibold tracking-wide text-slate-300">Boilerplate React Skala Enterprise</Text>
        </Box>

        <Heading
          level={1}
          className="text-[64px] leading-[1.05] text-white font-extrabold tracking-tight mb-8"
        >
          Bangun Aplikasi Lebih Cepat
          <Box as="br" />
          <Text
            as="span"
            className="text-blue-400 text-[64px] font-extrabold"
          >
            Skalabilitas Tanpa Batas.
          </Text>
        </Heading>

        <Text className="text-[17px] font-medium text-slate-300 leading-relaxed max-w-md mb-8">
          Fondasi yang kuat, type-safe, dan performa tinggi untuk proyek React Anda berikutnya.
        </Text>
      </Box>

      <Box className="absolute bottom-12 left-16">
        <Text className="text-slate-500 text-xs font-medium font-mono tracking-wide">
          © 2026 React Enterprise Boilerplate.
        </Text>
      </Box>
    </Box>
  );
}

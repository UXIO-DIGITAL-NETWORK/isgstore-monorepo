import React from "react";
import { ShieldCheck, Zap, Headphones, CheckCircle } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import FeatureCard from "./fragments/FeatureCard";

export default function Keunggulan(): React.JSX.Element {
  return (
    <Box as="section" className="w-full py-16 md:py-20">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section heading — centered, flanking bars on both sides */}
        <Box className="flex flex-col items-center gap-3 mb-16">
          <Box className="flex flex-wrap items-center justify-center gap-4">
            <Box className="w-8 h-0.5 rounded-full bg-[#3B82F6] shrink-0 hidden sm:block" />
            <Heading
              as="h2"
              level={3}
              className="font-outfit font-bold text-[22px] md:text-[28px] leading-7 tracking-[-0.5px] text-white uppercase text-center"
            >
              Keunggulan Layanan Kami
            </Heading>
            <Box className="w-8 h-0.5 rounded-full bg-[#3B82F6] shrink-0 hidden sm:block" />
          </Box>
          <Text as="p" className="font-inter font-normal text-[15px] leading-5 text-[#697282]">
            Solusi top up cepat, aman, dan praktis dalam satu platform.
          </Text>
        </Box>

        {/* 3-column feature grid */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Column 1 — Pembayaran Aman */}
          <FeatureCard
            iconBg="bg-[#0C1929]"
            icon={<ShieldCheck className="w-10 h-10 text-[#3B82F6]" />}
            title="Pembayaran Aman"
            description="Kami menggunakan sistem enkripsi berstandar tinggi untuk memastikan setiap transaksi selalu terlindungi."
          >
            <Box className="flex flex-col items-center gap-2">
              <Box className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <Text as="span" className="font-inter font-medium text-[13px] text-[#3B82F6] leading-snug">
                  Terlindungi standar keamanan PCI DSS
                </Text>
              </Box>
              <Box className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <Text as="span" className="font-inter font-medium text-[13px] text-[#3B82F6] leading-snug">
                  Sistem pencegahan fraud aktif
                </Text>
              </Box>
            </Box>
          </FeatureCard>

          {/* Column 2 — Pengiriman Instan */}
          <FeatureCard
            iconBg="bg-[#160B2E]"
            icon={<Zap className="w-10 h-10 text-[#9333EA]" />}
            title="Pengiriman Instan"
            description="Tidak perlu menunggu. Sistem otomatis kami memproses dan mengirimkan top up dalam hitungan detik."
          >
            <Box className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/5 border border-white/20 backdrop-blur-sm">
              <CheckCircle className="w-3 h-3 text-white/50 shrink-0" />
              <Text as="span" className="font-outfit font-bold text-[12px] text-white uppercase tracking-widest leading-none">
                Sistem Otomatis Aktif
              </Text>
            </Box>
          </FeatureCard>

          {/* Column 3 — 24/7 Support */}
          <FeatureCard
            iconBg="bg-[#0B1120]"
            icon={<Headphones className="w-10 h-10 text-white/50" />}
            title="24/7 Support"
            description="Tim support kami siap membantu Anda kapan saja melalui live chat atau WhatsApp."
          >
            <Text
              as="span"
              className="font-outfit font-bold text-[13px] text-[#3B82F6] uppercase tracking-[0.18em] cursor-pointer hover:text-[#60A5FA] transition-colors"
            >
              Hubungi Admin
            </Text>
          </FeatureCard>

        </Box>
      </Box>
    </Box>
  );
}

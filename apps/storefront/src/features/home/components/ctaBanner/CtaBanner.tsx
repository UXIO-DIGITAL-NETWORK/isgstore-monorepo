import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import ctaBg from "@/assets/images/CTA/CTA_1.png";
import ctaMascot from "@/assets/images/CTA/CTA_2.png";

export default function CtaBanner(): React.JSX.Element {
  return (
    <Box as="section" className="relative w-full h-135.25 overflow-hidden">

      {/* Layer 1 — Full-bleed background */}
      <Image
        src={ctaBg}
        alt=""
        aria-hidden
        priority="eager"
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />

      {/* Layer 2 — Mascot: anchored to section right edge, bottom-aligned */}
      <Image
        src={ctaMascot}
        alt="Maskot UDN"
        priority="eager"
        objectFit="contain"
        className="absolute right-0 bottom-0 w-150 h-full"
      />

      {/* Max-width content container — same bounds as other sections */}
      <Box className="relative h-full max-w-6xl mx-auto px-4 md:px-8">

        {/* Layer 3 — Text + CTA: left side, vertically centered */}
        <Box className="h-full flex items-center">
          <Box className="flex flex-col gap-6 max-w-150">
            <Heading
              as="h2"
              level={1}
              className="font-outfit font-bold text-[52px] leading-[1.1] tracking-[-1.5px] text-white"
            >
              Buat Akun &amp; Nikmati Lebih Banyak Keuntungan
            </Heading>

            <Text
              as="p"
              className="font-inter font-normal text-[16px] leading-[1.6] text-white/60"
            >
              Dapatkan harga lebih hemat, riwayat transaksi, dan proses top up yang lebih cepat dalam satu akun.
            </Text>

            <Box className="flex items-center gap-4">
              <Box
                as="button"
                type="button"
                className="h-16.5 px-10 rounded-full bg-white font-inter font-bold text-[18px] text-[#0A0A0C] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Daftar Sekarang
              </Box>
              <Box
                as="button"
                type="button"
                className="h-16.5 px-8 rounded-full bg-white/10 border border-white/30 font-inter font-bold text-[18px] text-white backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-colors whitespace-nowrap"
              >
                Masuk
              </Box>
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

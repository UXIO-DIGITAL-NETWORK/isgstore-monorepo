import React from "react";
import { ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { ARTIKEL_TERBARU } from "@/features/home/data/artikel.data";
import ArticleCard from "./fragments/ArticleCard";

export default function ArtikelTerbaru(): React.JSX.Element {
  return (
    <Box as="section" className="w-full py-16 md:py-20">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section heading */}
        <Box className="flex flex-col items-center gap-3 mb-12">
          <Box className="flex items-center gap-4">
            <Box className="w-8 h-0.5 rounded-full bg-[#3B82F6] shrink-0" />
            <Heading
              as="h2"
              level={3}
              className="font-outfit font-bold text-[28px] leading-7 tracking-[-0.5px] text-white uppercase"
            >
              Artikel Terbaru Seputar Game
            </Heading>
            <Box className="w-8 h-0.5 rounded-full bg-[#3B82F6] shrink-0" />
          </Box>
          <Text as="p" className="font-inter font-normal text-[15px] leading-5 text-[#697282]">
            Temukan informasi, tips, dan update terbaru seputar top up game, promo menarik
          </Text>
        </Box>

        {/* 3-card flex row */}
        <Box className="flex flex-row gap-6">
          {ARTIKEL_TERBARU.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              isFeatured={index === 0}
            />
          ))}
        </Box>

        {/* CTA button */}
        <Box className="flex justify-center mt-10">
          <Box
            as="button"
            className="flex items-center gap-2.5 px-8 h-11.5 rounded-full bg-transparent border border-[#9333EA] cursor-pointer"
          >
            <Text
              as="span"
              className="font-inter font-bold text-[12px] leading-none tracking-[1.2px] text-[#9333EA] uppercase"
            >
              Lihat Semua Artikel
            </Text>
            <ChevronDown className="w-4 h-4 text-[#9333EA]" />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { cn } from "@/lib/utils";

type Props = {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export default function FeatureCard({
  iconBg,
  icon,
  title,
  description,
  children,
}: Props): React.JSX.Element {
  return (
    <Box className="flex flex-col items-center text-center gap-5">
      {/* Icon block */}
      <Box
        className={cn(
          "w-22 h-22 rounded-2xl flex items-center justify-center shrink-0",
          iconBg
        )}
      >
        {icon}
      </Box>

      {/* Title */}
      <Heading
        as="h3"
        level={4}
        className="font-outfit font-bold text-[22px] leading-7 text-white"
      >
        {title}
      </Heading>

      {/* Description */}
      <Text
        as="p"
        className="font-inter font-normal text-[15px] leading-6 text-[#697282] max-w-75"
      >
        {description}
      </Text>

      {/* Footer — column-specific content */}
      {children}
    </Box>
  );
}

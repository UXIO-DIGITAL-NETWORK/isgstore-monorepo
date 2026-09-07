import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

type Props = {
  value: string;
};

export default function TimerBox({ value }: Props): React.JSX.Element {
  return (
    <Box
      className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shadow-glow-violet"
      style={{ background: "rgba(88, 28, 135, 0.5)", border: "1px solid #9333EA" }}
    >
      <Text as="span" className="text-[20px] md:text-[25.4px] font-bold leading-none tabular-nums font-plex text-white">
        {value}
      </Text>
    </Box>
  );
}

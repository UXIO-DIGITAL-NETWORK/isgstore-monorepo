import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

type Props = {
  value: string;
};

export default function TimerBox({ value }: Props): React.JSX.Element {
  return (
    <Box
      className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shadow-glow-accent"
      style={{ background: "rgba(39,53,15,0.5)", border: "1px solid rgb(208,201,129)" }}
    >
      <Text as="span" className="text-[20px] md:text-[25.4px] font-bold leading-none tabular-nums font-plex text-white">
        {value}
      </Text>
    </Box>
  );
}

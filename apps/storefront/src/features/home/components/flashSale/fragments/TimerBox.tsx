import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

type Props = {
  value: string;
};

export default function TimerBox({ value }: Props): React.JSX.Element {
  return (
    <Box
      className="w-12 h-12 rounded-lg flex items-center justify-center"
      style={{ background: "rgba(88, 28, 135, 0.5)" }}
    >
      <Text as="span" className="text-xl font-bold leading-none tabular-nums">
        {value}
      </Text>
    </Box>
  );
}

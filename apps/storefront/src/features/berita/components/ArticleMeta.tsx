import React from "react";
import { Calendar, User } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

type Props = {
  date: string;
  author: string;
};

export default function ArticleMeta({ date, author }: Props): React.JSX.Element {
  return (
    <Box className="flex items-center gap-5 flex-wrap">
      <Box className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-[#9234EA] shrink-0" />
        <Text as="span" className="font-inter text-[13px] text-white/60">
          {date}
        </Text>
      </Box>

      <Box className="flex items-center gap-1.5">
        <User className="w-4 h-4 text-[#9234EA] shrink-0" />
        <Text as="span" className="font-inter text-[13px] text-white/60">
          {author}
        </Text>
      </Box>
    </Box>
  );
}

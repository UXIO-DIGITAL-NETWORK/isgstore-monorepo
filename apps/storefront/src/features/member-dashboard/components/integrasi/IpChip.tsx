import React from "react";
import { X } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

interface IpChipProps {
  ip: string;
  onRemove: (ip: string) => void;
}

export default function IpChip({ ip, onRemove }: IpChipProps): React.JSX.Element {
  return (
    <Box className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#9234EA]/15 border border-[#9234EA]/30">
      <Text as="span" className="font-plex text-[12px] text-white/80 leading-none">
        {ip}
      </Text>
      <Box
        as="button"
        type="button"
        onClick={() => onRemove(ip)}
        aria-label={`Remove ${ip}`}
        className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-2.5 h-2.5" />
      </Box>
    </Box>
  );
}

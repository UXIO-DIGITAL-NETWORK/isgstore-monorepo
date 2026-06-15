import React from "react";
import { ChevronUp } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface FaqItemProps {
  index: number;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FaqItem({
  index,
  question,
  answer,
  isOpen,
  onToggle,
}: FaqItemProps): React.JSX.Element {
  return (
    <Box
      className={cn(
        "rounded-2xl border transition-colors duration-200",
        isOpen
          ? "border-[#9234EA]/40 bg-[rgba(59,130,246,0.06)] backdrop-blur-[6px]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      {/* Question row — clickable */}
      <Box
        as="button"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-4 w-full px-5 py-4 text-left cursor-pointer"
      >
        <Text
          as="span"
          className={cn(
            "font-outfit font-semibold text-[15px] leading-snug transition-colors",
            isOpen ? "text-white" : "text-white/85",
          )}
        >
          {index + 1}. {question}
        </Text>
        <ChevronUp
          size={18}
          className={cn(
            "shrink-0 text-white/45 transition-transform duration-300",
            !isOpen && "rotate-180",
          )}
        />
      </Box>

      {/* Answer panel */}
      {isOpen && (
        <Text
          as="p"
          className="px-5 pb-5 font-inter text-[14px] text-white/55 leading-relaxed"
        >
          {answer}
        </Text>
      )}
    </Box>
  );
}

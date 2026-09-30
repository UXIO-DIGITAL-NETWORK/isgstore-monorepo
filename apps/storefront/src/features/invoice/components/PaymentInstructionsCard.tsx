import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function PaymentInstructionsCard(): React.JSX.Element {
  const { t } = useTranslation("invoice");
  const [isOpen, setIsOpen] = useState(true);

  // The translation file stores steps as an array
  const steps = t("instructions.steps", { returnObjects: true }) as string[];

  return (
    <Box className="rounded-2xl border border-[rgba(208,201,129,0.35)] bg-[rgb(14,20,10)] overflow-hidden">
      {/* Header — clickable toggle */}
      <Box
        as="button"
        type="button"
        className="w-full flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <Text as="span" className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none">
          {t("instructions.title")}
        </Text>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white/50 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
        )}
      </Box>

      {/* Divider */}
      {isOpen && <Box className="h-px bg-white/8 mx-0" />}

      {/* Steps list */}
      {isOpen && (
        <Box className="px-4 py-4">
          <Box as="ol" className="flex flex-col gap-2.5 list-none">
            {steps.map((step, i) => (
              <Box key={i} as="li" className="flex items-start gap-2">
                <Text
                  as="span"
                  className="font-plex font-bold text-[12px] text-accent leading-none mt-0.5 shrink-0 w-4 text-right"
                >
                  {i + 1}.
                </Text>
                <Text as="span" className="font-inter text-[12px] text-white/60 leading-relaxed">
                  {step}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

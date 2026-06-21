import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { NOMINAL_PRESETS } from "@/features/member-dashboard/data/isiSaldo.mock";
import SectionCard from "./SectionCard";

const chipVariants = cva(
  "px-3 py-2 rounded-full border text-[12px] font-plex font-semibold cursor-pointer transition-all outline-none",
  {
    variants: {
      active: {
        true: "bg-[#9234EA] border-[#9234EA] text-white",
        false: "bg-transparent border-white/20 text-white/70 hover:border-white/40 hover:text-white",
      },
    },
    defaultVariants: { active: false },
  },
);

interface Props {
  selectedNominal: number;
  onSelectPreset: (value: number) => void;
  onCustomChange: (raw: string) => void;
}

export default function NominalSelector({
  selectedNominal,
  onSelectPreset,
  onCustomChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  /** Local display value for the input — shows the formatted preset or raw custom value. */
  const [inputValue, setInputValue] = useState<string>(
    formatCurrency(selectedNominal, locale),
  );

  const handlePresetClick = (value: number) => {
    const formatted = formatCurrency(value, locale);
    setInputValue(formatted);
    onSelectPreset(value);
    // Pass the raw numeric string up so the hook can parse it
    onCustomChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    onCustomChange(raw);
  };

  return (
    <SectionCard stepNumber={1} title={t("isiSaldo.nominal.sectionTitle")}>
      <Box className="flex flex-col gap-3">
        {/* Label + hint */}
        <Box className="flex flex-col gap-0.5">
          <Text as="span" className="text-[13px] font-outfit font-semibold text-white leading-none">
            {t("isiSaldo.nominal.label")}
          </Text>
          <Text as="span" className="text-[11px] font-inter text-white/45 leading-none">
            {t("isiSaldo.nominal.hint")}
          </Text>
        </Box>

        {/* Controlled input */}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t("isiSaldo.nominal.placeholder")}
          className="rounded-xl"
        />

        {/* Preset chips */}
        <Box className="flex flex-wrap gap-2">
          {NOMINAL_PRESETS.map((preset) => (
            <Box
              key={preset}
              as="button"
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(chipVariants({ active: preset === selectedNominal }))}
            >
              {formatCurrency(preset, locale)}
            </Box>
          ))}
        </Box>
      </Box>
    </SectionCard>
  );
}

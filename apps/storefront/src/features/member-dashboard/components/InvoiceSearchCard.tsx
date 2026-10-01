import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

interface Props {
  onSearch: (value: string) => void;
}

export default function InvoiceSearchCard({ onSearch }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    onSearch(draft.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    // Gradient border wrapper
    <Box className="p-px rounded-2xl bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)]">
      {/* Dark forest inner card */}
      <Box className="bg-[rgb(14,20,10)] rounded-[15px] p-5">
        <Text
          as="span"
          className="block mb-3 text-[15px] font-outfit font-semibold text-white leading-none"
        >
          {t("transactionHistory.searchCard.title")}
        </Text>

        <Box className="flex gap-3">
          {/* Input */}
          <Box className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Box
              as="input"
              type="text"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("transactionHistory.searchCard.placeholder")}
              className="w-full bg-[rgb(14,20,10)] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-[13px] font-inter text-white placeholder:text-white/25 outline-none focus:border-[rgb(67,86,32)]/50 transition-colors"
            />
          </Box>

          {/* Cari / Search button */}
          <Box
            as="button"
            type="button"
            onClick={handleSubmit}
            className="shrink-0 px-7 py-2.5 rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] text-[13px] font-outfit font-bold text-white shadow-cta-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t("transactionHistory.searchCard.button")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import React, { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { UseFormReturn } from "react-hook-form";
import type { SearchFormValues } from "@/features/track-order/schemas/trackOrder.schema";

interface Props {
  form: UseFormReturn<SearchFormValues>;
  /** Runs the lookup. Search is explicit — see useTrackOrderSearch. */
  onSubmit: () => void;
}

export default function TrackOrderSearchCard({ form, onSubmit }: Props): React.JSX.Element {
  const { t } = useTranslation("trackOrder");
  const { register } = form;

  return (
    <Box className="rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#0D1117] p-6 md:p-8">
      <Box
        as="form"
        onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }}
        className="flex flex-col gap-4"
      >
        <Box className="flex flex-col gap-2">
          <Text as="p" className="font-outfit font-semibold text-[15px] text-white">
            {t("search.label")}
          </Text>
          <Input
            {...register("query")}
            type="text"
            placeholder={t("search.placeholder")}
          />
        </Box>

        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3"
        >
          <Search className="w-4 h-4 shrink-0" />
          {t("search.button")}
        </Button>
      </Box>
    </Box>
  );
}

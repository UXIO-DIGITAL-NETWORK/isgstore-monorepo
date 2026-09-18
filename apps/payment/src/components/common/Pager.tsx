import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";

interface PagerProps {
  page: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Prev/next pager for server-mode tables. Rendered by the client pages and the
 * internal ones alike, so its wording goes through i18n rather than being
 * written in one panel's language.
 */
export function Pager({ page, lastPage, total, onPageChange }: PagerProps) {
  const { t } = useTranslation("common");

  return (
    <Box className="flex items-center justify-between">
      <Text variant="small">{t("pager.summary", { page, lastPage, total })}</Text>
      <Box className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("pager.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          {t("pager.next")}
        </Button>
      </Box>
    </Box>
  );
}

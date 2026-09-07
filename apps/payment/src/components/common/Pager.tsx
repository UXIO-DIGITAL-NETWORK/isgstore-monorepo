import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";

interface PagerProps {
  page: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Prev/next pager for server-mode tables. */
export function Pager({ page, lastPage, total, onPageChange }: PagerProps) {
  return (
    <Box className="flex items-center justify-between">
      <Text variant="small">
        Halaman {page} dari {lastPage} · {total} data
      </Text>
      <Box className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
        </Button>
      </Box>
    </Box>
  );
}

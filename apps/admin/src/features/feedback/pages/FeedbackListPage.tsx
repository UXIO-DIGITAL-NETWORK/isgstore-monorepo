import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { feedbackColumns } from "../components/feedbackColumns";
import { useDeleteFeedback, useFeedback } from "../hooks/useFeedback";

const DEFAULT_PAGE_SIZE = 15;

/**
 * Feedback — the customer ratings feed (`/v1/ratings`). Reviews come from the
 * storefront (members and guests); the page browses them and can delete one,
 * which is the only write it has.
 */
export default function FeedbackListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(() => ({ page, per_page: pageSize }), [page, pageSize]);
  const { data, isLoading, isError, refetch } = useFeedback(params);
  const { mutate: deleteFeedback } = useDeleteFeedback();

  // `mutate` is referentially stable, so the columns are built once rather
  // than on every render.
  const columns = useMemo(() => feedbackColumns(deleteFeedback), [deleteFeedback]);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Feedback
        </Heading>
        <Text variant="muted">
          Ratings and reviews customers left after their purchases — from members and guests alike, newest first.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="feedback"
          showRowNumber
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>
    </Box>
  );
}

import { useQuery } from "@tanstack/react-query";

import { priceChangeLogService } from "../services/priceChangeLog.service";
import type { PriceChangeLogListParams } from "../types/product.type";

export const usePriceChangeLogList = (params: PriceChangeLogListParams) =>
  useQuery({
    queryKey: ["price-change-logs", "list", params],
    queryFn: () => priceChangeLogService.list(params),
  });

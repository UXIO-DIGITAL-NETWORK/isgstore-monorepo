import { useQuery } from "@tanstack/react-query";

import { reportsService } from "../services/reports.service";
import type { ReportSummaryParams } from "../types/report.type";

export const useReportSummary = (params: ReportSummaryParams) =>
  useQuery({
    queryKey: ["reports", "summary", params],
    queryFn: () => reportsService.getSummary(params),
    // A custom range without both ends is a guaranteed 422 — don't fire it.
    enabled: params.period !== "custom" || Boolean(params.dateFrom && params.dateTo),
  });

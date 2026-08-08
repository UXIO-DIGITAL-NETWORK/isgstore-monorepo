import { useQuery } from "@tanstack/react-query";

import { reportsService } from "../services/reports.service";
import type { ReportPeriod } from "../types/report.type";

export const useReportSummary = (period: ReportPeriod) =>
  useQuery({
    queryKey: ["reports", "summary", period],
    queryFn: () => reportsService.getSummary(period),
  });

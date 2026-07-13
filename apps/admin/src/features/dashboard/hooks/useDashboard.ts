import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import type { MonthOption, PerformanceTabKey } from "../types/dashboard.type";

export const useStatCards = () =>
  useQuery({ queryKey: ["dashboard", "stat-cards"], queryFn: dashboardService.getStatCards });

export const useChartSeries = (month: MonthOption) =>
  useQuery({
    queryKey: ["dashboard", "chart-series", month],
    queryFn: () => dashboardService.getChartSeries(month),
  });

export const usePendingOrders = () =>
  useQuery({ queryKey: ["dashboard", "pending-orders"], queryFn: dashboardService.getPendingOrders });

export const useActivityLog = () =>
  useQuery({ queryKey: ["dashboard", "activity-log"], queryFn: dashboardService.getActivityLog });

export const usePerformanceRows = (tab: PerformanceTabKey) =>
  useQuery({
    queryKey: ["dashboard", "performance", tab],
    queryFn: () => dashboardService.getPerformanceRows(tab),
  });

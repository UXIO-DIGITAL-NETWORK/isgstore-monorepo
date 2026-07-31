import { useMemo } from "react";
import type { ActivityLogRow, ActivityStat } from "@/features/member-dashboard/types/activityLog.type";

/**
 * The four tiles above the activity table, counted from the rows already
 * loaded.
 *
 * `trend` is empty rather than fabricated: the API returns a flat log with no
 * period-over-period comparison, and a made-up percentage on a security page
 * would be worse than none.
 */
export function useActivityStats(rows: ActivityLogRow[]): ActivityStat[] {
  return useMemo(() => {
    const countOf = (type: ActivityLogRow["type"]) => rows.filter((row) => row.type === type).length;

    return [
      { key: "totalActivity", labelKey: "activityLog.stats.totalActivity", value: rows.length, trend: "", trendUp: true, subtitleKey: "activityLog.stats.totalActivitySub" },
      { key: "loginSuccess", labelKey: "activityLog.stats.loginSuccess", value: countOf("login"), trend: "", trendUp: true, subtitleKey: "activityLog.stats.loginSuccessSub" },
      { key: "transaction", labelKey: "activityLog.stats.transaction", value: countOf("transaction"), trend: "", trendUp: true, subtitleKey: "activityLog.stats.transactionSub" },
      { key: "dataChange", labelKey: "activityLog.stats.dataChange", value: countOf("security"), trend: "", trendUp: true, subtitleKey: "activityLog.stats.dataChangeSub" },
    ];
  }, [rows]);
}

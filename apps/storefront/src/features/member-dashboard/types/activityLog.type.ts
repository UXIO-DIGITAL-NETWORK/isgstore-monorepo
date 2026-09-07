export type ActivityType =
  | "login"
  | "membership"
  | "transaction"
  | "security"
  | "verification"
  | "failed";

export type ActivityStatusFilter = "all" | ActivityType;

export interface ActivityLogRow {
  id: number;
  type: ActivityType;
  titleKey: string;
  descKey: string;
  date: string; // ISO 8601
  ip: string;
  location: string;
}

export interface ActivityLogFilterValues {
  status: ActivityStatusFilter;
  ip: string;
  dateFrom: string;
  dateTo: string;
}

export interface ActivityStat {
  key: "totalActivity" | "loginSuccess" | "transaction" | "dataChange";
  labelKey: string;
  value: number;
  trend: string;
  trendUp: boolean;
  subtitleKey: string;
}

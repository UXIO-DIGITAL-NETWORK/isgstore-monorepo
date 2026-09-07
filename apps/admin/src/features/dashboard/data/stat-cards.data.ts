import type { StatCardData } from "../types/dashboard.type";

export const STAT_CARDS: StatCardData[] = [
  {
    id: "credit",
    label: "Credit",
    value: 15231.89,
    deltaPct: 12.5,
    direction: "up",
    caption: "Since last month",
  },
  {
    id: "debit",
    label: "Debit",
    value: 15231.89,
    deltaPct: 20,
    direction: "down",
    caption: "Since last month",
  },
  {
    id: "todays-sales",
    label: "Today's Sales",
    value: 15231.89,
    deltaPct: 12.5,
    direction: "up",
    caption: "Since last month",
  },
];

import type { TFunction } from "i18next";

import type { StatCardData } from "@/components/common/StatCard";

/**
 * A factory, not a module constant: these labels are rendered text, so they
 * have to resolve when the component renders.
 */
export const summaryCardsFor = (t: TFunction<"financial">): StatCardData[] => [
  {
    id: "total-credit",
    label: t("totalCredit"),
    value: 15231.89,
    deltaPct: 12.5,
    direction: "up",
    caption: t("sinceLastMonth"),
  },
  {
    id: "total-debit",
    label: t("totalDebit"),
    value: 15231.89,
    deltaPct: 20,
    direction: "down",
    caption: t("sinceLastMonth"),
  },
  {
    id: "profit",
    label: t("profit"),
    value: 15231.89,
    deltaPct: 12.5,
    direction: "up",
    caption: t("sinceLastMonth"),
  },
];

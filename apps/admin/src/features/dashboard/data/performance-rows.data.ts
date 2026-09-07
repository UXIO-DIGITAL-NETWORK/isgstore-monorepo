import type { PerformanceRow, PerformanceTabKey } from "../types/dashboard.type";

export const PERFORMANCE_ROWS: Record<PerformanceTabKey, PerformanceRow[]> = {
  category: [
    { id: "cat-mlbb", name: "Mobile Legend Indonesia", subLabel: "Moonton", totalTransaction: 23, revenue: 32 },
    { id: "cat-genshin", name: "Genshin Impact", subLabel: "Mihoyo", totalTransaction: 45, revenue: 8 },
    { id: "cat-valorant", name: "Valorant", subLabel: "Riot Games", totalTransaction: 45, revenue: 45 },
    { id: "cat-free-fire", name: "Free Fire", subLabel: "Garena", totalTransaction: 45, revenue: 45 },
    { id: "cat-pubg", name: "PUBG Mobile", subLabel: "Tencent", totalTransaction: 23, revenue: 23 },
  ],
  product: [
    { id: "prod-diamonds-100", name: "100 Diamonds", subLabel: "Mobile Legends", totalTransaction: 58, revenue: 29 },
    { id: "prod-uc-660", name: "660 UC", subLabel: "PUBG Mobile", totalTransaction: 41, revenue: 61 },
    { id: "prod-vp-475", name: "475 VP", subLabel: "Valorant", totalTransaction: 37, revenue: 74 },
    {
      id: "prod-genesis-980",
      name: "980 Genesis Crystals",
      subLabel: "Genshin Impact",
      totalTransaction: 22,
      revenue: 44,
    },
    { id: "prod-ff-720", name: "720 Diamonds", subLabel: "Free Fire", totalTransaction: 19, revenue: 15 },
  ],
  user: [
    { id: "user-arka", name: "Arka Wijaya", subLabel: "arka.wijaya@mail.com", totalTransaction: 34, revenue: 68 },
    { id: "user-nadia", name: "Nadia Putri", subLabel: "nadia.putri@mail.com", totalTransaction: 27, revenue: 51 },
    { id: "user-farhan", name: "Farhan Rizky", subLabel: "farhan.rizky@mail.com", totalTransaction: 19, revenue: 30 },
    { id: "user-citra", name: "Citra Lestari", subLabel: "citra.lestari@mail.com", totalTransaction: 15, revenue: 22 },
  ],
};

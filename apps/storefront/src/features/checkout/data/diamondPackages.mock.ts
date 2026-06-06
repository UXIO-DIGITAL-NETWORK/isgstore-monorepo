import type { DiamondPackage } from "@/features/checkout/types/checkout.type";

export const DIAMOND_PACKAGES_MOCK: DiamondPackage[] = [
  { id: "pkg-1",   name: "5 Diamond",    amount: 5,    price: 1500,   category: "all" },
  { id: "pkg-2",   name: "12 Diamond",   amount: 12,   price: 3600,   category: "all" },
  { id: "pkg-3",   name: "19 Diamond",   amount: 19,   price: 5700,   category: "all" },
  { id: "pkg-4",   name: "28 Diamond",   amount: 28,   price: 8400,   category: "all" },
  { id: "pkg-5",   name: "50 Diamond",   amount: 50,   price: 15000,  category: "all" },
  { id: "pkg-6",   name: "65 Diamond",   amount: 65,   price: 19500,  category: "all" },
  { id: "pkg-7",   name: "86 Diamond",   amount: 86,   price: 25800,  category: "all" },
  { id: "pkg-8",   name: "100 Diamond",  amount: 100,  price: 30000,  category: "all", isPopular: true },
  { id: "pkg-9",   name: "172 Diamond",  amount: 172,  price: 51600,  category: "all" },
  { id: "pkg-10",  name: "257 Diamond",  amount: 257,  price: 77100,  category: "all" },
  { id: "pkg-11",  name: "344 Diamond",  amount: 344,  price: 103200, category: "all", isPopular: true },
  { id: "pkg-12",  name: "514 Diamond",  amount: 514,  price: 154200, category: "all" },
  { id: "pkg-13",  name: "706 Diamond",  amount: 706,  price: 211800, category: "all" },
  { id: "pkg-14",  name: "878 Diamond",  amount: 878,  price: 263400, category: "all", isBonus: true },
  { id: "pkg-15",  name: "1024 Diamond", amount: 1024, price: 307200, category: "all" },
  { id: "pkg-16",  name: "2195 Diamond", amount: 2195, price: 658500, category: "all", isBonus: true },
  // Weekly
  { id: "pkg-w1",  name: "Pesona Tepukan 1",  amount: 20,  price: 5900,   category: "weekly" },
  { id: "pkg-w2",  name: "Pesona Tepukan 2",  amount: 50,  price: 15000,  category: "weekly" },
  { id: "pkg-w3",  name: "Paket Mingguan",    amount: 210, price: 63000,  category: "weekly", isPopular: true },
  { id: "pkg-w4",  name: "Langganan Twilight", amount: 70, price: 21000,  category: "weekly" },
  // Monthly
  { id: "pkg-m1",  name: "Paket Bulanan",     amount: 365, price: 109500, category: "monthly", isPopular: true },
  { id: "pkg-m2",  name: "Kartu Bulanan Pro",  amount: 500, price: 150000, category: "monthly" },
  // Special
  { id: "pkg-s1",  name: "Starlight Member",  amount: 0,   price: 149000, category: "special" },
  { id: "pkg-s2",  name: "Skin Fragment 150", amount: 150, price: 75000,  category: "special", isBonus: true },
  { id: "pkg-s3",  name: "Paket Hemat",       amount: 500, price: 145000, category: "special", isPopular: true },
];

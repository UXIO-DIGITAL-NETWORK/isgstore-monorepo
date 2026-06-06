import logo1 from "@/assets/images/payment_method/payment_logo_1.png";
import logo2 from "@/assets/images/payment_method/payment_logo_2.png";
import logo3 from "@/assets/images/payment_method/payment_logo_3.png";
import logo4 from "@/assets/images/payment_method/payment_logo_4.png";
import logo5 from "@/assets/images/payment_method/payment_logo_5.png";
import type { PaymentGroup } from "@/features/checkout/types/checkout.type";

export const PAYMENT_GROUPS_MOCK: PaymentGroup[] = [
  {
    type: "ewallet",
    label: "E-Wallet",
    options: [
      { id: "gopay",   name: "GoPay",   logo: logo1 },
      { id: "ovo",     name: "OVO",     logo: logo2 },
      { id: "dana",    name: "DANA",    logo: logo3 },
      { id: "linkaja", name: "LinkAja", logo: logo4 },
    ],
  },
  {
    type: "qris",
    label: "QRIS",
    options: [
      { id: "qris", name: "QRIS", logo: logo5 },
    ],
  },
  {
    type: "va",
    label: "Transfer Virtual Account",
    options: [
      { id: "va-bca",     name: "BCA Virtual Account",     logo: logo1 },
      { id: "va-mandiri", name: "Mandiri Virtual Account",  logo: logo2 },
      { id: "va-bni",     name: "BNI Virtual Account",      logo: logo3 },
      { id: "va-bri",     name: "BRI Virtual Account",      logo: logo4 },
    ],
  },
];

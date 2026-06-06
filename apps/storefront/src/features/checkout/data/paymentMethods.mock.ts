import iconCredit from "@/assets/images/checkout/icon_credit.png";
import logoGopay from "@/assets/images/checkout/logo_gopay.png";
import logoDana from "@/assets/images/checkout/logo_dana.png";
import logoOvo from "@/assets/images/checkout/logo_ovo.png";
import logoBca from "@/assets/images/checkout/logo_bca.png";
import logoMandiri from "@/assets/images/checkout/logo_mandiri.png";
import logoBri from "@/assets/images/checkout/logo_bri.png";
import logoBni from "@/assets/images/checkout/logo_bni.png";
import logoQris from "@/assets/images/checkout/logo_qris.png";
import type { PaymentGroup, MemberCredits } from "@/features/checkout/types/checkout.type";

export const MEMBER_CREDITS_MOCK: MemberCredits = {
  id: "credits",
  balance: 0,
  logo: iconCredit,
};

export const PAYMENT_GROUPS_MOCK: PaymentGroup[] = [
  {
    type: "ewallet",
    label: "E-Wallet",
    options: [
      { id: "gopay", name: "GoPay", logo: logoGopay },
      { id: "dana",  name: "DANA",  logo: logoDana  },
      { id: "ovo",   name: "OVO",   logo: logoOvo   },
    ],
  },
  {
    type: "va",
    label: "Virtual Account",
    options: [
      { id: "va-bca",     name: "BCA Virtual Account",     logo: logoBca     },
      { id: "va-mandiri", name: "Mandiri Virtual Account",  logo: logoMandiri },
      { id: "va-bri",     name: "BRI Virtual Account",      logo: logoBri     },
      { id: "va-bni",     name: "BNI Virtual Account",      logo: logoBni     },
    ],
  },
  {
    type: "qris",
    label: "QRIS",
    options: [
      { id: "qris", name: "QRIS", logo: logoQris },
    ],
  },
];

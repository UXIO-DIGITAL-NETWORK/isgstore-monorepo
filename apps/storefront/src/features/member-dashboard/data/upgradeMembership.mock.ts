import logoGopay from "@/assets/images/checkout/logo_gopay.png";
import logoDana from "@/assets/images/checkout/logo_dana.png";
import logoOvo from "@/assets/images/checkout/logo_ovo.png";
import logoBca from "@/assets/images/checkout/logo_bca.png";
import logoMandiri from "@/assets/images/checkout/logo_mandiri.png";
import logoBri from "@/assets/images/checkout/logo_bri.png";
import logoBni from "@/assets/images/checkout/logo_bni.png";
import logoQris from "@/assets/images/checkout/logo_qris.png";
import type { MembershipPlan, PaymentGroup } from "@/features/member-dashboard/types/upgradeMembership.type";

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "basic",
    nameKey: "upgradeMembership.plans.basic.name",
    price: 50000,
    benefitKeys: [
      "upgradeMembership.plans.basic.benefits.0",
      "upgradeMembership.plans.basic.benefits.1",
      "upgradeMembership.plans.basic.benefits.2",
    ],
  },
  {
    id: "platinum",
    nameKey: "upgradeMembership.plans.platinum.name",
    price: 150000,
    benefitKeys: [
      "upgradeMembership.plans.platinum.benefits.0",
      "upgradeMembership.plans.platinum.benefits.1",
      "upgradeMembership.plans.platinum.benefits.2",
      "upgradeMembership.plans.platinum.benefits.3",
    ],
    popular: true,
  },
  {
    id: "gold",
    nameKey: "upgradeMembership.plans.gold.name",
    price: 300000,
    benefitKeys: [
      "upgradeMembership.plans.gold.benefits.0",
      "upgradeMembership.plans.gold.benefits.1",
      "upgradeMembership.plans.gold.benefits.2",
      "upgradeMembership.plans.gold.benefits.3",
      "upgradeMembership.plans.gold.benefits.4",
    ],
  },
];

/** Current member credits balance (mock — matches the design "Rp 0"). */
export const CREDITS_BALANCE = 0;

export const PAYMENT_GROUPS: PaymentGroup[] = [
  {
    type: "ewallet",
    label: "E-Wallet",
    options: [
      { id: "gopay",   name: "GoPay",  logo: logoGopay,   fee: 1500 },
      { id: "dana",    name: "DANA",   logo: logoDana,    fee: 1500 },
      { id: "ovo",     name: "OVO",    logo: logoOvo,     fee: 1500 },
    ],
  },
  {
    type: "va",
    label: "Virtual Account",
    options: [
      { id: "va-bca",     name: "BCA Virtual Account",    logo: logoBca,     fee: 4000 },
      { id: "va-mandiri", name: "Mandiri Virtual Account", logo: logoMandiri, fee: 4000 },
      { id: "va-bri",     name: "BRI Virtual Account",     logo: logoBri,     fee: 4000 },
      { id: "va-bni",     name: "BNI Virtual Account",     logo: logoBni,     fee: 4000 },
    ],
  },
  {
    type: "qris",
    label: "QRIS",
    options: [
      { id: "qris", name: "QRIS All Payment", logo: logoQris, fee: 80 },
    ],
  },
];

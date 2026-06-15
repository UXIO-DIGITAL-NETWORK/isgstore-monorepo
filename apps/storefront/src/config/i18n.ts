import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import idCommon from "@/locales/id/common.json";
import idAuth from "@/locales/id/auth.json";
import idHome from "@/locales/id/home.json";
import idCheckout from "@/locales/id/checkout.json";
import idInvoice from "@/locales/id/invoice.json";
import idDashboard from "@/locales/id/dashboard.json";
import idAdmin from "@/locales/id/admin.json";
import idErrors from "@/locales/id/errors.json";
import idTrackOrder from "@/locales/id/trackOrder.json";
import idPriceList from "@/locales/id/priceList.json";
import idBerita from "@/locales/id/berita.json";

import enCommon from "@/locales/en/common.json";
import enAuth from "@/locales/en/auth.json";
import enHome from "@/locales/en/home.json";
import enCheckout from "@/locales/en/checkout.json";
import enInvoice from "@/locales/en/invoice.json";
import enDashboard from "@/locales/en/dashboard.json";
import enAdmin from "@/locales/en/admin.json";
import enErrors from "@/locales/en/errors.json";
import enTrackOrder from "@/locales/en/trackOrder.json";
import enPriceList from "@/locales/en/priceList.json";
import enBerita from "@/locales/en/berita.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: {
        common: idCommon,
        auth: idAuth,
        home: idHome,
        checkout: idCheckout,
        invoice: idInvoice,
        dashboard: idDashboard,
        admin: idAdmin,
        errors: idErrors,
        trackOrder: idTrackOrder,
        priceList: idPriceList,
        berita: idBerita,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        checkout: enCheckout,
        invoice: enInvoice,
        dashboard: enDashboard,
        admin: enAdmin,
        errors: enErrors,
        trackOrder: enTrackOrder,
        priceList: enPriceList,
        berita: enBerita,
      },
    },
    lng: "id",
    fallbackLng: "id",
    supportedLngs: ["id", "en"],
    defaultNS: "common",
    ns: ["common", "auth", "home", "checkout", "invoice", "dashboard", "admin", "errors", "trackOrder", "priceList", "berita"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["path", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

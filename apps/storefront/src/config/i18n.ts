import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import idCommon from "@/locales/id/common.json";
import idAuth from "@/locales/id/auth.json";
import idHome from "@/locales/id/home.json";
import idCheckout from "@/locales/id/checkout.json";
import idDashboard from "@/locales/id/dashboard.json";
import idAdmin from "@/locales/id/admin.json";
import idErrors from "@/locales/id/errors.json";

import enCommon from "@/locales/en/common.json";
import enAuth from "@/locales/en/auth.json";
import enHome from "@/locales/en/home.json";
import enCheckout from "@/locales/en/checkout.json";
import enDashboard from "@/locales/en/dashboard.json";
import enAdmin from "@/locales/en/admin.json";
import enErrors from "@/locales/en/errors.json";

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
        dashboard: idDashboard,
        admin: idAdmin,
        errors: idErrors,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        checkout: enCheckout,
        dashboard: enDashboard,
        admin: enAdmin,
        errors: enErrors,
      },
    },
    lng: "id",
    fallbackLng: "id",
    supportedLngs: ["id", "en"],
    defaultNS: "common",
    ns: ["common", "auth", "home", "checkout", "dashboard", "admin", "errors"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["path", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

import { B2B_PRICES, B2C_PRICES } from "./constants";

export type B2BPlanId = "starter" | "pro";

export const B2B_PLANS = [
  {
    id: "starter" as const,
    name: "STARTER",
    price: B2B_PRICES.starter,
    period: "zł / m-c",
    badge: "Na start",
    tagline: "Kalkulator dachu i pierwsze leady bez chaosu w Excelu.",
    description:
      "Idealny, gdy chcesz szybko wystawić wycenę dachu na swojej stronie i zbierać zgłoszenia.",
    features: [
      "Moduł wyceny dachu",
      "Do 30 leadów miesięcznie",
      "Subdomena RoofFlow (/firmy/twoja-firma)",
      "CRM ze statusami leadów",
      "Własne stawki robocizny i pokryć",
      "Kod iframe do WordPress / Wix",
      "14 dni za darmo",
    ],
    missing: [
      "Moduł poddasza i elewacji",
      "Własna domena (PRO)",
      "Whitelabel + SMS",
      "Leady bez limitu",
    ],
    cta: "Wybierz STARTER",
    highlighted: false,
  },
  {
    id: "pro" as const,
    name: "PRO ALL-IN-ONE",
    price: B2B_PRICES.pro,
    period: "zł / m-c",
    badge: "Najczęściej wybierany",
    tagline: "Pełny whitelabel: dach + poddasze + elewacja pod Twoją marką.",
    description:
      "Dla firm, które chcą wyglądać premium, zbierać leady bez limitu i mieć własną domenę.",
    features: [
      "Wszystkie moduły: dach, poddasze, elewacja",
      "Leady bez limitu",
      "Własna domena (Vercel Domains API)",
      "Whitelabel (logo + kolor marki)",
      "Powiadomienia e-mail / SMS o leadach",
      "Stripe Customer Portal (faktury VAT)",
      "Priorytetowe wsparcie konfiguracji",
      "14 dni za darmo",
    ],
    missing: [] as string[],
    cta: "Wybierz PRO",
    highlighted: true,
  },
] as const;

export const B2B_ADDONS = [
  {
    id: "insulation",
    name: "Add-on Poddasze",
    price: B2B_PRICES.insulationAddon,
    description: "Ocieplenie skosów: wełna, PUR, PIR + zabudowa GK w wycenie.",
  },
  {
    id: "facade",
    name: "Add-on Elewacja",
    price: B2B_PRICES.facadeAddon,
    description: "Styropian grafitowy / wełna fasadowa, tynk i rusztowania.",
  },
] as const;

export const B2C_PACKAGES = [
  {
    id: "roof",
    name: "Sam dach",
    price: B2C_PRICES.roofOnly,
    description: "Geometria, pokrycie, drewno, robocizna — raport PDF.",
    includes: ["Dach"],
  },
  {
    id: "roof_ins",
    name: "Dach + poddasze",
    price: B2C_PRICES.roofInsulation,
    description: "Dach oraz izolacja poddasza z materiałem i grubością.",
    includes: ["Dach", "Poddasze"],
  },
  {
    id: "bundle",
    name: "FULL BUNDLE",
    price: B2C_PRICES.fullBundle,
    description: "Dach + poddasze + elewacja w promocyjnej cenie.",
    includes: ["Dach", "Poddasze", "Elewacja"],
    promo: true,
  },
] as const;

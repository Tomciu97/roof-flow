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
      "Poddasze / elewacja — jako add-on +49 zł (oba = −50% na drugi)",
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

export type B2BAddonId = "insulation" | "facade";

export const B2B_ADDONS = [
  {
    id: "insulation" as const,
    name: "Add-on Poddasze",
    price: B2B_PRICES.insulationAddon,
    description: "Ocieplenie skosów: wełna, PUR, PIR + zabudowa GK w wycenie.",
  },
  {
    id: "facade" as const,
    name: "Add-on Elewacja",
    price: B2B_PRICES.facadeAddon,
    description: "Styropian grafitowy / wełna fasadowa, tynk i rusztowania.",
  },
] as const;

export type B2BAddonSelection = {
  insulation: boolean;
  facade: boolean;
};

export type B2BBillingInterval = "month" | "year";

export function roundPln(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Miesięczna cena po zniżce rocznej (−20%). */
export function withAnnualDiscount(monthlyPln: number): number {
  return roundPln(
    monthlyPln * (1 - B2B_PRICES.annualDiscountPercent / 100)
  );
}

/** Kwota płatności z góry za 12 miesięcy (−20%). */
export function yearlyUpfrontTotal(monthlyPln: number): number {
  return roundPln(withAnnualDiscount(monthlyPln) * 12);
}

export function formatPlnAmount(n: number): string {
  return n.toLocaleString("pl-PL", {
    minimumFractionDigits: n % 1 ? 1 : 0,
    maximumFractionDigits: 2,
  });
}

/** Rozbicie miesięcznej składki STARTER / PRO z add-onami. */
export function computeB2BMonthly(opts: {
  plan: B2BPlanId;
  addons: B2BAddonSelection;
}): {
  base: number;
  insulationPrice: number;
  facadePrice: number;
  total: number;
  bundlePromo: boolean;
  /** Który add-on jest przeceniony o 50% (przy obydwu na STARTER) */
  discountedAddon: B2BAddonId | null;
} {
  if (opts.plan === "pro") {
    return {
      base: B2B_PRICES.pro,
      insulationPrice: 0,
      facadePrice: 0,
      total: B2B_PRICES.pro,
      bundlePromo: false,
      discountedAddon: null,
    };
  }

  const both = opts.addons.insulation && opts.addons.facade;
  // Promocja „całość”: drugi add-on (elewacja) za 50%
  const discountedAddon: B2BAddonId | null = both ? "facade" : null;

  const insulationPrice = opts.addons.insulation
    ? B2B_PRICES.insulationAddon
    : 0;
  const facadePrice = opts.addons.facade
    ? both
      ? B2B_PRICES.addonBundleHalfPrice
      : B2B_PRICES.facadeAddon
    : 0;

  return {
    base: B2B_PRICES.starter,
    insulationPrice,
    facadePrice,
    total: B2B_PRICES.starter + insulationPrice + facadePrice,
    bundlePromo: both,
    discountedAddon,
  };
}

/** Składka z uwzględnieniem miesięcznie vs rocznie (−20%). */
export function computeB2BPricing(opts: {
  plan: B2BPlanId;
  addons: B2BAddonSelection;
  interval: B2BBillingInterval;
}) {
  const monthly = computeB2BMonthly(opts);
  const annual = opts.interval === "year";
  const effectiveMonthly = annual
    ? withAnnualDiscount(monthly.total)
    : monthly.total;
  const chargeTotal = annual
    ? yearlyUpfrontTotal(monthly.total)
    : monthly.total;

  return {
    ...monthly,
    interval: opts.interval,
    /** Cena „za miesiąc” (po −20% przy roku) */
    effectiveMonthly,
    /** Kwota do zapłaty za okres (m-c albo rok z góry) */
    chargeTotal,
    annualDiscountPercent: annual ? B2B_PRICES.annualDiscountPercent : 0,
  };
}

export const B2C_PACKAGES = [
  {
    id: "roof",
    name: "Sam dach",
    price: B2C_PRICES.roofOnly,
    description:
      "Raport PDF + dostęp do konkursu ofert firm z Twojej okolicy.",
    includes: ["Dach", "Dopasowanie firm", "Oferty i wybór wykonawcy"],
  },
  {
    id: "roof_ins",
    name: "Dach + poddasze",
    price: B2C_PRICES.roofInsulation,
    description:
      "Dach i izolacja poddasza — plus firmy, które mogą to wykonać.",
    includes: ["Dach", "Poddasze", "Oferty lokalnych firm"],
  },
  {
    id: "bundle",
    name: "FULL BUNDLE",
    price: B2C_PRICES.fullBundle,
    description:
      "Dach + poddasze + elewacja i marketplace wykonawców w regionie.",
    includes: ["Dach", "Poddasze", "Elewacja", "Konkurs ofert"],
    promo: true,
  },
] as const;

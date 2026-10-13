import type { PricingRates, WizardState } from "./types";

export const APP_NAME = "RoofFlow";
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "roofflow.pl";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${APP_DOMAIN}`;

export const B2C_PRICES = {
  roofOnly: 59,
  roofInsulation: 78,
  roofFacade: 78,
  fullBundle: 87,
  insulationAddon: 19,
  facadeAddon: 19,
} as const;

export const B2B_PRICES = {
  starter: 149,
  insulationAddon: 49,
  facadeAddon: 49,
  pro: 349,
  trialDays: 14,
} as const;

export const ROOF_TYPE_LABELS = {
  gabled: "Dwuspadowy",
  hip: "Kopertowy / Czterospadowy",
  monopitch: "Jednospadowy",
  flat: "Płaski",
} as const;

export const COVERING_LABELS = {
  budget: "Budżetowa blachodachówka",
  standard: "Standardowa dachówka ceramiczna",
  premium: "Premium blacha na rąbek",
} as const;

export const INSULATION_LABELS = {
  wool: "Wełna mineralna",
  pur: "Pianka PUR",
  pir: "Płyty PIR",
} as const;

export const FACADE_LABELS = {
  styrofoam: "Styropian grafitowy",
  wool: "Wełna fasadowa",
} as const;

export const LEAD_STATUS_LABELS = {
  new: "Nowy",
  contacted: "W kontakcie",
  measured: "Pomiar wykonany",
  signed: "Umowa podpisana",
  rejected: "Odrzucony",
} as const;

export const WASTE_MULTIPLIERS = {
  gabled: 1.05,
  hip: 1.12,
  monopitch: 1.03,
  flat: 1.02,
} as const;

export const DEFAULT_PRICING_RATES: PricingRates = {
  baseLaborRate: 80,
  timberRate: 1200,
  tileRates: { budget: 45, standard: 75, premium: 120 },
  insulationRates: { wool: 60, pur: 85, pir: 110 },
  facadeRates: { styrofoam: 90, wool: 140 },
  gutterRatePerM: 45,
  roofWindowRate: 1800,
  plasterRate: 35,
  scaffoldingRate: 25,
  gkFinishRate: 40,
  marginBuffer: 0.08,
};

export const DEFAULT_WIZARD_STATE: WizardState = {
  lengthM: 12,
  widthM: 8,
  roofType: "gabled",
  pitchDeg: 35,
  eavesM: 0.6,
  covering: "standard",
  gutters: true,
  roofWindows: 2,
  insulationEnabled: false,
  insulationMaterial: "wool",
  insulationThicknessCm: 20,
  facadeEnabled: false,
  facadeMaterial: "styrofoam",
  storeyHeightM: 2.8,
  clientName: "",
  clientPhone: "",
  email: "",
  city: "",
  postalCode: "",
  schedule: "",
};

export const STRIPE_PRICE_ENV = {
  b2cRoof: "STRIPE_PRICE_B2C_ROOF",
  b2cInsulation: "STRIPE_PRICE_B2C_INSULATION",
  b2cFacade: "STRIPE_PRICE_B2C_FACADE",
  b2cBundle: "STRIPE_PRICE_B2C_BUNDLE",
  b2bStarter: "STRIPE_PRICE_B2B_STARTER",
  b2bInsulation: "STRIPE_PRICE_B2B_INSULATION",
  b2bFacade: "STRIPE_PRICE_B2B_FACADE",
  b2bPro: "STRIPE_PRICE_B2B_PRO",
} as const;

import Stripe from "stripe";
import { B2C_PRICES, STRIPE_PRICE_ENV } from "./constants";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Brak STRIPE_SECRET_KEY w zmiennych środowiskowych.");
  }
  return new Stripe(key, {
    apiVersion: "2026-09-30.endive",
    typescript: true,
  });
}

export function getB2CLineItems(
  insulationEnabled: boolean,
  facadeEnabled: boolean
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const amount = (() => {
    if (insulationEnabled && facadeEnabled) return B2C_PRICES.fullBundle;
    if (insulationEnabled || facadeEnabled) return B2C_PRICES.roofInsulation;
    return B2C_PRICES.roofOnly;
  })();

  const name =
    insulationEnabled && facadeEnabled
      ? "Pakiet FULL BUNDLE — Dach + Poddasze + Elewacja"
      : insulationEnabled
        ? "Wycena dachu + ocieplenie poddasza"
        : facadeEnabled
          ? "Wycena dachu + ocieplenie elewacji"
          : "Wycena dachu z raportem PDF";

  // Preferuj Price ID z env; w przeciwnym razie ad-hoc price_data.
  const priceId = resolveB2CPriceId(insulationEnabled, facadeEnabled);
  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
  }

  return [
    {
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: amount * 100,
        product_data: {
          name,
          description: "Jednorazowy raport PDF RoofFlow",
        },
      },
    },
  ];
}

function resolveB2CPriceId(
  insulationEnabled: boolean,
  facadeEnabled: boolean
): string | undefined {
  if (insulationEnabled && facadeEnabled) {
    return process.env[STRIPE_PRICE_ENV.b2cBundle];
  }
  if (insulationEnabled) {
    return process.env[STRIPE_PRICE_ENV.b2cInsulation];
  }
  if (facadeEnabled) {
    return process.env[STRIPE_PRICE_ENV.b2cFacade];
  }
  return process.env[STRIPE_PRICE_ENV.b2cRoof];
}

export function getB2BPriceId(
  plan: "starter" | "pro",
  addons: { insulation?: boolean; facade?: boolean }
): { main?: string; addons: string[] } {
  const addonsList: string[] = [];
  if (addons.insulation && process.env[STRIPE_PRICE_ENV.b2bInsulation]) {
    addonsList.push(process.env[STRIPE_PRICE_ENV.b2bInsulation]!);
  }
  if (addons.facade && process.env[STRIPE_PRICE_ENV.b2bFacade]) {
    addonsList.push(process.env[STRIPE_PRICE_ENV.b2bFacade]!);
  }

  const main =
    plan === "pro"
      ? process.env[STRIPE_PRICE_ENV.b2bPro]
      : process.env[STRIPE_PRICE_ENV.b2bStarter];

  return { main, addons: addonsList };
}

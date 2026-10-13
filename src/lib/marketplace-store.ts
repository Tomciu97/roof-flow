/**
 * Magazyn marketplace (demo in-memory + opcjonalnie Supabase).
 * Pozwala kliknąć cały flow bez bazy.
 */

import { matchLocations } from "./location";
import type { CalculationBreakdown, WizardState } from "./types";

export type MarketplaceRequestStatus = "open" | "closed";
export type OfferStatus = "pending" | "accepted" | "rejected";

export interface MarketplaceRequest {
  id: string;
  stripeSessionId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  city: string;
  postalCode: string;
  schedule: string;
  state: WizardState;
  result: CalculationBreakdown;
  amountPaid: number;
  status: MarketplaceRequestStatus;
  createdAt: string;
}

export interface MarketplaceOffer {
  id: string;
  requestId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPhone: string;
  tenantCity: string;
  priceOffered: number;
  message: string;
  materialsNote: string;
  scheduleNote: string;
  status: OfferStatus;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  postalCode: string;
  plan: "starter" | "pro";
  brandColor: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __rfMarketplace:
    | {
        requests: MarketplaceRequest[];
        offers: MarketplaceOffer[];
        companies: CompanyProfile[];
      }
    | undefined;
}

function store() {
  if (!globalThis.__rfMarketplace) {
    globalThis.__rfMarketplace = {
      requests: [],
      offers: [],
      companies: seedCompanies(),
    };
  }
  return globalThis.__rfMarketplace;
}

function seedCompanies(): CompanyProfile[] {
  return [
    {
      id: "co-krakow-1",
      name: "Dekarz Marian",
      slug: "dekarz-marian",
      phone: "+48 500 100 200",
      city: "Kraków",
      postalCode: "30-001",
      plan: "pro",
      brandColor: "#0f766e",
    },
    {
      id: "co-krakow-2",
      name: "Dachy Małopolska",
      slug: "dachy-malopolska",
      phone: "+48 501 222 333",
      city: "Kraków",
      postalCode: "30-612",
      plan: "starter",
      brandColor: "#0369a1",
    },
    {
      id: "co-krakow-3",
      name: "Solidny Dach Kraków",
      slug: "solidny-dach",
      phone: "+48 504 888 999",
      city: "Wieliczka",
      postalCode: "30-001",
      plan: "pro",
      brandColor: "#0d9488",
    },
    {
      id: "co-wawa-1",
      name: "Warszawski Dach PRO",
      slug: "warszawski-dach",
      phone: "+48 502 444 555",
      city: "Warszawa",
      postalCode: "00-001",
      plan: "pro",
      brandColor: "#b45309",
    },
    {
      id: "co-wro-1",
      name: "Elewacje & Dachy Wrocław",
      slug: "dachy-wroclaw",
      phone: "+48 503 666 777",
      city: "Wrocław",
      postalCode: "50-001",
      plan: "starter",
      brandColor: "#7c3aed",
    },
  ];
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function listCompanies() {
  return store().companies;
}

export function upsertCompany(company: CompanyProfile) {
  const s = store();
  const idx = s.companies.findIndex((c) => c.id === company.id || c.slug === company.slug);
  if (idx >= 0) {
    // Zachowaj stabilne id seeda przy merge po slug
    const prev = s.companies[idx];
    s.companies[idx] = { ...prev, ...company, id: prev.id };
    return s.companies[idx];
  }
  s.companies.push(company);
  return company;
}

export function createMarketplaceRequest(
  input: Omit<MarketplaceRequest, "id" | "status" | "createdAt">
): MarketplaceRequest {
  const req: MarketplaceRequest = {
    ...input,
    id: uid("req"),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  store().requests.unshift(req);
  return req;
}

export function getRequestBySession(sessionId: string) {
  return store().requests.find((r) => r.stripeSessionId === sessionId) || null;
}

export function getRequestById(id: string) {
  return store().requests.find((r) => r.id === id) || null;
}

export function matchCompaniesForRequest(request: MarketplaceRequest) {
  return store()
    .companies.map((company) => {
      const match = matchLocations(
        { city: request.city, postalCode: request.postalCode },
        { city: company.city, postalCode: company.postalCode }
      );
      return { company, match };
    })
    .filter((x) => x.match.matched);
}

export function listRequestsForCompany(company: {
  city?: string | null;
  postalCode?: string | null;
  id?: string;
}) {
  return store()
    .requests.filter((r) => r.status === "open")
    .map((request) => {
      const match = matchLocations(
        { city: request.city, postalCode: request.postalCode },
        { city: company.city, postalCode: company.postalCode }
      );
      return { request, match };
    })
    .filter((x) => x.match.matched);
}

export function createOffer(
  input: Omit<MarketplaceOffer, "id" | "status" | "createdAt">
): MarketplaceOffer {
  const offer: MarketplaceOffer = {
    ...input,
    id: uid("off"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store().offers.unshift(offer);
  return offer;
}

export function listOffersForRequest(requestId: string) {
  return store().offers.filter((o) => o.requestId === requestId);
}

export function listOffersForCompany(tenantId: string) {
  return store().offers.filter((o) => o.tenantId === tenantId);
}

export function updateOfferStatus(offerId: string, status: OfferStatus) {
  const offer = store().offers.find((o) => o.id === offerId);
  if (!offer) return null;
  offer.status = status;
  if (status === "accepted") {
    // Odrzuć pozostałe pending dla tego requestu
    store().offers.forEach((o) => {
      if (o.requestId === offer.requestId && o.id !== offerId && o.status === "pending") {
        o.status = "rejected";
      }
    });
    const req = getRequestById(offer.requestId);
    if (req) req.status = "closed";
  }
  return offer;
}

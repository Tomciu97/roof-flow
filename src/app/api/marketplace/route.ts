import { NextResponse } from "next/server";
import {
  createOffer,
  getRequestById,
  getRequestBySession,
  listOffersForRequest,
  listRequestsForCompany,
  matchCompaniesForRequest,
  updateOfferStatus,
  upsertCompany,
} from "@/lib/marketplace-store";
import { sendOfferToClientEmail } from "@/lib/email";
import { APP_URL } from "@/lib/constants";

/** GET — dane zapytania + oferty (klient) lub lista zapytań (firma) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const requestId = searchParams.get("request_id");
  const forCompany = searchParams.get("for_company");

  if (forCompany === "1") {
    const city = searchParams.get("city") || "";
    const postal = searchParams.get("postal") || "";
    const items = listRequestsForCompany({ city, postalCode: postal });
    return NextResponse.json({
      items: items.map(({ request, match }) => ({
        request,
        matchReason: match.reason,
        matchLabel: match.label,
        offersCount: listOffersForRequest(request.id).length,
      })),
    });
  }

  const req = sessionId
    ? getRequestBySession(sessionId)
    : requestId
      ? getRequestById(requestId)
      : null;

  if (!req) {
    return NextResponse.json(
      { error: "Nie znaleziono zapytania marketplace" },
      { status: 404 }
    );
  }

  const matches = matchCompaniesForRequest(req);
  const offers = listOffersForRequest(req.id);

  return NextResponse.json({
    request: req,
    matchedCompanies: matches.map(({ company, match }) => ({
      ...company,
      matchReason: match.reason,
      matchLabel: match.label,
    })),
    offers,
  });
}

/** POST — firma składa ofertę */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      requestId,
      tenantId,
      tenantName,
      tenantSlug,
      tenantPhone,
      tenantCity,
      tenantPostal,
      priceOffered,
      message,
      materialsNote,
      scheduleNote,
    } = body as {
      requestId: string;
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      tenantPhone?: string;
      tenantCity?: string;
      tenantPostal?: string;
      priceOffered: number;
      message?: string;
      materialsNote?: string;
      scheduleNote?: string;
    };

    if (!requestId || !tenantId || !tenantName || !priceOffered) {
      return NextResponse.json(
        { error: "Brakuje danych oferty" },
        { status: 400 }
      );
    }

    const req = getRequestById(requestId);
    if (!req || req.status !== "open") {
      return NextResponse.json(
        { error: "Zapytanie jest niedostępne" },
        { status: 404 }
      );
    }

    upsertCompany({
      id: tenantId,
      name: tenantName,
      slug: tenantSlug || tenantId,
      phone: tenantPhone || "",
      city: tenantCity || "",
      postalCode: tenantPostal || "",
      plan: "starter",
      brandColor: "#0f766e",
    });

    const offer = createOffer({
      requestId,
      tenantId,
      tenantName,
      tenantSlug: tenantSlug || tenantId,
      tenantPhone: tenantPhone || "",
      tenantCity: tenantCity || "",
      priceOffered: Number(priceOffered),
      message: message || "",
      materialsNote: materialsNote || "",
      scheduleNote: scheduleNote || "",
    });

    try {
      await sendOfferToClientEmail({
        to: req.clientEmail,
        tenantName,
        tenantPhone,
        priceOffered: Number(priceOffered),
        message,
        offersUrl: `${APP_URL}/wycena-inwestor/oferty?session_id=${req.stripeSessionId}`,
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd oferty" },
      { status: 500 }
    );
  }
}

/** PATCH — klient akceptuje / odrzuca ofertę */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { offerId, status } = body as {
      offerId: string;
      status: "accepted" | "rejected";
    };
    if (!offerId || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
    }
    const offer = updateOfferStatus(offerId, status);
    if (!offer) {
      return NextResponse.json({ error: "Nie znaleziono oferty" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd" },
      { status: 500 }
    );
  }
}

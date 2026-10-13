import { Resend } from "resend";
import { APP_NAME } from "./constants";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  `${APP_NAME} <powiadomienia@roofflow.pl>`;

export async function sendInvestorReportEmail(opts: {
  to: string;
  pdfBuffer: Buffer;
  priceMin: number;
  priceMax: number;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY brak — pomijam wysyłkę e-mail.");
    return { skipped: true as const };
  }

  const { priceMin, priceMax } = opts;
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Twój raport wyceny ${APP_NAME}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h1 style="font-size:22px">Dziękujemy za zakup raportu</h1>
        <p>W załączniku znajdziesz szczegółową wycenę dachu, ocieplenia i elewacji.</p>
        <p><strong>Szacowany zakres kosztów:</strong> ${Math.round(priceMin)} – ${Math.round(priceMax)} zł</p>
        <p>Raport ma charakter orientacyjny i nie stanowi oferty handlowej.</p>
        <p style="color:#64748b;font-size:13px">Zespół ${APP_NAME}</p>
      </div>
    `,
    attachments: [
      {
        filename: "raport-roofflow.pdf",
        content: opts.pdfBuffer,
      },
    ],
  });
}

export async function sendLeadNotificationEmail(opts: {
  to: string;
  tenantName: string;
  clientName: string;
  clientPhone: string;
  location?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Nowy lead: ${opts.clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h1>Nowy lead w ${APP_NAME}</h1>
        <p>Firma: <strong>${opts.tenantName}</strong></p>
        <ul>
          <li>Klient: ${opts.clientName}</li>
          <li>Telefon: ${opts.clientPhone}</li>
          <li>Miejscowość: ${opts.location || "—"}</li>
          <li>Budżet: ${opts.priceMin ? `${Math.round(opts.priceMin)} – ${Math.round(opts.priceMax || 0)} zł` : "—"}</li>
        </ul>
      </div>
    `,
  });
}

export async function sendLeadReceiptEmail(opts: {
  to: string;
  tenantName: string;
  tenantPhone?: string | null;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Potwierdzenie zapytania — ${opts.tenantName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h1>Dziękujemy za zapytanie</h1>
        <p>Twoje zgłoszenie trafiło do firmy <strong>${opts.tenantName}</strong>.</p>
        ${opts.tenantPhone ? `<p>Kontakt: ${opts.tenantPhone}</p>` : ""}
        <p>Odezwiemy się wkrótce z propozycją wyceny i terminem pomiaru.</p>
      </div>
    `,
  });
}

export async function sendOfferToClientEmail(opts: {
  to: string;
  tenantName: string;
  tenantPhone?: string | null;
  priceOffered: number;
  message?: string;
  offersUrl: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Nowa oferta od ${opts.tenantName} — RoofFlow`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h1 style="font-size:20px">Firma złożyła ofertę na Twoją wycenę</h1>
        <p><strong>${opts.tenantName}</strong> proponuje: <strong>${Math.round(opts.priceOffered).toLocaleString("pl-PL")} zł</strong></p>
        ${opts.tenantPhone ? `<p>Telefon: ${opts.tenantPhone}</p>` : ""}
        ${opts.message ? `<p>${opts.message}</p>` : ""}
        <p><a href="${opts.offersUrl}">Zobacz oferty i wybierz firmę</a></p>
      </div>
    `,
  });
}

/** Powiadomienie firmy: nowy klient marketplace w okolicy */
export async function sendNewMarketplaceClientEmail(opts: {
  to: string;
  companyName: string;
  clientCity: string;
  clientPostal: string;
  schedule?: string;
  priceMin: number;
  priceMax: number;
  dashboardUrl: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Nowy klient w okolicy (${opts.clientPostal} ${opts.clientCity})`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h1 style="font-size:20px">Pojawił się nowy klient w Twojej okolicy</h1>
        <p>Cześć <strong>${opts.companyName}</strong> — inwestor kupił wycenę RoofFlow i szuka wykonawcy.</p>
        <ul>
          <li>Lokalizacja: ${opts.clientPostal} ${opts.clientCity}</li>
          ${opts.schedule ? `<li>Termin: ${opts.schedule}</li>` : ""}
          <li>Widełki z raportu: ${Math.round(opts.priceMin).toLocaleString("pl-PL")} – ${Math.round(opts.priceMax).toLocaleString("pl-PL")} zł</li>
        </ul>
        <p><a href="${opts.dashboardUrl}">Zobacz zapytanie i zaproponuj cenę</a></p>
      </div>
    `,
  });
}

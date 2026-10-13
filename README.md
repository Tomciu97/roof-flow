# RoofFlow

Wielonajemcza platforma SaaS (B2B/B2C) do wyceny **dachu, ocieplenia poddasza i elewacji**.  
Cały interfejs jest po polsku. Hosting: **Vercel** (Next.js App Router).

## Stack

- **Next.js 16** (App Router, `proxy.ts` multi-tenant)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Stripe** (Checkout B2C/B2B, Customer Portal, webhooks)
- **@react-pdf/renderer** (raporty PDF)
- **Resend** (e-mail)
- **Vercel Blob** (logo i pliki projektów)
- **Vercel Domains API** (własne domeny PRO)

## Szybki start

```bash
cp .env.example .env.local
npm install
npm run dev
```

1. Wklej schemat SQL z `supabase/schema.sql` w SQL Editor Supabase.
2. Uzupełnij klucze w `.env.local`.
3. W Stripe ustaw webhook na `/api/webhooks/stripe`.

Bez kluczy zewnętrznych aplikacja działa w **trybie demo** (landing, wizard, dashboard z przykładowymi leadami, mock checkout B2C).

## Routing najemców

- Path: `roofflow.pl/firmy/[slug]`
- Subdomena: `dekarz-marian.roofflow.pl` → rewrite do `/firmy/dekarz-marian` (`src/proxy.ts`)
- Custom domain (PRO): `POST /api/domains` → Vercel Domains API

## Główne ścieżki

| Ścieżka | Opis |
|--------|------|
| `/` | Landing SEO |
| `/wycena-inwestor` | Wizard B2C + Stripe |
| `/firmy/[slug]` | Widget dekarza (lead gate) |
| `/rejestracja-b2b` | Rejestracja + trial 14 dni |
| `/dashboard` | CRM leadów |
| `/dashboard/cennik` | Stawki firmy |
| `/dashboard/widget` | Branding + iframe |
| `/dashboard/platnosci` | Stripe Portal + domena |

## Silnik przeliczeń

`src/lib/calculator.ts` — geometria połaci, odpady, izolacja ×1.15, elewacja netto ×0.85, widełka ± bufor.

```bash
npm run test:calc
```

## Deploy Vercel

1. Podłącz repozytorium.
2. Ustaw zmienne z `.env.example`.
3. Domain: `roofflow.pl` + wildcard `*.roofflow.pl` dla subdomen.
4. Uruchom `supabase/schema.sql`.

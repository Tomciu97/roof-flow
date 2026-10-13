import Link from "next/link";
import { B2B_PRICES, B2C_PRICES, APP_NAME, APP_URL } from "@/lib/constants";
import { Check, ArrowRight } from "lucide-react";
import {
  B2BAddonsList,
  B2BPlanCards,
  B2CPackageCards,
} from "@/components/marketing/plan-cards";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "pl-PL",
  url: APP_URL,
  description:
    "Interaktywny kalkulator budowy dachu, ocieplenia poddasza i elewacji. SaaS dla dekarzy oraz wycena PDF dla inwestorów.",
  offers: [
    {
      "@type": "Offer",
      name: "Wycena dachu B2C",
      price: String(B2C_PRICES.roofOnly),
      priceCurrency: "PLN",
    },
    {
      "@type": "Offer",
      name: "Plan STARTER B2B",
      price: String(B2B_PRICES.starter),
      priceCurrency: "PLN",
      billingIncrement: "P1M",
    },
    {
      "@type": "Offer",
      name: "Plan PRO ALL-IN-ONE",
      price: String(B2B_PRICES.pro),
      priceCurrency: "PLN",
      billingIncrement: "P1M",
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO — pełna wysokość, brand first, jeden CTA cluster */}
      <section className="relative min-h-[100svh] overflow-hidden rf-grain">
        <div className="absolute inset-0 rf-hero-grid" aria-hidden />
        <div
          className="absolute inset-0 animate-pan"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(11,31,28,0.55), rgba(11,31,28,0.25)), url('https://images.unsplash.com/photo-1635424710928-0544e8512eae?auto=format&fit=crop&w=2400&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24">
          <p className="animate-rise font-display text-5xl font-semibold text-white md:text-7xl lg:text-8xl">
            {APP_NAME}
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-3xl text-2xl font-medium leading-snug text-white/95 md:text-4xl">
            Interaktywny Kalkulator Budowy Dachu, Ocieplenia Poddasza i Elewacji
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-white/80 md:text-lg">
            Od szybkiej wyceny PDF dla inwestora po whitelabel CRM dla firmy
            dekarskiej — jeden silnik przeliczeń, zero ręcznego liczenia.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/rejestracja-b2b"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--rf-accent)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--rf-accent-hover)]"
            >
              Wypróbuj za darmo jako Wykonawca (14 Dni Gratis)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wycena-inwestor"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Szybka Wycena Inwestorska z Raportem PDF
            </Link>
          </div>
        </div>
      </section>

      {/* B2B */}
      <section id="funkcje" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--rf-accent)]">
          Dla firm dekarskich
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-5xl">
          Odsiewaj przypadkowe zapytania. Zbieraj gotowe leady.
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--rf-muted)]">
          Widget na Twojej stronie, automatyczny CRM i stawki firmy — inwestor
          liczy, Ty dostajesz kontakt z budżetem.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {[
            {
              t: "Odsiewanie zapytań",
              d: "Klient podaje wymiary i materiały zanim do Ciebie napisze — mniej pustych telefonów.",
            },
            {
              t: "Widget na własną WWW",
              d: "Osadź iframe na WordPressie, Wixie lub HTML. Na PRO — własna domena przez Vercel.",
            },
            {
              t: "Automatyczny CRM",
              d: "Leady ze statusami, szacunkiem budżetu i załączonym projektem w jednym panelu.",
            },
            {
              t: "Klienci z okolicy",
              d: "Po zakupie wyceny B2C widzisz inwestorów w Twoim regionie i składasz własną ofertę cenową.",
            },
          ].map((item) => (
            <li key={item.t} className="border-t border-[var(--rf-border)] pt-6">
              <h3 className="font-display text-xl font-semibold">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
                {item.d}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* B2C */}
      <section
        id="inwestorzy"
        className="border-y border-[var(--rf-border)] bg-[var(--rf-sand)]/60"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--rf-copper)]">
            Dla inwestorów
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-5xl">
            Wycena PDF i konkurs ofert firm z okolicy
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--rf-muted)]">
            Podajesz miasto i kod pocztowy, płacisz za raport — a lokalne firmy
            mogą zaproponować własną cenę materiałów i robocizny. Na stronie
            wykonawcy wycena z widgetu jest darmowa (płaci firma).
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "Raport PDF z widełkami kosztów",
              "Dopasowanie firm po kodzie pocztowym",
              "Oferty: niższa cena, inne materiały, termin",
              "Akceptujesz lub odrzucasz wykonawcę",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-accent)]" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/wycena-inwestor"
            className="mt-10 inline-flex items-center gap-2 font-semibold text-[var(--rf-accent)] hover:underline"
          >
            Rozpocznij wycenę
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CENNIK */}
      <section id="cennik" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <h2 className="font-display text-3xl font-semibold md:text-5xl">Cennik</h2>
        <p className="mt-3 max-w-2xl text-[var(--rf-muted)]">
          Jasno widać, co dostajesz — zarówno przy jednorazowym raporcie PDF, jak i przy
          abonamencie dla firmy dekarskiej.
        </p>

        <div className="mt-14 space-y-16">
          <div>
            <h3 className="font-display text-2xl font-semibold">Inwestor (B2C)</h3>
            <p className="mt-2 text-sm text-[var(--rf-muted)]">
              Jednorazowa płatność Stripe · raport PDF + konkurs ofert lokalnych firm
            </p>
            <div className="mt-6">
              <B2CPackageCards />
            </div>
            <Link
              href="/wycena-inwestor"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--rf-accent)] hover:underline"
            >
              Przejdź do wyceny inwestorskiej
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold">Wykonawca (B2B SaaS)</h3>
            <p className="mt-2 text-sm text-[var(--rf-muted)]">
              Subskrypcja Stripe · 14 dni gratis · miesięcznie albo rocznie z góry (−20% na każdy miesiąc)
            </p>
            <div className="mt-6">
              <B2BPlanCards ctaHref="/rejestracja-b2b" />
            </div>
            <B2BAddonsList />
          </div>
        </div>
      </section>
    </>
  );
}

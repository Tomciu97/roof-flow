"use client";

import { Check, Minus } from "lucide-react";
import {
  B2B_ADDONS,
  B2B_PLANS,
  B2C_PACKAGES,
  computeB2BMonthly,
  type B2BAddonSelection,
  type B2BPlanId,
} from "@/lib/plans";
import { B2B_PRICES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function B2BPlanCards({
  selected,
  onSelect,
  interactive = false,
  ctaHref,
}: {
  selected?: B2BPlanId;
  onSelect?: (id: B2BPlanId) => void;
  interactive?: boolean;
  ctaHref?: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {B2B_PLANS.map((plan) => {
        const active = selected === plan.id;
        const Wrapper = interactive ? "button" : "div";
        return (
          <Wrapper
            key={plan.id}
            type={interactive ? "button" : undefined}
            onClick={interactive && onSelect ? () => onSelect(plan.id) : undefined}
            className={cn(
              "relative flex h-full flex-col rounded-2xl border bg-white p-6 text-left transition",
              plan.highlighted
                ? "border-[var(--rf-ink)] shadow-[0_20px_50px_-28px_rgba(11,31,28,0.55)]"
                : "border-[var(--rf-border)]",
              interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
              active && "ring-2 ring-[var(--rf-accent)] ring-offset-2"
            )}
          >
            {plan.badge ? (
              <span
                className={cn(
                  "absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold",
                  plan.highlighted
                    ? "bg-[var(--rf-accent)] text-white"
                    : "bg-[var(--rf-sand)] text-[var(--rf-ink)]"
                )}
              >
                {plan.badge}
              </span>
            ) : null}

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {plan.name}
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-display text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              <span className="mb-1 text-sm text-[var(--rf-muted)]">{plan.period}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--rf-ink)]">{plan.tagline}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              {plan.description}
            </p>

            <ul className="mt-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-accent)]" />
                  <span>{f}</span>
                </li>
              ))}
              {plan.missing.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-400">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {interactive ? (
              <span
                className={cn(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold",
                  active || plan.highlighted
                    ? "bg-[var(--rf-ink)] text-white"
                    : "border border-[var(--rf-border)] bg-[var(--rf-sand)]/50"
                )}
              >
                {active ? "Wybrany plan" : plan.cta}
              </span>
            ) : ctaHref ? (
              <Link
                href={`${ctaHref}?plan=${plan.id}`}
                className={cn(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold",
                  plan.highlighted
                    ? "bg-[var(--rf-ink)] text-white hover:bg-slate-800"
                    : "border border-[var(--rf-border)] hover:bg-[var(--rf-sand)]/60"
                )}
              >
                {plan.cta}
              </Link>
            ) : null}
          </Wrapper>
        );
      })}
    </div>
  );
}

/** Statyczna lista na landing — bez wyboru. */
export function B2BAddonsList() {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-[var(--rf-muted)]">
        Do planu STARTER możesz dokładać moduły (po {B2B_PRICES.insulationAddon}{" "}
        zł). Gdy weźmiesz oba — drugi w promocji −50%. W PRO wszystko w cenie.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {B2B_ADDONS.map((addon) => (
          <div
            key={addon.id}
            className="rounded-xl border border-dashed border-[var(--rf-border)] bg-white/70 px-4 py-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">{addon.name}</p>
              <p className="font-display text-lg font-semibold">+{addon.price} zł</p>
            </div>
            <p className="mt-1 text-sm text-[var(--rf-muted)]">{addon.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              opcjonalnie do STARTER · w PRO w cenie
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Interaktywny wybór add-onów przy rejestracji. */
export function B2BAddonPicker({
  plan,
  value,
  onChange,
}: {
  plan: B2BPlanId;
  value: B2BAddonSelection;
  onChange: (next: B2BAddonSelection) => void;
}) {
  const pricing = computeB2BMonthly({ plan, addons: value });
  const isPro = plan === "pro";

  function toggle(id: keyof B2BAddonSelection) {
    if (isPro) return;
    onChange({ ...value, [id]: !value[id] });
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold">
          1b. Moduły dodatkowe
        </h3>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          {isPro
            ? "W PRO masz poddasze i elewację w cenie — nic nie dokładasz."
            : "Robisz tylko dach? Zostaw odznaczone. Dach + elewacja albo poddasze — zaznacz wybrany add-on. Całość (oba) = promocja −50% na drugi."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {B2B_ADDONS.map((addon) => {
          const checked = isPro || value[addon.id];
          const isDiscounted =
            !isPro &&
            pricing.bundlePromo &&
            pricing.discountedAddon === addon.id;
          const displayPrice = isPro
            ? 0
            : isDiscounted
              ? B2B_PRICES.addonBundleHalfPrice
              : addon.price;

          return (
            <button
              key={addon.id}
              type="button"
              disabled={isPro}
              onClick={() => toggle(addon.id)}
              className={cn(
                "rounded-xl border px-4 py-4 text-left transition",
                checked
                  ? "border-[var(--rf-accent)] bg-teal-50/60 ring-1 ring-[var(--rf-accent)]"
                  : "border-[var(--rf-border)] bg-white hover:border-slate-300",
                isPro && "cursor-default opacity-90"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-[var(--rf-accent)] bg-[var(--rf-accent)] text-white"
                      : "border-slate-300 bg-white"
                  )}
                  aria-hidden
                >
                  {checked ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{addon.name}</p>
                    <p className="font-display text-lg font-semibold">
                      {isPro ? (
                        <span className="text-sm font-semibold text-[var(--rf-accent)]">
                          w cenie
                        </span>
                      ) : isDiscounted ? (
                        <span>
                          <span className="mr-1.5 text-sm font-normal text-slate-400 line-through">
                            {addon.price} zł
                          </span>
                          +{displayPrice} zł
                        </span>
                      ) : (
                        <>+{displayPrice} zł</>
                      )}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--rf-muted)]">
                    {addon.description}
                  </p>
                  {isDiscounted ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--rf-accent)]">
                      Promocja pakietu −50%
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!isPro && pricing.bundlePromo ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Pakiet całościowy: STARTER + poddasze + elewacja. Drugi add-on za{" "}
          {B2B_PRICES.addonBundleHalfPrice} zł zamiast {B2B_PRICES.facadeAddon}{" "}
          zł (−50%). Razem{" "}
          <strong>
            {pricing.total.toLocaleString("pl-PL", {
              minimumFractionDigits: pricing.total % 1 ? 1 : 0,
            })}{" "}
            zł / m-c
          </strong>
          .
        </p>
      ) : (
        <p className="text-sm text-[var(--rf-muted)]">
          Suma miesięczna po trialu:{" "}
          <strong className="text-[var(--rf-ink)]">
            {pricing.total.toLocaleString("pl-PL", {
              minimumFractionDigits: pricing.total % 1 ? 1 : 0,
            })}{" "}
            zł
          </strong>
          {isPro
            ? " (PRO ALL-IN-ONE)"
            : value.insulation || value.facade
              ? " (STARTER + wybrane add-ony)"
              : " (sam STARTER — tylko dach)"}
        </p>
      )}
    </div>
  );
}

export function B2CPackageCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {B2C_PACKAGES.map((pkg) => (
        <div
          key={pkg.id}
          className={cn(
            "rounded-2xl border bg-white p-5",
            "promo" in pkg && pkg.promo
              ? "border-[var(--rf-ink)] bg-[var(--rf-ink)] text-white"
              : "border-[var(--rf-border)]"
          )}
        >
          {"promo" in pkg && pkg.promo ? (
            <span className="mb-3 inline-block rounded-full bg-[var(--rf-accent)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              Promocja
            </span>
          ) : null}
          <p className="font-display text-xl font-semibold">{pkg.name}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{pkg.price} zł</p>
          <p
            className={cn(
              "mt-2 text-sm",
              "promo" in pkg && pkg.promo ? "text-white/75" : "text-[var(--rf-muted)]"
            )}
          >
            {pkg.description}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {pkg.includes.map((i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 opacity-80" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

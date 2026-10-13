/** Normalizacja i dopasowanie lokalizacji PL (kod pocztowy + miasto). */

export function normalizeCity(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePostal(postal: string): string {
  return postal.replace(/\s+/g, "").toUpperCase();
}

/** Akceptuje 12-345 lub 12345 → 12-345 */
export function formatPostal(postal: string): string {
  const digits = postal.replace(/\D/g, "").slice(0, 5);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export function isValidPostal(postal: string): boolean {
  return /^\d{2}-\d{3}$/.test(normalizePostal(postal));
}

/** Prefiks regionu pocztowego (pierwsze 2 cyfry). */
export function postalRegion(postal: string): string {
  return normalizePostal(postal).replace("-", "").slice(0, 2);
}

export type MatchReason = "city" | "postal_region";

export function matchLocations(
  client: { city: string; postalCode: string },
  company: { city?: string | null; postalCode?: string | null; serviceRadiusKm?: number | null }
): { matched: boolean; reason?: MatchReason; label: string } {
  const cCity = normalizeCity(client.city || "");
  const cPostal = normalizePostal(client.postalCode || "");
  const tCity = normalizeCity(company.city || "");
  const tPostal = normalizePostal(company.postalCode || "");

  if (!cCity && !cPostal) {
    return { matched: false, label: "Brak lokalizacji klienta" };
  }

  // Firma musi podać siedzibę — inaczej nie dostaje leadów marketplace
  if (!tCity && !tPostal) {
    return {
      matched: false,
      label: "Uzupełnij miasto i kod pocztowy siedziby firmy",
    };
  }

  if (cCity && tCity && cCity === tCity) {
    return { matched: true, reason: "city", label: `To samo miasto: ${client.city}` };
  }

  if (
    cPostal.length >= 2 &&
    tPostal.length >= 2 &&
    postalRegion(cPostal) === postalRegion(tPostal)
  ) {
    return {
      matched: true,
      reason: "postal_region",
      label: `Ten sam region pocztowy (${postalRegion(cPostal)})`,
    };
  }

  return { matched: false, label: "Poza zasięgiem firmy" };
}

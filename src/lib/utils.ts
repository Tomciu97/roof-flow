import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isRootDomainHost(host: string, rootDomain: string): boolean {
  const clean = host.split(":")[0].toLowerCase();
  return (
    clean === rootDomain ||
    clean === `www.${rootDomain}` ||
    clean === "localhost" ||
    clean.endsWith(".vercel.app") ||
    clean.startsWith("127.0.0.1")
  );
}

export function extractSubdomain(
  host: string,
  rootDomain: string
): string | null {
  const clean = host.split(":")[0].toLowerCase();
  if (isRootDomainHost(clean, rootDomain)) return null;
  if (clean.endsWith(`.${rootDomain}`)) {
    const sub = clean.slice(0, -(rootDomain.length + 1));
    if (!sub || sub === "www" || sub.includes(".")) return null;
    return sub;
  }
  return null;
}

export function tenantPublicUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "roofflow.pl";
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`;
  return `${base}/firmy/${slug}`;
}

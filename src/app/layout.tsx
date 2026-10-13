import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_URL } from "@/lib/constants";

const body = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Kalkulator dachu, poddasza i elewacji`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Interaktywny kalkulator budowy dachu, ocieplenia poddasza i elewacji. Wycena PDF dla inwestorów oraz SaaS CRM dla dekarzy.",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Kalkulator dachu, poddasza i elewacji`,
    description:
      "Wycena dachu z raportem PDF. Platforma B2B dla dekarzy z widgetem, CRM leadów i własną domeną.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Kalkulator dachu`,
    description: "Wycena dachu, poddasza i elewacji online.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

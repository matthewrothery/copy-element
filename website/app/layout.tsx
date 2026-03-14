import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.example.com";

export const metadata: Metadata = {
  title: "Element Armory – Capture UI Elements",
  description:
    "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Element Armory – Capture UI Elements",
    description: "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
    url: BASE_URL,
    siteName: "Element Armory",
    type: "website",
    images: [],
  },
  twitter: {
    card: "summary_large_image",
    title: "Element Armory – Capture UI Elements",
    description: "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
  },
  alternates: { canonical: BASE_URL },
  robots: { index: true, follow: true },
};

// <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: "no" };


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta name="description" content="Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful." />
        <meta name="keywords" content="UI, design, development, AI, automation, productivity" />
        <meta name="author" content="Element Armory" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="yandexbot" content="index, follow" />
      </head>
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

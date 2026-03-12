import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
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

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

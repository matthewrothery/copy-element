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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Element Armory – Capture UI Elements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Element Armory – Capture UI Elements",
    description: "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = { width: "device-width", initialScale: 1 };


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta name="keywords" content="UI capture, HTML copy, JSX copy, AI UI prompts, Chrome extension, developer tools" />
        <meta name="author" content="Element Armory" />
        <link rel="alternate" type="application/rss+xml" title="Element Armory Blog" href={`${BASE_URL}/rss.xml`} />
      </head>
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

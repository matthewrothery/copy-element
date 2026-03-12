import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementcapture.example.com";

export const metadata: Metadata = {
  title: "Element Capture – Copy any element. One click.",
  description:
    "Chrome extension to copy any webpage element as clean HTML or JSX. Capture, save, and reuse UI components with minimal output. No bloat.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Element Capture – Copy any element. One click.",
    description:
      "Chrome extension to copy any webpage element as clean HTML or JSX. Capture, save, and reuse.",
    url: BASE_URL,
    siteName: "Element Capture",
    type: "website",
    images: [],
  },
  twitter: {
    card: "summary_large_image",
    title: "Element Capture – Copy any element. One click.",
    description: "Chrome extension to copy any webpage element as clean HTML or JSX.",
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

import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics/Analytics";
import { PlausibleAnalytics } from "@/components/PlausibleAnalytics";
import { SITE_URL } from "@/lib/publicConfig";
import {
  DEFAULT_OG_IMAGE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_BRAND,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_BRAND,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: HOME_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
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
        <meta name="keywords" content="UI capture, HTML copy, AI UI prompts, Chrome extension, developer tools" />
        <meta name="author" content="Element Armory" />
        <link rel="alternate" type="application/rss+xml" title="Element Armory Blog" href={`${SITE_URL}/rss.xml`} />
      </head>
      <body>
        <JsonLd />
        <Analytics />
        <PlausibleAnalytics />
        {children}
      </body>
    </html>
  );
}

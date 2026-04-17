# Element Armory – Marketing Website

Static Next.js site for Element Armory – Capture UI Elements. Screen Studio–inspired design, SEO-optimized, no Tailwind.

## Setup

```bash
cd website
npm install
```

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build (static export)

```bash
npm run build
```

Output is in `out/`. Serve with any static host.

## Environment (optional)

- `NEXT_PUBLIC_SITE_URL` – Canonical URL (metadata, sitemap, robots). Default: `https://elementcapture.example.com`
- `NEXT_PUBLIC_CHROME_STORE_URL` – Chrome Web Store link for “Add to Chrome”. Default: official Element Armory Chrome Web Store URL

## Tech

- Next.js 16 (App Router), TypeScript, React
- CSS only (tokens, base, components in `styles/`)
- Static export (`output: 'export'`)

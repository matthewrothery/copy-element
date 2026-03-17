import type { ElementItem } from "./types";

/**
 * Mock API — replace with real fetch when backend is ready.
 * Real endpoints: GET /api/elements, GET /api/elements/:id
 */
export async function fetchElements(): Promise<ElementItem[]> {
  await delay(300);
  return [
    {
      id: "1",
      name: "Navbar",
      html: "<nav>...</nav>",
      css: ".nav { }",
      preview: "",
      createdAt: "2026-01-15",
      sourceUrl: "https://example.com",
    },
    {
      id: "2",
      name: "Button primary",
      html: "<button>Click</button>",
      css: "button { }",
      preview: "",
      createdAt: "2026-01-14",
      sourceUrl: "https://example.com",
    },
    {
      id: "3",
      name: "Card with image",
      html: "<div class=\"card\">...</div>",
      css: ".card { }",
      preview: "",
      createdAt: "2026-01-13",
    },
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

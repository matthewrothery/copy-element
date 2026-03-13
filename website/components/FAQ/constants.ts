import type { FAQItem } from "./types";

export const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Element Armory?",
    answer:
      "Element Armory is a Chrome extension that lets you capture any UI element from a webpage and copy it as clean HTML or React JSX. You can save snippets to a library and reuse them in your projects or with AI tools.",
  },
  {
    question: "How does capture work?",
    answer:
      "Install the extension, then click any element on a page. Element Armory copies it with minimal, portable styles—only display, layout, typography, and color. No scripts, trackers, or extra markup. You can export as plain HTML or React JSX.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "Element Armory is available as a Chrome extension. Support for other browsers may be added in the future. Check the Chrome Web Store for the latest version.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The base plan includes core capture and export features. Add-ons are available for extra usage. See the Pricing page for details.",
  },
  {
    question: "What happens to the pages I capture from?",
    answer:
      "Capture runs locally in your browser. We don’t send the page content to our servers. Only minimal data (e.g. for account and usage) is used as described in our Privacy policy.",
  },
];

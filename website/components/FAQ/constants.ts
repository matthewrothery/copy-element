import type { FAQItem } from "./types";

export const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What does Element Armory do?",
    answer:
      "Element Armory is a Chrome extension that captures any UI element from a webpage and exports it as clean HTML. Save captured elements to a personal library and reuse them in your projects or feed them directly to AI tools.",
  },
  {
    question: "How does capture work?",
    answer:
      "Install the extension, then click any element on a page. Element Armory extracts it with minimal, portable styles-only display, layout, typography, and color. No scripts, trackers, or extra markup. Export as clean HTML in one click.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "Element Armory is available as a Chrome extension. Support for other browsers may be added in the future. Check the Chrome Web Store for the latest version.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Install the extension and start capturing immediately-no account required. Create a free account for 25 saved snippets, 20 captures per month, and the basic AI prompt. Upgrade to Pro to remove all limits and unlock the advanced prompt and MCP copy.",
  },
  {
    question: "What happens to the pages I capture from?",
    answer:
      "Capture runs entirely in your browser-page content is not sent to our servers during capture. When you save a snippet to your library, the HTML and CSS are stored to your account for sync across devices. We don’t use your captured content for anything beyond storage and sync. See our Privacy Policy for details.",
  },
];

import type { ComparisonData } from "./types";

export const cssScanData: ComparisonData = {
  slug: "element-armory-vs-css-scan",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "CSS Scan" },
  },
  meta: {
    title: "Element Armory vs CSS Scan - UI Capture Tool Comparison",
    description:
      "Compare Element Armory and CSS Scan. Element Armory captures full HTML with a free tier and MCP server integration. CSS Scan copies individual CSS properties - no HTML export, one-time purchase required.",
    canonicalPath: "/compare/element-armory-vs-css-scan",
  },
  hero: {
    title: "Element Armory vs CSS Scan",
    subtitle:
      "CSS Scan copies CSS values from elements. Element Armory captures the full HTML structure and exports it as clean, portable code. Here's how the two compare.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You need the full element - HTML structure, not just isolated CSS values",
        "You need the full element - HTML structure and styles-ready to paste into your project",
        "You want a snippet library to save and reuse captured UI",
        "You use AI coding tools and want MCP server access to your snippets",
        "You want a free tier that works without paying upfront",
        "You want to share captured elements with teammates via a link",
      ],
    },
    theirs: {
      tool: "CSS Scan",
      reasons: [
        "You primarily need individual CSS property values (colors, fonts, spacing) from elements",
        "You want a polished hover inspector with a clean overlay UI",
        "You prefer a one-time purchase over a subscription",
        "You're doing design reference work and don't need the HTML structure",
      ],
    },
  },
  table: {
    rows: [
      {
        feature: "HTML export",
        note: "Capture the full element markup, not just its styles.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "JSX export",
        ours: "no",
        theirs: "no",
      },
      {
        feature: "CSS export",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Inline styles only (no class noise)",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Default values omitted",
        note: "Drops CSS properties at browser defaults to keep output small.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Snippet library",
        note: "Save captured elements for later reuse.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "MCP server integration",
        note: "Access saved snippets from Cursor and other AI coding tools.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Share snippets",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Free tier",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "No account required",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Browser extension",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Hover inspector overlay",
        note: "Live hover UI showing element properties as you move the cursor.",
        ours: "no",
        theirs: "yes",
      },
    ],
  },
  workflow: {
    title: "From inspection to code",
    subtitle:
      "How each tool gets you from a UI you see to something you can build with.",
    ours: {
      tool: "Element Armory",
      steps: [
        {
          label: "Click any element",
          description:
            "Activate the extension and click an element. Element Armory captures its HTML structure with a scoped CSS style block.",
        },
        {
          label: "Copy HTML",
          description:
            "One click copies the full element as clean HTML. Paste directly into your editor.",
        },
        {
          label: "Save to your snippet library",
          description:
            "Optionally save with a name and source URL. Retrieve or share it later without revisiting the original page.",
        },
        {
          label: "Use in your AI coding session",
          description:
            "Connect the Element Armory MCP server to Cursor. Your snippets are available as context inside the AI - no manual copy-paste.",
        },
      ],
    },
    theirs: {
      tool: "CSS Scan",
      steps: [
        {
          label: "Hover over an element",
          description:
            "Activate CSS Scan. Hover over any element to see its CSS properties in a floating overlay.",
        },
        {
          label: "Click to copy CSS",
          description:
            "Click to copy the CSS for the hovered element. You get the raw CSS properties - no HTML structure.",
        },
        {
          label: "Paste into your stylesheet",
          description:
            "Paste the copied CSS into your project stylesheet and manually write the matching HTML.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    subtitle: "Common developer tasks - and how each tool handles them.",
    scenarios: [
      {
        scenario: "Rebuilding a button component you saw on another site",
        oursApproach:
          "Click the button, copy the HTML. You get the full structure with scoped CSS - paste it into your component file and it works.",
        theirsApproach:
          "Hover over the button, copy the CSS. You still need to write the HTML yourself and wire the styles up manually.",
      },
      {
        scenario: "Referencing a card layout for a design system",
        oursApproach:
          "Capture the card, save it to your snippet library with the source URL. Retrieve it any time, or share the link with your team.",
        theirsApproach:
          "Copy the card's CSS to your clipboard. No persistent storage - the next session starts fresh.",
      },
      {
        scenario: "Extracting a color palette from a site",
        oursApproach:
          "Capture elements containing the colors you want. The inline styles include all color values - extract them from the output.",
        theirsApproach:
          "CSS Scan excels here - hover over any element and see its exact color values instantly in the overlay.",
      },
      {
        scenario: "Feeding a UI component into Cursor for AI-assisted rebuild",
        oursApproach:
          "Save the captured component to your snippet library. Connect the MCP server to Cursor - the AI can reference it directly in context.",
        theirsApproach:
          "No MCP integration. Copy the CSS manually and paste it into your Cursor conversation.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle: "CSS Scan is optimized for live CSS inspection. Element Armory is not.",
    items: [
      {
        heading: "No hover inspector overlay",
        description:
          "Element Armory doesn't show a live floating overlay as you move your cursor. You click to capture - there's no continuous hover inspection mode.",
      },
      {
        heading: "Not optimized for single CSS values",
        description:
          "If you need to quickly grab one color, one font size, or one spacing value from an element, CSS Scan's hover overlay is faster. Element Armory is optimized for capturing the full element.",
      },
      {
        heading: "No one-time purchase option",
        description:
          "Element Armory offers a free tier and a paid subscription. CSS Scan is a one-time purchase. If you prefer to pay once, CSS Scan fits that model.",
      },
    ],
  },
  faq: [
    {
      question: "Is Element Armory free?",
      answer:
        "Yes. The core capture and export features are free with no account required. A paid plan unlocks higher usage limits and advanced snippet library features.",
    },
    {
      question: "Does Element Armory export CSS like CSS Scan?",
      answer:
        "Element Armory includes CSS in its output - as a scoped style block alongside the exported HTML. It doesn't have a hover inspector mode that shows raw CSS properties, but the exported element includes all the visual styles needed to reproduce it.",
    },
    {
      question: "Can Element Armory replace CSS Scan for inspecting individual property values?",
      answer:
        "Not directly. If you need to quickly check a single color or font value, CSS Scan's hover overlay is faster. Element Armory is built to capture full elements for reuse in code, not for quick individual property inspection.",
    },
    {
      question: "Does Element Armory require a purchase?",
      answer:
        "No. Install the Chrome extension and start capturing for free - no account required. The free tier covers core capture and export. A paid plan unlocks the full snippet library and sharing features.",
    },
    {
      question: "What is the MCP server and how does it work with CSS Scan?",
      answer:
        "Element Armory ships an MCP (Model Context Protocol) server that exposes your saved snippet library to AI coding tools like Cursor. CSS Scan has no equivalent - it has no persistent storage or AI tool integration.",
    },
    {
      question: "Can I use both tools together?",
      answer:
        "Yes. They solve different problems. Use CSS Scan for quick live inspection of individual properties; use Element Armory when you want to capture, save, and reuse the full element in your codebase.",
    },
  ],
};

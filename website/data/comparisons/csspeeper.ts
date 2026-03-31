import type { ComparisonData } from "./types";

export const csspeeperData: ComparisonData = {
  slug: "element-armory-vs-csspeeper",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "CSSPeeper" },
  },
  meta: {
    title: "Element Armory vs CSSPeeper – UI Capture Tool Comparison",
    description:
      "Compare Element Armory and CSSPeeper. Element Armory captures full HTML for use in code with a snippet library and MCP integration. CSSPeeper is a design-focused CSS inspector showing colors, fonts, and assets.",
    canonicalPath: "/compare/element-armory-vs-csspeeper",
  },
  hero: {
    title: "Element Armory vs CSSPeeper",
    subtitle:
      "CSSPeeper surfaces colors, fonts, and assets in a design-friendly panel. Element Armory captures the full element as HTML you can use in your project.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You need HTML from an element — structure and styles — not just isolated CSS properties",
        "You want a snippet library to save and reuse captured UI components",
        "You use AI coding tools and want your snippets accessible via MCP server",
        "You want to share captured elements with teammates via a link",
        "You want a free tier with no account required for basic capture and export",
        "Your workflow is code-first — you want output you can paste and ship",
      ],
    },
    theirs: {
      tool: "CSSPeeper",
      reasons: [
        "You primarily want a clean view of a site's color palette, fonts, and spacing tokens",
        "You're a designer extracting visual variables for a design system audit",
        "You want to export assets (images, SVGs) from a page",
        "You prefer an inspector with a design-friendly panel UI over raw DevTools",
        "You don't need to export the HTML structure — just the visual properties",
      ],
    },
  },
  table: {
    rows: [
      {
        feature: "HTML export",
        note: "Capture the full element markup for use in another project.",
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
        feature: "Default values omitted",
        note: "Drops CSS properties at browser defaults to keep output small.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Color palette extraction",
        note: "View all colors used on a page in one place.",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Font inspection",
        note: "See all fonts and typography styles used on a page.",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Asset export (images, SVGs)",
        note: "Download images and SVGs from the page.",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Snippet library",
        note: "Save captured elements for later reuse.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "MCP server integration",
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
        theirs: "yes",
      },
      {
        feature: "No account required",
        ours: "yes",
        theirs: "partial",
      },
      {
        feature: "Browser extension",
        ours: "yes",
        theirs: "yes",
      },
    ],
  },
  workflow: {
    title: "Inspection to implementation",
    subtitle: "How each tool bridges the gap between what you see and what you build.",
    ours: {
      tool: "Element Armory",
      steps: [
        {
          label: "Click the element",
          description:
            "Activate Element Armory and click any element. It extracts the HTML structure with a scoped CSS style block — not just isolated CSS properties.",
        },
        {
          label: "Copy HTML",
          description:
            "One click copies the full element. Paste it into your editor, component file, or AI coding session immediately.",
        },
        {
          label: "Save to snippet library",
          description:
            "Save with a label and source URL. Access it later without revisiting the original page.",
        },
        {
          label: "Use in AI tools via MCP",
          description:
            "Connect the MCP server to Cursor. Your snippets are available as context in your AI coding session.",
        },
      ],
    },
    theirs: {
      tool: "CSSPeeper",
      steps: [
        {
          label: "Open CSSPeeper panel",
          description:
            "Activate CSSPeeper to open the inspector panel for the current page.",
        },
        {
          label: "Inspect element styles",
          description:
            "Click an element to see its CSS properties in a formatted panel — colors, fonts, spacing.",
        },
        {
          label: "Browse page-level assets",
          description:
            "Switch to the page view to see all colors, fonts, and images used across the page.",
        },
        {
          label: "Copy values or export assets",
          description:
            "Copy individual CSS values or download images and SVGs directly from the panel.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    scenarios: [
      {
        scenario: "Extracting a card component for a React project",
        oursApproach:
          "Click the card, copy the HTML. You get the full structure with scoped CSS — paste into your component file and iterate.",
        theirsApproach:
          "CSSPeeper shows the card's CSS properties but doesn't export the HTML. You'd need to write the markup yourself.",
      },
      {
        scenario: "Auditing a site's color palette for a design system",
        oursApproach:
          "Not the right tool. Element Armory captures individual elements — it doesn't aggregate all colors from a full page.",
        theirsApproach:
          "CSSPeeper excels here. It collects all colors from a page into a palette view — copy hex values with one click.",
      },
      {
        scenario: "Saving a navigation component to reference during a rebuild",
        oursApproach:
          "Capture the nav, save it to your snippet library with the source URL. Retrieve it any time — the full HTML and styles are preserved.",
        theirsApproach:
          "CSSPeeper has no snippet library. You'd copy the CSS values and manually keep track of them.",
      },
      {
        scenario: "Feeding a UI component into an AI coding tool",
        oursApproach:
          "Save the component to your snippet library. Connect the MCP server to Cursor — the AI can reference it directly without copy-pasting.",
        theirsApproach:
          "No MCP integration. Copy CSS values manually and paste them into your AI tool's context.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle:
      "CSSPeeper has design-focused inspection features that Element Armory doesn't try to replicate.",
    items: [
      {
        heading: "No page-level color or font aggregation",
        description:
          "Element Armory captures individual elements — it doesn't collect all colors or fonts used across an entire page into a single view. CSSPeeper's palette view is purpose-built for that.",
      },
      {
        heading: "No asset download",
        description:
          "Element Armory doesn't let you download images or SVGs from a page. CSSPeeper includes an asset panel for this.",
      },
      {
        heading: "Not optimized for design token extraction",
        description:
          "If your goal is to extract design tokens (colors, spacing, typography) from a site for a design system, CSSPeeper's structured panel view is more efficient than capturing individual elements.",
      },
    ],
  },
  faq: [
    {
      question: "Is Element Armory free?",
      answer:
        "Yes. Core capture and export features are free with no account required. A paid plan unlocks higher usage limits and full snippet library features.",
    },
    {
      question: "How is Element Armory different from CSSPeeper for developers?",
      answer:
        "CSSPeeper shows you CSS properties in a design-friendly panel — useful for auditing a site's visual language. Element Armory captures the full HTML of an element so you can use it in your own project. They solve different problems.",
    },
    {
      question: "Can Element Armory extract a site's color palette like CSSPeeper?",
      answer:
        "No. Element Armory captures individual elements and the CSS rules that apply to them. It doesn't aggregate all colors from a page into a palette view. CSSPeeper is better suited for that specific workflow.",
    },
    {
      question: "Does CSSPeeper export HTML?",
      answer:
        "No. CSSPeeper is a CSS and asset inspector — it shows property values and lets you copy individual CSS. It doesn't export the HTML structure of an element. Element Armory does.",
    },
    {
      question: "What is the MCP server integration?",
      answer:
        "Element Armory ships an MCP (Model Context Protocol) server that exposes your saved snippet library to AI coding tools like Cursor. CSSPeeper has no equivalent.",
    },
    {
      question: "Can I use CSSPeeper and Element Armory together?",
      answer:
        "Yes — they complement each other. Use CSSPeeper to audit a site's colors, fonts, and assets; use Element Armory to capture the HTML of elements you want to reuse in your codebase.",
    },
  ],
};

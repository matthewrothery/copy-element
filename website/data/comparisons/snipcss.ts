import type { ComparisonData } from "./types";

export const snipcssData: ComparisonData = {
  slug: "element-armory-vs-snipcss",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "SnipCSS" },
  },
  meta: {
    title: "Element Armory vs SnipCSS – UI Capture Tool Comparison",
    description:
      "Compare Element Armory and SnipCSS side by side. See which tool captures full UI components versus CSS-only extraction, and which integrates better into a modern development workflow.",
    canonicalPath: "/compare/element-armory-vs-snipcss",
  },
  hero: {
    title: "Element Armory vs SnipCSS",
    subtitle:
      "SnipCSS extracts CSS. Element Armory captures full UI — structure, styles, and a workflow that connects to your AI coding tools.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You need the full HTML structure alongside styles — not just CSS rules",
        "You want clean JSX you can paste directly into a React codebase",
        "You use AI coding tools like Cursor and want MCP server integration",
        "You want to save and reuse captured elements in a persistent snippet library",
        "You want a free tier with no account required for basic capture and export",
      ],
    },
    theirs: {
      tool: "SnipCSS",
      reasons: [
        "You only need the CSS rules from an element — no HTML structure required",
        "You're inspecting styles for reference or documentation, not rebuilding UI",
        "Your workflow is purely CSS-based and you don't need component output",
      ],
    },
  },
  table: {
    rows: [
      {
        feature: "HTML export",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "JSX export",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "CSS extraction",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Full element structure captured",
        note: "Element Armory captures the complete DOM subtree with its computed styles. SnipCSS captures CSS rules only — no markup.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Default values omitted",
        note: "Element Armory strips CSS properties at their browser default to keep output small and readable.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Snippet library",
        note: "Save captured elements with a label and source URL for later reuse.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "MCP server integration",
        note: "Expose your snippet library to AI coding tools like Cursor via the Model Context Protocol.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Shareable snippet links",
        note: "Generate a link to a captured element and share it with teammates.",
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
        note: "Use Element Armory as a guest — no sign-in needed for basic capture and export.",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Browser extension",
        ours: "yes",
        theirs: "yes",
      },
    ],
  },
  workflow: {
    title: "Capture-to-code workflow",
    subtitle: "How each tool gets you from a UI you see to code you can use.",
    ours: {
      tool: "Element Armory",
      steps: [
        {
          label: "Click any element",
          description:
            "Activate the extension and click any element on the page. Element Armory highlights it instantly.",
        },
        {
          label: "Review the clean output",
          description:
            "See the extracted HTML or JSX with minimal inline styles. Default CSS values are stripped automatically.",
        },
        {
          label: "Copy HTML or JSX",
          description:
            "One click copies to clipboard. Paste directly into your codebase, editor, or AI tool.",
        },
        {
          label: "Save to your snippet library",
          description:
            "Optionally save the element with a name and source URL. Retrieve it later without revisiting the original page.",
        },
        {
          label: "Use via MCP server",
          description:
            "Access your saved snippets from Cursor or any MCP-compatible AI coding tool — no copy-paste required.",
        },
      ],
    },
    theirs: {
      tool: "SnipCSS",
      steps: [
        {
          label: "Hover over an element",
          description: "Activate SnipCSS and hover over an element to inspect its styles.",
        },
        {
          label: "View the CSS rules",
          description:
            "SnipCSS shows the computed CSS for the element. Review the properties in the panel.",
        },
        {
          label: "Copy the CSS",
          description:
            "Copy the CSS rules to clipboard. You get styles only — no HTML markup.",
        },
        {
          label: "Reconstruct manually",
          description:
            "Write the HTML structure yourself and apply the copied CSS. Extra work compared to getting both at once.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    subtitle: "Common developer tasks — and how each tool handles them.",
    scenarios: [
      {
        scenario: "Rebuilding a button component from a site you admire",
        oursApproach:
          "Click the button, copy clean HTML or JSX with only the visual styles that matter. Paste into your project. The full structure is already there.",
        theirsApproach:
          "Copy the CSS rules. Then write the HTML structure manually, matching the original layout. Double the work for the same result.",
      },
      {
        scenario: "Saving UI references for a design system audit",
        oursApproach:
          "Save each captured element to your snippet library with a label and source URL. Browse your full library later — no need to revisit the original sites.",
        theirsApproach:
          "SnipCSS has no persistent snippet library. Each inspection session is standalone — nothing is saved between uses.",
      },
      {
        scenario: "Feeding captured UI into an AI coding session",
        oursApproach:
          "Connect the Element Armory MCP server to Cursor. Your saved snippets are accessible directly inside the AI context — no manual copy-paste.",
        theirsApproach:
          "No MCP integration. You copy the CSS and describe the structure to your AI tool manually.",
      },
      {
        scenario: "Checking what font-size or color a site is using",
        oursApproach:
          "Click the element, see all computed styles including font and color values immediately.",
        theirsApproach:
          "Hover over the element — SnipCSS shows CSS properties directly. A straightforward fit for quick style lookups.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle:
      "Honest about the tradeoffs. Element Armory is built for capturing reusable UI — not as a general CSS inspector.",
    items: [
      {
        heading: "Not a CSS debugger",
        description:
          "Element Armory captures element output for reuse — it's not a replacement for browser DevTools when you need to trace cascaded styles, specificity conflicts, or media query overrides.",
      },
      {
        heading: "No inline CSS selector view",
        description:
          "Element Armory shows computed inline styles, not the original CSS selectors and rules from stylesheets. If you need to see the original class declarations, use DevTools.",
      },
      {
        heading: "No Tailwind output",
        description:
          "Element Armory outputs inline styles, not utility classes. If your project is 100% Tailwind, you'll need to convert the output manually or use an AI tool to translate it.",
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
      question: "What's the difference between SnipCSS and Element Armory?",
      answer:
        "SnipCSS extracts CSS rules from an element — useful for inspecting styles. Element Armory captures both the HTML structure and computed styles, then exports clean HTML or JSX you can paste directly into a project. It also adds a snippet library, MCP server integration, and shareable links.",
    },
    {
      question: "Can I use Element Armory just to inspect CSS?",
      answer:
        "Yes. When you click an element, Element Armory shows all its computed styles. But it also gives you the full HTML output alongside that — so you get more than a CSS-only tool without extra effort.",
    },
    {
      question: "What is the MCP server integration?",
      answer:
        "Element Armory ships with a Model Context Protocol (MCP) server that exposes your saved snippet library to AI coding tools like Cursor. Once connected, your AI assistant can reference your captured UI components without you manually copying and pasting them.",
    },
    {
      question: "Do I need to create an account to use Element Armory?",
      answer:
        "No. You can capture and export elements as a guest. Creating a free account enables the snippet library and sharing features.",
    },
    {
      question: "Can I switch from SnipCSS to Element Armory?",
      answer:
        "Yes — install the Element Armory Chrome extension and you're ready. No migration needed. Element Armory is a superset of what SnipCSS does, with HTML and JSX export on top.",
    },
  ],
};

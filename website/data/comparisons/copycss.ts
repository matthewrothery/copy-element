import type { ComparisonData } from "./types";

export const copycssData: ComparisonData = {
  slug: "element-armory-vs-copycss",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "CopyCSS" },
  },
  meta: {
    title: "Element Armory vs CopyCSS - UI Capture Tool Comparison",
    description:
      "Compare Element Armory and CopyCSS side by side. One copies CSS. The other captures full UI - HTML, a snippet library, and MCP server integration for AI coding tools.",
    canonicalPath: "/compare/element-armory-vs-copycss",
  },
  hero: {
    title: "Element Armory vs CopyCSS",
    subtitle:
      "CopyCSS copies styles. Element Armory captures full UI components - structure and styles-ready to drop into your codebase.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You want usable HTML, not just CSS rules to apply yourself",
        "You use AI coding tools like Cursor and want your snippets accessible via MCP",
        "You want a persistent snippet library to save and reuse captured UI",
        "You need output that works across React, Vue, Svelte, or plain HTML without conversion",
        "You want a free tier with no account required for basic capture and export",
      ],
    },
    theirs: {
      tool: "CopyCSS",
      reasons: [
        "You only need to copy CSS from elements - no HTML structure required",
        "You're doing a quick style lookup and don't need to rebuild the component",
        "Your workflow only ever needs the CSS layer of what you're inspecting",
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
        ours: "no",
        theirs: "no",
      },
      {
        feature: "CSS extraction",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Full element structure captured",
        note: "Element Armory captures the complete DOM subtree with computed styles. CopyCSS captures CSS only - no markup.",
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
        feature: "Cross-framework output",
        note: "Output works in any framework-React, Vue, Svelte, plain HTML - without conversion.",
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
        note: "Use Element Armory as a guest - no sign-in needed for basic capture and export.",
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
            "See the extracted HTML with a scoped CSS style block. Default CSS values are stripped automatically.",
        },
        {
          label: "Copy HTML",
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
            "Access your saved snippets from Cursor or any MCP-compatible AI coding tool - no copy-paste required.",
        },
      ],
    },
    theirs: {
      tool: "CopyCSS",
      steps: [
        {
          label: "Click an element",
          description: "Activate CopyCSS and select an element on the page to inspect its styles.",
        },
        {
          label: "View the CSS",
          description:
            "CopyCSS shows the CSS properties for the selected element.",
        },
        {
          label: "Copy the CSS",
          description:
            "Copy the CSS to clipboard. You get styles only - no HTML structure is captured.",
        },
        {
          label: "Write the markup yourself",
          description:
            "Build the HTML structure manually and apply the copied CSS. The component shape isn't captured - just the styles.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    subtitle: "Common developer tasks - and how each tool handles them.",
    scenarios: [
      {
        scenario: "Rebuilding a card component from a site you admire",
        oursApproach:
          "Click the card, copy clean HTML with only the visual styles that matter. Paste into your project. Structure and styles are both captured.",
        theirsApproach:
          "Copy the CSS rules. Then write the HTML structure yourself to match the original. Extra steps for the same end result.",
      },
      {
        scenario: "Building a UI reference library for a design sprint",
        oursApproach:
          "Save each captured element to your snippet library with a label and source URL. Browse everything later from a single place - no browser history archaeology.",
        theirsApproach:
          "CopyCSS has no snippet library. You'd need to paste the CSS somewhere else and manage it yourself.",
      },
      {
        scenario: "Feeding UI into an AI coding session in Cursor",
        oursApproach:
          "Connect the Element Armory MCP server. Your saved snippets are available directly inside Cursor's AI context - reference them by name without leaving your editor.",
        theirsApproach:
          "No MCP integration. Copy the CSS manually, describe the HTML structure to your AI tool, and work from there.",
      },
      {
        scenario: "Sharing a UI reference with a remote teammate",
        oursApproach:
          "Save the snippet, copy the share link, and send it. Your teammate sees the captured element with its source context.",
        theirsApproach:
          "No sharing feature. You'd paste the CSS into a message or doc and hope the context is clear.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle:
      "Honest about the tradeoffs. Element Armory is built for capturing reusable UI - not as a general CSS inspector.",
    items: [
      {
        heading: "Not a CSS debugger",
        description:
          "Element Armory captures element output for reuse - it's not a replacement for browser DevTools when you need to trace cascaded styles, specificity, or media query overrides.",
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
      question: "What's the difference between CopyCSS and Element Armory?",
      answer:
        "CopyCSS copies CSS rules from elements - useful for quick style inspection. Element Armory captures both the HTML structure and the CSS rules that apply to it, then exports clean HTML you can paste directly into a project. It also includes a snippet library, MCP server integration, and shareable links.",
    },
    {
      question: "Can I use Element Armory just to copy CSS?",
      answer:
        "Yes. When you click an element, Element Armory extracts all CSS rules that apply to it from the page's actual stylesheets. But it also captures the full HTML output alongside - so you get more than a CSS-only tool without any extra steps.",
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
      question: "Can I switch from CopyCSS to Element Armory?",
      answer:
        "Yes - install the Element Armory Chrome extension and you're ready. No migration needed. Element Armory captures everything CopyCSS does, plus the HTML structure on top.",
    },
  ],
};

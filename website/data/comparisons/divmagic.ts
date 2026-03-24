import type { ComparisonData } from "./types";

export const divmagicData: ComparisonData = {
  slug: "element-armory-vs-divmagic",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "DivMagic" },
  },
  meta: {
    title: "Element Armory vs DivMagic – UI Capture Tool Comparison",
    description:
      "Compare Element Armory and DivMagic side by side. See which tool gives you cleaner HTML, better JSX export, MCP server support, and a free tier with no account required.",
    canonicalPath: "/compare/element-armory-vs-divmagic",
  },
  hero: {
    title: "Element Armory vs DivMagic",
    subtitle:
      "Both tools capture UI from websites. Here's how they differ on output quality, workflow integration, and cost.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You want clean HTML or JSX with minimal inline styles — no framework lock-in",
        "You use AI coding tools (Cursor, Copilot) and want MCP server integration",
        "You need a snippet library to save and reuse captured UI",
        "You want a free tier that works without creating an account",
        "You prefer developer-focused output that drops default values and reduces noise",
      ],
    },
    theirs: {
      tool: "DivMagic",
      reasons: [
        "You primarily use Tailwind CSS and want classes generated automatically",
        "You prefer a tool with a built-in AI chat interface for component questions",
        "You want framework-specific component scaffolding out of the box",
      ],
    },
  },
  table: {
    rows: [
      {
        feature: "HTML export",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "JSX export",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Inline styles only (no class noise)",
        note: "Element Armory strips class names and only keeps visual inline styles. DivMagic may retain or generate Tailwind class names.",
        ours: "yes",
        theirs: "partial",
      },
      {
        feature: "Default values omitted",
        note: "Element Armory drops CSS properties at their browser default to keep output small.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Snippet library",
        note: "Save captured elements for later reuse — with title and source URL.",
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
        feature: "Free tier",
        ours: "yes",
        theirs: "partial",
      },
      {
        feature: "No account required",
        note: "Use Element Armory as a guest — no sign-in needed for basic capture and export.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Browser extension",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Cross-framework output",
        note: "Output works in any framework — React, Vue, Svelte, plain HTML.",
        ours: "yes",
        theirs: "partial",
      },
      {
        feature: "Share snippets",
        note: "Generate a shareable link to a captured element for teammates.",
        ours: "yes",
        theirs: "no",
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
            "See the extracted HTML or JSX with minimal inline styles. Default values are stripped automatically.",
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
      tool: "DivMagic",
      steps: [
        {
          label: "Click an element",
          description: "Activate DivMagic and select a UI element on the page.",
        },
        {
          label: "Get component code",
          description:
            "DivMagic generates a component with Tailwind or inline styles depending on your settings.",
        },
        {
          label: "Review in the side panel",
          description:
            "Code is shown in a side panel. Copy or ask the built-in AI to modify it.",
        },
        {
          label: "Copy to clipboard",
          description: "Copy the generated component code and paste it into your project.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    subtitle:
      "Common developer tasks — and how each tool handles them.",
    scenarios: [
      {
        scenario: "Extracting a pricing card from a competitor's site",
        oursApproach:
          "Click the card, copy clean HTML or JSX with only the visual styles that matter. Paste into your project as-is — no cleanup needed.",
        theirsApproach:
          "Click the card, get a Tailwind component. Requires Tailwind in your project or manual conversion.",
      },
      {
        scenario: "Saving UI references for a design system audit",
        oursApproach:
          "Save each captured element to your snippet library with a label and source URL. Browse your full library later — no need to revisit the original sites.",
        theirsApproach:
          "DivMagic doesn't have a persistent snippet library. Each session starts fresh.",
      },
      {
        scenario: "Feeding captured UI into an AI coding session",
        oursApproach:
          "Connect the Element Armory MCP server to Cursor. Your saved snippets are accessible directly inside the AI context — no manual copy-paste.",
        theirsApproach:
          "No MCP integration. You copy the generated code and paste it into your AI tool manually.",
      },
      {
        scenario: "Sharing a UI reference with a teammate",
        oursApproach:
          "Save the snippet and share the link. Your teammate gets the captured element with source context.",
        theirsApproach:
          "No sharing feature. You'd need to copy the code and send it via a separate channel.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle:
      "Honest about the tradeoffs. Element Armory optimizes for clean, portable output — not AI component generation.",
    items: [
      {
        heading: "No built-in Tailwind output",
        description:
          "Element Armory outputs inline styles, not Tailwind classes. If your project is 100% Tailwind, you'll need to convert the output manually.",
      },
      {
        heading: "No AI chat interface",
        description:
          "Element Armory doesn't include a chat UI for asking questions about captured components. It integrates with AI tools you already use via MCP instead.",
      },
      {
        heading: "No framework-specific scaffolding",
        description:
          "The output is portable HTML or JSX — not a pre-wrapped React component, Vue SFC, or Svelte file. You control the scaffolding.",
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
      question: "How does Element Armory compare to DivMagic for React projects?",
      answer:
        "Element Armory exports clean JSX that works in any React project. DivMagic also exports React components but leans toward Tailwind class generation. If you use inline styles or CSS modules, Element Armory's output requires less cleanup.",
    },
    {
      question: "Does Element Armory support Tailwind?",
      answer:
        "Not directly. Element Armory outputs inline styles, not utility classes. You can use the captured output as a reference and apply your own Tailwind classes, or paste it into an AI tool to generate the Tailwind equivalent.",
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
      question: "Can I switch from DivMagic to Element Armory?",
      answer:
        "Yes — install the Element Armory Chrome extension and you're ready to start. There's no migration required since Element Armory outputs standard HTML and JSX.",
    },
  ],
};

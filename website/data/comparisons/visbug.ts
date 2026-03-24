import type { ComparisonData } from "./types";

export const visbugData: ComparisonData = {
  slug: "element-armory-vs-visbug",
  tools: {
    ours: { name: "Element Armory" },
    theirs: { name: "VisBug" },
  },
  meta: {
    title: "Element Armory vs VisBug – UI Capture Tool Comparison",
    description:
      "Compare Element Armory and VisBug. Element Armory captures HTML and JSX from any site for use in code. VisBug is a visual design debugger for moving, styling, and measuring elements live in the browser — no code export.",
    canonicalPath: "/compare/element-armory-vs-visbug",
  },
  hero: {
    title: "Element Armory vs VisBug",
    subtitle:
      "VisBug lets you edit and inspect UI visually in the browser. Element Armory captures it as HTML or JSX you can actually use in your codebase.",
  },
  verdict: {
    ours: {
      tool: "Element Armory",
      reasons: [
        "You want to extract HTML or JSX from a site to use in your own project",
        "You work in React and need a component you can paste and iterate on",
        "You want a snippet library to save and reference captured UI",
        "You use AI coding tools and want your snippets available via MCP server",
        "You want to share captured elements with teammates",
        "Your goal is code reuse, not in-browser visual editing",
      ],
    },
    theirs: {
      tool: "VisBug",
      reasons: [
        "You want to visually move, resize, or restyle elements directly on a live page",
        "You're doing design QA and want to test visual changes without touching code",
        "You want to measure spacing and alignment between elements on a rendered page",
        "You prefer an open-source tool with no account or subscription",
        "Your workflow is design-first, not code-first",
      ],
    },
  },
  table: {
    rows: [
      {
        feature: "HTML export",
        note: "Extract the element's full HTML markup for use in another project.",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "JSX export",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "CSS export",
        ours: "yes",
        theirs: "no",
      },
      {
        feature: "Snippet library",
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
        theirs: "yes",
      },
      {
        feature: "Browser extension",
        ours: "yes",
        theirs: "yes",
      },
      {
        feature: "Open source",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Visual element editing (move, resize, restyle)",
        note: "Edit elements directly on the live page without writing code.",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Spacing and alignment measurement",
        note: "Measure distance between elements on a rendered page.",
        ours: "no",
        theirs: "yes",
      },
      {
        feature: "Live style overrides",
        note: "Change colors, fonts, and spacing on a live page without DevTools.",
        ours: "no",
        theirs: "yes",
      },
    ],
  },
  workflow: {
    title: "Different tools, different jobs",
    subtitle:
      "VisBug and Element Armory serve distinct points in a developer's workflow.",
    ours: {
      tool: "Element Armory",
      steps: [
        {
          label: "Find a UI element worth reusing",
          description:
            "See a button, card, or nav on another site that you want to use as a starting point.",
        },
        {
          label: "Click to capture",
          description:
            "Activate Element Armory and click the element. It extracts the HTML structure with minimal inline styles.",
        },
        {
          label: "Copy as HTML or JSX",
          description:
            "Copy to clipboard. Paste directly into your editor, component file, or AI coding session.",
        },
        {
          label: "Save and reuse later",
          description:
            "Save to your snippet library. Access it any time — or share it with a teammate via link.",
        },
      ],
    },
    theirs: {
      tool: "VisBug",
      steps: [
        {
          label: "Open VisBug on any page",
          description:
            "Activate VisBug to enter visual editing mode on the current page.",
        },
        {
          label: "Select and manipulate elements",
          description:
            "Move elements, adjust spacing, change colors, and measure distances directly on the rendered page.",
        },
        {
          label: "Review visual changes",
          description:
            "See how changes look in context without editing your codebase or writing CSS.",
        },
        {
          label: "Translate changes to code manually",
          description:
            "VisBug doesn't export. You take note of the visual decisions and apply them in your codebase yourself.",
        },
      ],
    },
  },
  useCases: {
    title: "Which tool fits your scenario",
    scenarios: [
      {
        scenario: "You want to reuse a pricing card from another site in your React app",
        oursApproach:
          "Click the card, copy JSX. You get the full markup with inline styles — paste it into your component and iterate from there.",
        theirsApproach:
          "VisBug doesn't extract code. You'd need to inspect manually in DevTools and rebuild the card yourself.",
      },
      {
        scenario: "You want to check if a button's padding matches the spec on a staging page",
        oursApproach:
          "Element Armory isn't built for this. Use your browser's DevTools or VisBug.",
        theirsApproach:
          "VisBug's measurement tool shows exact spacing between elements. Select the button, measure the padding visually — no DevTools needed.",
      },
      {
        scenario: "You want to prototype a color change on a live page before touching code",
        oursApproach:
          "Not the right tool. Element Armory captures existing elements — it doesn't let you edit them live.",
        theirsApproach:
          "VisBug lets you click any element and change its color, font, or size directly on the rendered page — instantly visible.",
      },
      {
        scenario: "You want to save a nav component and share it with your team",
        oursApproach:
          "Capture the nav, save it to your snippet library with a source URL. Share the link — your teammate gets the HTML or JSX without visiting the original site.",
        theirsApproach:
          "VisBug has no persistent storage or sharing. Changes you make are session-only and lost on page reload.",
      },
    ],
  },
  limitations: {
    title: "What Element Armory doesn't do",
    subtitle:
      "VisBug solves a different problem. These are the gaps if you're evaluating Element Armory as a VisBug replacement.",
    items: [
      {
        heading: "No live visual editing",
        description:
          "Element Armory captures elements as they are — it doesn't let you move, resize, or restyle them on a live page. For visual QA or layout experimentation, VisBug is the right tool.",
      },
      {
        heading: "No spacing measurement tool",
        description:
          "There's no built-in tool to measure distances between elements. Use VisBug or your browser's DevTools for that.",
      },
      {
        heading: "Not open source",
        description:
          "VisBug is open source and freely auditable. Element Armory is a commercial product with a free tier.",
      },
    ],
  },
  faq: [
    {
      question: "Is Element Armory free?",
      answer:
        "Yes. Core capture and export are free with no account required. A paid plan unlocks higher usage limits and the full snippet library.",
    },
    {
      question: "Can I use VisBug and Element Armory together?",
      answer:
        "Yes — they're complementary. Use VisBug to prototype visual changes on a live page; use Element Armory to capture, save, and export elements you want to reuse in your codebase.",
    },
    {
      question: "Does Element Armory let me edit elements visually like VisBug?",
      answer:
        "No. Element Armory is a capture and export tool. It doesn't provide an in-browser visual editor. If you need to move or restyle elements on a live page, VisBug is the right choice.",
    },
    {
      question: "Can I extract code from VisBug?",
      answer:
        "No. VisBug is a visual editing tool — it doesn't export the elements you inspect or modify as HTML or JSX. To get code, you'd need to use DevTools manually or switch to Element Armory.",
    },
    {
      question: "Does Element Armory have MCP server support?",
      answer:
        "Yes. Element Armory ships an MCP server that exposes your snippet library to AI coding tools like Cursor. VisBug has no equivalent — it has no persistent storage or AI integration.",
    },
    {
      question: "Is VisBug still maintained?",
      answer:
        "VisBug is an open-source project originally built by the Google Chrome team. Its maintenance status has varied. Element Armory is an actively developed commercial product.",
    },
  ],
};

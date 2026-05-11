---
hub: ai-coding-workflows
hubTitle: "AI Coding Workflows"
cluster: claude-code-workflows
clusterTitle: "Claude Code Workflows"
title: "Use UI With Claude Code: Capture Production Components and Iterate Faster"
slug: "use-ui-with-claude-code"
date: "2026-05-11"
author: "Element Armory Team"
excerpt: "Learn how to capture clean HTML and CSS from live UI, give it to Claude Code, and turn concrete interface references into better frontend output."
readTime: "7 min read"
faq:
  - question: "Can I paste captured HTML and CSS directly into Claude Code?"
    answer: "Yes. Claude Code works best when the HTML is focused and the CSS is clean. Element Armory captures the rendered component structure and computed styles so Claude Code can adapt the UI without guessing from a screenshot."
  - question: "Does Claude Code need a design system to use captured UI?"
    answer: "No, but design system context helps. If your project has tokens, components, or CSS conventions, include those constraints in the prompt so Claude Code adapts the captured UI to your codebase instead of copying it verbatim."
  - question: "Is captured UI safe to reuse?"
    answer: "Use captured UI as reference material for structure, spacing, and interaction patterns. Rebuild it with your own branding, content, and implementation details, especially for commercial work."
  - question: "Does Element Armory generate Claude Code output?"
    answer: "No. Element Armory exports clean HTML and computed CSS. Claude Code is the tool that can transform that captured reference into code that fits your project."
relatedSlugs:
  - use-ui-with-cursor-ai
  - send-html-to-cursor
  - best-prompts-for-ui-generation
  - copy-html-without-inspect-element
---

## The Direct Answer

The fastest way to use real UI with Claude Code is to capture a focused component from a live page, paste the clean HTML and CSS into Claude Code, and ask for a specific adaptation.

That gives Claude Code the part developers usually struggle to describe: the actual hierarchy, spacing, typography, and states of a working interface. Instead of asking it to invent a navbar, card, form, or pricing section from a vague prompt, you give it a concrete reference and a clear job.

---

## Why Real UI Helps Claude Code

Claude Code can reason about code, but it still needs useful context.

A prompt like "make this page look more polished" leaves too much room for guessing. A captured component shows what "polished" means in practice:

* Which elements belong together
* How dense the spacing should feel
* Where the primary action sits
* What typography scale is being used
* Which hover, focus, and responsive states matter

This is the difference between describing a shape in the dark and handing Claude Code the component itself.

---

## The Workflow

1. Find the UI pattern you want to learn from.
2. Capture the smallest complete component with Element Armory.
3. Paste the HTML and CSS into Claude Code.
4. Add your project constraints: framework, CSS approach, accessibility needs, and design tokens.
5. Ask Claude Code to adapt, not clone, the component.
6. Review the output and test it in your app.

The important part is scope. A focused card is useful. A whole marketing page is noisy. Claude Code performs better when the captured reference is small enough to understand and complete enough to render correctly.

---

## A Prompt That Works

Use a prompt like this:

```text
I captured this component as HTML and CSS from a live website.
Use it as a visual and structural reference.

Rebuild it for our app with:
- React functional components
- TypeScript props
- our existing CSS module conventions
- semantic HTML
- keyboard-accessible interactive states

Do not copy brand names, tracking attributes, or source-specific class names.
Keep the layout, rhythm, and hierarchy, but make the implementation fit this codebase.
```

This works because it gives Claude Code the reference, the transformation, and the boundaries.

---

## Where Element Armory Fits

Element Armory handles the slow part before Claude Code starts.

Manual DevTools copying usually gives you incomplete HTML, scattered styles, and a cleanup task. Element Armory captures the rendered element and its computed CSS so the input is already readable. Claude Code can spend its context on adapting the UI instead of repairing the capture.

That is the whole point: less time explaining the interface, more time shaping the result.

---

## Good Use Cases

Use this workflow when you need:

* A better starting point for a component
* A visual reference for a layout Claude Code keeps missing
* A faster way to turn a real UI pattern into your own implementation
* A reference library for repeated frontend work
* A way to compare several patterns before choosing one

It is especially useful for common interface blocks: navbars, pricing cards, empty states, settings panels, dashboard cards, forms, modals, and onboarding steps.

---

## Common Mistakes

**Capturing too much.** Send one component, not the whole page.

**Skipping constraints.** Tell Claude Code how your app is built before asking for output.

**Copying instead of adapting.** Treat captured UI as reference material, then rebuild with your own content and brand.

**Ignoring accessibility.** Ask Claude Code to preserve semantic structure, labels, focus states, and keyboard behavior.

**Trusting the first output.** Test the generated code in your app and iterate from there.

---

## Next Steps

Start with one small component. Capture it, paste it into Claude Code, and ask for a focused rebuild that fits your project. Once that works, save the original reference and the adapted output so future UI work starts from something concrete.

If you also use Cursor, compare this workflow with [using real UI with Cursor AI](/topics/ai-coding-workflows/cursor-workflows/use-ui-with-cursor-ai). For the capture side, read [copy HTML without Inspect Element](/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element).

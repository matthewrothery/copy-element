---
name: write-copy
description: Create desire-driven website and product copy as Markdown files in the project's ./copy directory. Use when the user asks to create, write, draft, or revise copy for use case pages, landing pages, product pages, feature pages, comparison pages, documentation/support pages, homepage sections, website pages, or marketing content, especially prompts like "Create the copy for a use case page for support and documentation" and when the user provides links or examples to use as page design, structure, positioning, or copy references.
---

# Write Copy

## Overview

Write conversion-focused page copy that creates desire first and then makes the desire feel believable. Always produce a Markdown artifact in `./copy` that can be used as the source for a later website implementation plan.

## Required Context

Before drafting or revising copy, read `references/copywriter-principles.md` and apply it as the copywriting doctrine. If the current project also has a root-level `copywriter.md`, read it too and treat it as the user's live version of the doctrine.

## Workflow

1. Determine the page type, audience, product context, desired action, and any references from the user request.
2. Read the bundled copywriting doctrine in `references/copywriter-principles.md`.
3. If the current project contains `copywriter.md`, read it for any newer or project-specific rules.
4. If the user provides links and browsing or fetch tools are available, inspect the linked pages for structure, hierarchy, tone, and reusable page patterns. Do not copy distinctive wording.
5. Create `./copy` if it does not exist.
6. Choose a short hyphen-case filename from the page purpose, for example `support-and-documentation-use-case.md`.
7. Write the copy to `./copy/<filename>.md`.
8. Report the saved path and a brief note about the angle used.

Ask a concise question only when the missing information would make the copy misleading, such as not knowing the product, the target customer, or the page objective. Otherwise make reasonable assumptions and state them inside the Markdown file.

## Copy Principles

Use `references/copywriter-principles.md` for the full doctrine. Keep these condensed rules in mind while working:

Treat the brand as a character with intent, obstacle, response, and emotional resolution:

- Intent: what future the brand is trying to create.
- Obstacle: what stands in the customer's or brand's way.
- Response: how the product or brand acts under that pressure.
- Resolution: what the reader should believe, feel, and trust by the end.

For each major section:

- Headline creates desire: focus on the emotional outcome, relief, confidence, speed, ease, or transformation.
- Supporting copy creates believability: explain how it works, why it is realistic, why it is easy enough, and why this reader can have it.

Prefer simple, concrete, sensory language over hype. Avoid words like "amazing", "revolutionary", "spectacular", and "world-class" unless they are part of quoted source material.

## Markdown Output Structure

Use this structure unless the user requests a different format:

```markdown
# <Page Name>

## Brief

- Page type:
- Audience:
- Primary angle:
- Desired action:
- Desired belief:
- Assumptions:
- References:

## Headline Sequence

1. <Hero headline>
2. <Section headline>
3. <Section headline>

## Hero

- Eyebrow:
- H1:
- Subheadline:
- Primary CTA:
- Secondary CTA:
- Visual direction:

## Section: <Section Name>

- Headline:
- Body:
- Supporting points:
- Proof or trust cue:
- Visual direction:

## FAQ

## Final CTA

## Implementation Notes

- Suggested page rhythm:
- Components likely needed:
- Assets likely needed:
- SEO title:
- SEO description:
```

The `Headline Sequence` must read as a coherent story on its own. If those headlines are the only text a skimmer reads, they should still understand the emotional journey and why the page matters.

## Quality Bar

Before finishing, review the saved Markdown file and tighten it:

- Make the first screen immediately specific to the page topic.
- Make each section earn its place in the narrative.
- Replace generic claims with concrete outcomes, moments, or contrasts.
- Keep proof close to the desire it justifies.
- Make visual directions useful for a future page builder, not decorative filler.
- Ensure the final document can become a website implementation plan without needing to reverse-engineer the strategy.

## Resources

- `references/copywriter-principles.md`: full desire-driven storytelling and conversion copy doctrine adapted from the project's original `copywriter.md`.

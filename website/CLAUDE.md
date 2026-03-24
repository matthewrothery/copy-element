# Website – Rules

Shared design and coding standards are in the root `CLAUDE.md`. This file defines website-specific constraints.

---

## Website Design Rules

Treat the root `CLAUDE.md` as the default source of truth for: token architecture, core palette and typography, spacing and radius scales, interaction timing and feedback, accessibility baseline, and parity checklist.

Do not duplicate those rules here unless a website-specific exception is required.

### Primary Chrome CTA

Default label for Chrome Web Store links in header, hero, `CTABlock`, and footer top CTA: **`Add to Chrome - It's Free`** with **Free** bold — implement via `components/ChromeStoreCtaLabel`. See `website/.cursor/rules/about.mdc` for full copy rules.

### WebsiteConstraint: Marketing and Page-Layout Specific Guidance

These rules are specific to the website and do not apply to the extension popup UI.

**Hero and Marketing Surfaces:**
- Preserve strong visual hierarchy for headline, supporting line, and primary CTA
- Keep copy concise and developer-focused
- Avoid visual clutter that dilutes the core promise

**Content Layout:**
- Prioritize readable sections with clear vertical rhythm
- Use deliberate spacing between section blocks
- Keep section composition consistent across landing pages

**Web-Native Interaction Expectations:**
- Support responsive layouts across desktop, tablet, and mobile breakpoints
- Ensure keyboard and focus states are obvious in navigation and CTAs
- Use subtle motion only to reinforce hierarchy and affordance

### Website Component Guidance

- Keep component styles self-contained near component implementation
- Define component-level tokens in component roots, mapped from shared semantics
- Avoid page-level global overrides for component internals

If a component requires different behavior from shared rules, annotate with: `WebsiteConstraint: <reason>`

### Maintenance

- Update shared conventions in root `CLAUDE.md` first
- Keep this file focused on website-only layout and marketing behavior
- Remove duplicated guidance if it becomes shared policy

---

## Task Workflow

Read `tasks.todo` before starting work and follow its tasks.

Only include tasks in the plan that are present in `tasks.todo`.

Workflow for each task:
1. Take one task (or related tasks) at a time
2. Ask the user clarifying questions
3. Make a plan and present it
4. Ask the user to approve the plan
5. Implement the task
6. Update `tasks.todo` to reflect progress

If issues are found along the way, add them to `debt.todo` (create the file if it doesn't exist).

---

## Context Persistence

This project maintains a `MEMORY.md` file in the directory root for cross-session context.

Read `MEMORY.md` before beginning any task. It contains: project overview, current implementation status, technical decisions, notes from previous sessions, and open questions.

Update `MEMORY.md` when: completing a task or phase, making architectural decisions, discovering important insights, encountering blockers, or changing project direction. Update the "Last updated" date and move completed items from "In Progress" to "Completed".

`MEMORY.md` sections: Project Overview, Project Structure, Tech Stack, Competitors Analysis Summary, CSS Property Whitelist, Implementation Status, Key Insights, Design System, Performance Targets, Notes for Next Session, Questions to Resolve.

---

## Lessons Learned

### Rule: Full-Bleed Carousel Pattern

When creating a carousel that needs to bleed to viewport edges while staying inside a max-width container, use negative margins on the **track**, not the wrapper.

**Why:** Using `position: relative` with `left: 50%; margin-left: -50vw` on the wrapper breaks centering and causes layout issues.

```css
.carousel {
  width: 100%;
  /* NO position, left, right, margin-left, margin-right, or max-width here */
}

.carousel-track {
  margin-left: calc(-1 * max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px)));
  margin-right: calc(-1 * max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px)));
  padding-left: max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px));
  padding-right: max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px));
  width: 100vw;
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.carousel-controls {
  width: 100%;
  max-width: var(--content-max-width);
  margin: var(--carousel-controls-margin-top) auto 0;
  padding-inline: max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px));
}

@media (max-width: 1280px) {
  .carousel-track {
    margin-left: calc(-1 * var(--carousel-padding-inline));
    margin-right: calc(-1 * var(--carousel-padding-inline));
    padding-left: var(--carousel-padding-inline);
    padding-right: var(--carousel-padding-inline);
  }
}
```

Parent requirements: `overflow: visible` on the parent, standard section padding.

---

### Rule: Use PageHero for Content/Utility Page Heroes

Content and utility pages (help, terms, privacy, cookies, etc.) must use the `PageHero` component from `website/components/PageHero`. Do not put `h1`/`p` directly inside a plain outer `Section`.

**Why:** The outer `Section` has `gap: var(--section-gap)` = 256px. Placing `h1` and `p` directly inside it puts 256px of gap between them, making the hero enormous. The fix is always `outer Section → inner Section → content`. The inner `section-inner` uses `gap: var(--space-5)` (32px). `PageHero` encapsulates this pattern correctly.

```tsx
// Correct
<PageHero title="Privacy Policy" subtitle="How we handle your data." />

// Wrong — 256px gap between h1 and p due to --section-gap
<Section style={{ paddingTop: "var(--space-7)" }}>
  <h1 className="page-title">Privacy Policy</h1>
  <p className="page-subtitle">How we handle your data.</p>
</Section>
```

---

### Rule: Alias Component Heading Sizes to Global Tokens

For component heading/subtitle size variables, do not hardcode pixel values. Define the component variable as an alias to global typography tokens in `styles/tokens.css`.

**Why:** Hardcoded per-component sizes drift over time and create inconsistent responsive behavior.

```css
/* Good */
.my-section {
  --my-section-title-size: var(--typo-headline);
  --my-section-subtitle-size: var(--typo-headline-subtitle);
}

/* Avoid */
.my-section {
  --my-section-title-size: 62px;
  --my-section-subtitle-size: 24px;
}
```

---

## Continuous Improvement

If a recurring issue, pattern, or correction is discovered, add it to the Lessons Learned section above.

Add an entry when:
- The same mistake occurs more than once
- The user corrects an implementation, assumption, or approach
- A new project convention or pattern becomes clear
- A better architectural or structural approach is discovered
- A workaround or fix was required to resolve an issue
- A tool, framework, or library behaves in a non-obvious way

Format each entry as:

### Rule: [name]
[clear rule]

**Why:** [brief explanation]

```[code example if applicable]```

Check if an existing rule covers the issue before adding a new one — update instead of duplicating.

Also record important project knowledge in the `/docs` directory: architecture decisions, naming conventions, folder structure expectations, design system rules, build tool quirks, performance constraints.

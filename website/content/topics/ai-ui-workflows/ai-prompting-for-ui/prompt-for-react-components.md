---
listKeywordId: "ai-ui-workflows/ai-prompting-for-ui/prompt-for-react-components"
hub: ai-ui-workflows
hubTitle: "AI Coding Workflows for UI"
cluster: ai-prompting-for-ui
clusterTitle: "AI Prompting for UI"
title: "How to Prompt AI for React Components"
slug: "prompt-for-react-components"
date: "2026-05-01"
author: "Element Armory Team"
excerpt: "Learn how to write effective prompts for AI tools like Claude, ChatGPT, and Cursor to generate production-ready React components faster. Includes practical patterns, real examples, and techniques that actually work."
readTime: "7 min read"
coverImage: "/topic-images/ai-ui-workflows/ai-prompting-for-ui/prompt-for-react-components.png"
faq:
  - question: "What's the difference between a vague prompt and a strong React component prompt?"
    answer: "A vague prompt (e.g., 'make a button') produces generic output. A strong prompt specifies structure (component props, state), styling (colors, spacing, responsive behavior), and behavior (click handlers, validation). Strong prompts include context about where the component fits in your app."
  - question: "Should I paste real UI into my AI prompts?"
    answer: "Yes. Pasting actual HTML and CSS from a website (using Element Armory or DevTools) gives AI a concrete reference. This produces components that match your design system faster than describing the design in words."
  - question: "How do I get AI to generate components with the right props and TypeScript types?"
    answer: "Explicitly state the props you need in your prompt. Example: 'Create a Button component that accepts: variant (primary | secondary), size (sm | md | lg), disabled (boolean), and onClick handler. Use TypeScript interfaces.' This prevents generic output."
  - question: "Can I use the same prompt across different AI tools (Claude, ChatGPT, Cursor)?"
    answer: "Mostly yes, but Cursor and Claude tend to produce better component code than ChatGPT. Cursor integrates with your codebase context, so it can reference your existing components. Adjust prompts slightly for each tool based on what works best."
relatedSlugs:
  - best-prompts-for-ui-generation
  - use-ui-with-cursor-ai
  - cursor-component-reuse
  - how-to-copy-css-from-any-website
  - how-to-copy-html-from-website
---

## Quick Answer

The best React component prompts combine three things: **clear structure** (what the component does), **specific styling** (how it looks), and **behavior details** (how it responds to user input). Instead of asking "build me a button," say "build a button component that accepts a size prop (sm, md, lg), has a loading state with a spinner, and fires an onClick handler." AI tools like Claude and Cursor respond dramatically better to prompts that specify props, states, and edge cases upfront. This cuts iteration time in half and produces code you can actually use.

---

## Why Your AI React Prompts Aren't Working

Most developers ask AI for components the same way they'd ask a coworker: vaguely. "Make me a form" or "I need a card component" leaves the AI guessing about props, styling, accessibility, and behavior.

The result? You get generic code that needs heavy refactoring.

The real problem isn't the AI. It's that you're not giving it enough context to make good decisions. AI models like Claude and ChatGPT are pattern-matching machines. They work best when you show them the exact pattern you want.

When you're vague, the AI defaults to:

* Minimal props
* Basic styling
* No error handling
* No loading states
* No accessibility attributes

You then spend 20 minutes rewriting what should have taken 2 minutes to prompt correctly.

---

## The Anatomy of a Strong React Component Prompt

A strong prompt has four layers:

![Four-layer structure of an effective React component prompt: Purpose, Props and Interface, Visual and Behavioral Requirements, and Edge Cases and Constraints.](/topic-images/ai-ui-workflows/ai-prompting-for-ui/prompt-for-react-components-diagram-prompt-anatomy.svg)

*A well-structured prompt gives AI all the context it needs to generate usable code on the first try.*

**Layer 1: Purpose**

What does this component do? One sentence.

Example: "A reusable button component for form submissions."

**Layer 2: Props and Interface**

What inputs does it accept? List them explicitly.

```
Props:
- variant: 'primary' | 'secondary' | 'danger'
- size: 'sm' | 'md' | 'lg'
- isLoading: boolean
- disabled: boolean
- onClick: (e: React.MouseEvent) => void
```

**Layer 3: Visual and Behavioral Requirements**

How should it look and behave?

```
- Primary variant: solid blue background, white text
- Secondary variant: white background, blue border, blue text
- When isLoading is true: show spinner, disable interactions
- Hover state: 10% darker background
```

**Layer 4: Edge Cases and Constraints**

What should it handle?

```
- Prevent double-clicks while loading
- Support keyboard navigation (Enter, Space)
- Accessible: ARIA labels, focus states
- No external dependencies (use React only)
```

When you structure prompts this way, AI generates code that's 80% production-ready instead of 20%.

---

## Prompt Pattern 1: Component Structure Prompts

Use this pattern when you need a component with specific props and behavior.

**Template:**

```
Build a [Component Name] component in React that:

Purpose: [One sentence describing what it does]

Props:
- [prop name]: [type] - [description]
- [prop name]: [type] - [description]

Behavior:
- [specific behavior 1]
- [specific behavior 2]

Constraints:
- [constraint 1]
- [constraint 2]
```

**Real Example:**

```
Build a SearchInput component in React that:

Purpose: A controlled input field for searching with debounced onChange callback.

Props:
- value: string - current search value
- onChange: (value: string) => void - called after 300ms debounce
- placeholder: string - input placeholder text
- isLoading: boolean - shows spinner while searching

Behavior:
- Debounce onChange calls by 300ms
- Show a spinner icon when isLoading is true
- Clear button appears when value is not empty
- Pressing Escape clears the input

Constraints:
- Use React hooks only, no external libraries
- Include TypeScript types
- Support keyboard navigation
```

This prompt tells the AI exactly what to build. No guessing. No iteration.

---

## Prompt Pattern 2: Styling and Appearance Prompts

Use this when you want a component styled a specific way without relying on a design system.

**Template:**

```
Style a [Component Name] component with:

Visual Design:
- [color/spacing/typography detail]
- [color/spacing/typography detail]

States:
- Default: [description]
- Hover: [description]
- Active/Pressed: [description]
- Disabled: [description]

Responsive:
- Mobile: [layout changes]
- Desktop: [layout changes]

Styling Approach: [inline styles | CSS modules | Tailwind | styled-components]
```

**Real Example:**

```
Style a PricingCard component with:

Visual Design:
- White background with subtle shadow (0 2px 8px rgba(0,0,0,0.1))
- Rounded corners (8px)
- Padding: 24px
- Border: 1px solid #e5e7eb
- Title: 18px, bold, dark gray
- Price: 32px, bold, primary blue (#2563eb)
- Description: 14px, medium gray

States:
- Default: light gray background
- Hover: 2px solid blue border, shadow increases
- Selected: blue background, white text

Responsive:
- Mobile: full width, padding 16px
- Desktop: max-width 320px

Styling Approach: Inline styles (no external CSS)
```

The AI now knows exactly how to style it. No back-and-forth about colors or spacing.

---

## Prompt Pattern 3: Behavior and Interactivity Prompts

Use this for components with complex state or interactions.

**Template:**

```
Build a [Component Name] component with:

Initial State:
- [state variable]: [initial value]
- [state variable]: [initial value]

User Interactions:
- When [user action], [component should do X]
- When [user action], [component should do Y]

Side Effects:
- On mount: [what happens]
- On [prop] change: [what happens]

Error Handling:
- If [error condition], [show this]
```

**Real Example:**

```
Build a FileUpload component with:

Initial State:
- files: [] (array of File objects)
- isUploading: false
- uploadProgress: 0
- error: null

User Interactions:
- When user clicks the drop zone, open file picker
- When user drags files over, highlight the zone
- When user drops files, validate and add to state
- When user clicks upload button, start upload and show progress
- When user clicks remove on a file, delete it from the list

Side Effects:
- On mount: check if browser supports drag-and-drop
- When files array changes: validate file types and sizes
- When upload completes: clear the list and show success message

Error Handling:
- If file size > 10MB, show error message
- If file type not in [jpg, png, pdf], reject it
- If upload fails, show error and allow retry
```

This gives the AI a complete mental model of how the component should work.

---

## Real Examples: Prompts That Generate Production Code

Here are three prompts that consistently produce usable code:

**Example 1: Modal Dialog**

```
Build a Modal component in React that:

Purpose: A reusable modal dialog for confirmations and alerts.

Props:
- isOpen: boolean - controls visibility
- title: string - modal title
- children: ReactNode - modal content
- onClose: () => void - called when user closes
- onConfirm: () => void - called when user confirms
- confirmText: string - confirm button label (default: "Confirm")
- cancelText: string - cancel button label (default: "Cancel")
- isDangerous: boolean - if true, confirm button is red

Behavior:
- Show/hide based on isOpen prop
- Close when user clicks X button, Cancel, or outside the modal
- Prevent body scroll when open
- Focus trap: keyboard focus stays inside modal
- Escape key closes the modal
- Confirm button is red if isDangerous is true

Styling:
- Dark overlay (rgba(0,0,0,0.5))
- White modal box, centered on screen
- Rounded corners (8px)
- Min-width: 400px on desktop, full width on mobile
- Buttons: 8px padding, 4px border-radius

Constraints:
- Use React hooks only
- Include TypeScript types
- No external UI libraries
```

**Example 2: Tabs Component**

```
Build a Tabs component in React that:

Purpose: A tabbed interface for switching between content sections.

Props:
- tabs: Array<{ id: string; label: string; content: ReactNode }>
- defaultTabId: string - which tab is active on mount
- onChange: (tabId: string) => void - called when user switches tabs

Behavior:
- Render tab buttons horizontally
- Show content for the active tab
- Highlight the active tab button
- Support keyboard navigation (arrow keys to switch tabs)
- Support mouse clicks to switch tabs

Styling:
- Tab buttons: gray text, bottom border on active (2px solid blue)
- Hover: light gray background
- Active: blue text, blue bottom border
- Content area: padding 16px, light gray background

Constraints:
- Use React hooks (useState)
- Include TypeScript types
- No external libraries
```

**Example 3: Dropdown Menu**

```
Build a Dropdown component in React that:

Purpose: A dropdown menu that opens/closes on click.

Props:
- trigger: ReactNode - the element that opens the menu
- items: Array<{ label: string; onClick: () => void }>
- align: 'left' | 'right' - menu alignment relative to trigger

Behavior:
- Open menu when trigger is clicked
- Close menu when user clicks an item
- Close menu when user clicks outside
- Close menu when Escape is pressed
- Highlight item on hover

Styling:
- Menu: white background, shadow, rounded corners (4px)
- Items: 12px padding, gray text
- Hover: light gray background
- Trigger: no special styling (use children)

Constraints:
- Use React hooks and useRef for positioning
- Include TypeScript types
- No external libraries
```

Each of these prompts produces working code in one shot because they specify structure, behavior, and constraints upfront.

---

## How to Iterate When AI Output Misses the Mark

Even with a great prompt, sometimes the AI misses something. Here's how to iterate effectively:

**Step 1: Identify What's Wrong**

Be specific. Don't say "this doesn't look right." Say "the hover state doesn't change the background color" or "the loading spinner doesn't appear when isLoading is true."

**Step 2: Reference the Original Prompt**

Point back to what you asked for: "In the original prompt, I said the hover state should be 10% darker. The current code doesn't do that."

**Step 3: Provide the Fix, Not the Problem**

Instead of: "The button doesn't look good."

Say: "The button padding should be 12px 16px instead of 8px 12px. Also, the border-radius should be 6px, not 4px."

**Step 4: Ask for Specific Changes**

```
Update the Modal component:
- Add a closeIcon prop (boolean) to show/hide the X button
- When closeIcon is false, only allow closing via Cancel button or Escape
- Add a maxWidth prop to control modal width
```

This is much faster than asking the AI to "improve" something.

---

## Combining Real UI with AI Prompts for Faster Results

Here's a pro move: capture real UI from websites and use it as a reference in your prompt.

Instead of describing a button design in words, you can say:

```
Build a Button component that looks like the button at [website].
Use this HTML/CSS as reference:

[paste the HTML and CSS]

But make these changes:
- Add a loading state with spinner
- Support size variants (sm, md, lg)
- Add a disabled state
```

This is where tools like [Element Armory](/topics/copy-ui) shine. You can [copy CSS from any website](/topics/copy-ui/copy-css/how-to-copy-css-from-any-website) and feed it directly into your AI prompt. The AI then understands the exact visual style you want and can extend it with new features.

You can also [use real UI with Cursor AI](/topics/ai-ui-workflows/cursor-workflows/use-ui-with-cursor-ai) to speed up component generation even more. Cursor can see the UI you're referencing and generate code that matches it.

---

## Common Mistakes That Waste AI Tokens

**Mistake 1: Vague Props**

❌ "Add a size prop"

✅ "Add a size prop with values 'sm' | 'md' | 'lg' that controls padding and font-size"

**Mistake 2: Assuming Default Behavior**

❌ "Make it accessible"

✅ "Add aria-label, aria-expanded, and role attributes. Support keyboard navigation with Tab and Enter keys."

**Mistake 3: Forgetting Edge Cases**

❌ "Add a loading state"

✅ "Add a loading state that shows a spinner, disables the button, and prevents double-clicks"

**Mistake 4: Mixing Concerns**

❌ "Build a form with validation, styling, and API integration"

✅ Build the form component first. Then ask for validation. Then ask for API integration.

**Mistake 5: Not Specifying Styling Approach**

❌ "Style it nicely"

✅ "Use inline styles only. No CSS files or Tailwind. Colors: primary blue (#2563eb), text gray (#374151)"

---

## Testing and Refining Your Component Prompts

Once you have a prompt that works, save it. Build a library of prompts for common components.

**Test your prompt by:**

1. Running the generated code in your project
2. Checking that all props work as described
3. Testing keyboard navigation and accessibility
4. Verifying responsive behavior on mobile
5. Checking edge cases (empty states, loading, errors)

**Refine by:**

* Adding constraints that prevent common mistakes
* Specifying exact spacing and sizing values
* Including TypeScript types upfront
* Mentioning accessibility requirements explicitly

Over time, you'll develop a set of prompts that consistently produce production-ready code. This is where AI coding becomes genuinely fast.

---

## Explore This Topic

* [Best Prompts for UI Generation with AI](/topics/ai-ui-workflows/ai-prompting-for-ui/best-prompts-for-ui-generation)
* [How to Use Real UI with Cursor AI](/topics/ai-ui-workflows/cursor-workflows/use-ui-with-cursor-ai)
* [Reusing UI Components with Cursor](/topics/ai-ui-workflows/cursor-workflows/cursor-component-reuse)
* [AI Coding Workflows for UI](/topics/ai-ui-workflows)

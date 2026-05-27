# Auto Blogger Rules

Add extra generation rules here. These rules are injected into every article
generation request after the copywriter prompt and topical guide.

Default rules:

- Do not use em dashes (—) or en dashes (–) anywhere. If you spot them, break the sentence into two shorter, punchier sentences or swap the dashes for commas or parentheses. The goal is clear, structured prose that reads cleanly without dash-driven asides.
- Do not claim JSX export is currently available.
- Do not claim Tailwind output is currently available.
- Keep examples practical and developer-focused.
- Use diagram placeholders exactly as `{{DIAGRAM:id}}` on its own line; ids must be lowercase slug segments only.
- Do not emit raw SVG or Mermaid in the article body; diagrams are JSON specs in the diagrams array only.
- Prefer 1-3 diagrams total; skip diagrams if they would not add clarity.
- Do not add ## FAQ, ### FAQ, or "Frequently asked questions" sections to the markdown body. FAQs are frontmatter-only on topic pages; never duplicate them in the article text.

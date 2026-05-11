---
type: cluster
hub: ai-coding-workflows
hubTitle: "AI Coding Workflows"
cluster: claude-code-workflows
title: "Claude Code Workflows"
excerpt: "How to use captured HTML and CSS as concrete UI context for Claude Code."
faq:
  - question: "Why give Claude Code captured UI instead of a screenshot?"
    answer: "Captured HTML and CSS gives Claude Code exact structure, spacing, and style values. A screenshot shows the result, but code gives the model something it can inspect, adapt, and integrate."
  - question: "Does Element Armory export Claude Code components directly?"
    answer: "No. Element Armory captures clean HTML and computed CSS. Claude Code can then adapt that code into your project's component structure."
  - question: "How much UI should I capture for Claude Code?"
    answer: "Capture the smallest complete component that contains the pattern you want, such as a navbar, card, form, or pricing block. Avoid sending an entire page when one section is enough."
---

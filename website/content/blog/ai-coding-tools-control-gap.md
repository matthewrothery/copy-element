---
title: "AI Coding Tools Have a Control Problem"
slug: "ai-coding-tools-control-gap"
date: "2026-06-19"
author: "Element Armory Team"
excerpt: "AI coding agents are shipping into production without defensive infrastructure. The gap between capability and safety is widening faster than solutions can close it."
readTime: "5 min read"
coverImage: "/blog/ai-coding-tools-control-gap.png"
---

The AI coding tooling space has a control problem. We're shipping agents and assistants into production without the defensive infrastructure to handle when they fail, get compromised, or behave unexpectedly. The industry is starting to notice, but the gap between capability and safety is widening faster than solutions can close it.

## Agentjacking shows the attack surface is wider than we thought

[Agentjacking is a novel attack technique](https://www.scworld.com/brief/agentjacking-attack-exploits-ai-coding-tools-with-fake-error-reports) that demonstrates how fragile the trust model around AI coding agents really is. Researchers at Tenet Threat Labs showed that attackers can craft fake Sentry error reports to manipulate AI coding assistants into executing arbitrary commands on a developer's machine. No stolen credentials. No network breach. Just a poisoned error log that an agent trusts because it comes from a monitoring platform the developer uses every day.

This isn't a theoretical edge case. It's a direct hit on the assumption that AI agents will only act on legitimate signals. The attack works because agents are designed to be helpful and responsive to error reports. They're trained to see a stack trace and fix it. An attacker just needs to make the fake error look real enough.

The problem scales with adoption. Every developer using an AI coding agent becomes a potential attack vector. Every integration point between the agent and external services (Sentry, GitHub, Slack, internal APIs) is a surface where an attacker can inject malicious instructions disguised as legitimate data.

## AI agents need the same access controls as employees

[Google Deepmind treats its own AI agents like rogue employees with office keys](https://the-decoder.com/google-deepmind-treats-its-own-ai-agents-like-rogue-employees-with-office-keys/). The company's AI Control Roadmap assumes that a highly capable AI agent might not share its operators' goals and plans accordingly. They've built a safety framework that doesn't rely on alignment alone. Instead, they use dual controls: trust the agent, but keep a hand near the wheel and a foot near the brakes.

This is the right mental model. An AI agent with access to your codebase, your deployment pipeline, and your production infrastructure should be treated with the same skepticism you'd apply to a contractor with the same access. You wouldn't give a contractor unlimited permissions and hope they stay aligned with your goals. You'd use role-based access control, audit logs, approval workflows, and rate limits.

Most AI coding tools don't have these controls. They run in your IDE with the same permissions as your user account. They can read any file, modify any file, and execute any command. If an agent gets compromised or behaves unexpectedly, there's no circuit breaker between the agent and your system.

## Legacy security tooling can't keep pace with machine-generated code

[Legacy security tools fail because they check code at human speeds and lack the broader cloud context needed to understand machine-scale AI code risks](https://www.ox.security/blog/the-top-security-risks-of-ai-generated-code-preventing-vulnerabilities-at-creation-for-appsec-leaders/). Traditional SAST and DAST tools were built to scan code written by humans at human pace. They're not equipped to handle the volume, velocity, or patterns of machine-generated code.

AI models confidently replicate vulnerable patterns because they're trained on decades of open-source repositories that contain outdated security habits. A model trained on legacy code will generate legacy vulnerabilities. It will invent fake package names that don't exist. It will suggest patterns that look plausible but are actually dangerous.

The real problem is that security teams are still using tools designed for a different era. They're checking code after it's written, after it's committed, after it's deployed. By then, the damage is done. You need security controls that understand AI-generated code at the point of generation, not after the fact.

## The optimization race is real, but it doesn't solve trust

[New AI optimization frameworks are beating Claude Code and Codex by 2.5x on the same compute budget](https://venturebeat.com/orchestration/new-ai-optimization-framework-beats-claude-code-and-codex-by-2-5x-on-the-same-compute-budget). The industry is racing to make AI coding agents faster, cheaper, and more capable. This is good for productivity. It's terrible for security.

Optimization pressure creates perverse incentives. Teams focus on speed and accuracy metrics. They don't focus on auditability, explainability, or defensive infrastructure. An agent that's 2.5x faster but 10x harder to control is a net loss for production systems.

The optimization race also concentrates power. Only the largest companies can afford to build and maintain the infrastructure needed to run these agents safely. Smaller teams get the speed benefits without the safety infrastructure. They're left holding the bag when things break.

## Private inference is becoming table stakes for sensitive work

[0G Private Computer launched GLM-5.2 for private, verifiable AI coding](https://markets.businessinsider.com/news/stocks/0g-private-computer-launches-glm-5-2-for-private-verifiable-ai-coding-1036260347). Developers can now run one of the strongest open-weight coding models on fully private infrastructure without exposing prompts, code, or data to a centralized provider.

This is a signal that the market is starting to demand privacy guarantees. If you're using an AI coding agent to work on proprietary code, you probably don't want your prompts and generated code flowing through a third-party API. You want the model running on your infrastructure, under your control.

But private inference is still a niche solution. Most developers are still using cloud-based AI coding assistants. They're trading privacy for convenience. As security incidents pile up, that trade-off will become harder to justify.

## Developers are the ones holding the bag when things break

When an AI agent generates vulnerable code, who's responsible? The developer who used the tool? The tool vendor? The model provider? The answer is usually the developer. They're the ones who committed the code. They're the ones who deployed it. They're the ones who get paged at 3 AM when it breaks in production.

[The security conversation around AI agents is shifting](/blog/ai-agents-security-vibe-shift-2026), but it's shifting slowly. Most teams are still in the "move fast and break things" phase. They're optimizing for speed and productivity. They're not optimizing for control, auditability, or resilience.

The gap between capability and safety is real. It's widening. And developers are the ones bearing the risk while the industry figures out how to close it.

The path forward requires three things. First, defensive infrastructure that treats AI agents like untrusted actors, not trusted teammates. Second, security tooling that understands machine-generated code at the point of generation. Third, a shift in incentives away from pure speed and toward safety and auditability.

Until then, every AI coding agent in production is a potential liability. The industry is moving fast. The safeguards are moving slowly. Developers need to start asking harder questions about what they're shipping and who's responsible when it fails.

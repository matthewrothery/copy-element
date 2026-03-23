import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const PostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  readTime: z.string(),
  body: z.string(),
});

export type GeneratedPost = z.infer<typeof PostSchema>;

function resolveModel() {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "anthropic") {
    const model = process.env.DEFAULT_ANTHROPIC_MODEL ?? "claude-haiku-4-5";
    return anthropic(model);
  }
  const model = process.env.DEFAULT_OPENAI_MODEL ?? "gpt-5.4-mini";
  return openai(model);
}

export async function generatePost(
  topic: string,
  copywriterPrompt: string
): Promise<GeneratedPost> {
  const systemPrompt = `${copywriterPrompt}

---

You are writing blog posts for Element Armory - Capture UI Elements.

Voice: developer-focused, technical but clear, minimal, confident. No marketing fluff. No buzzwords. No competitor references.

Tagline: "Capture UI from any site and rebuild it with AI."

Todays Date and Time: ${new Date().toISOString()}

We are targeting:
- Vibe coders (people who do not know how to code but are leveraging AI to code)
- Beginners who are learning to code
- Developers using AI to speed up their workflow

Noting that: Vibe coding is an AI-assisted software development approach where natural language prompts ("vibes") are used to generate, refine, and debug code, shifting focus from syntax to creative intent.

Write posts that our audience will find genuinely useful — real insight, concrete examples, honest perspective.
Do not include the title in the body of the post.
`;

  const { object } = await generateObject({
    model: resolveModel(),
    schema: PostSchema,
    system: systemPrompt,
    prompt: `Write a blog post about: ${topic}

The body should be full markdown — use headers, code blocks, lists, and blockquotes where appropriate. No frontmatter. Aim for 600–1000 words.`,
  });

  return object;
}

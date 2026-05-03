# Auto Blogger

Standalone service that generates topical authority articles for Element Armory.

The service:

- picks keywords from `list.md`
- reads `guide.md`, `copywriter-prompt.md`, and `rules.md`
- researches current web sources
- generates article markdown and image prompts with Anthropic by default
- generates stencil-style cover images with Gemini (Nano Banana / gemini-2.5-flash-image by default)
- stages artifacts in S3
- emails the generated copy and image

## Commands

```bash
npm run dev
npm run build
npm start
npm run import
```

## Local dry run

```bash
cp .env.example .env
npm install
npm run dev
```

Dry runs require `ANTHROPIC_API_KEY`, skip image generation, and write artifacts under
`auto-blogger/dry-runs/<artifact-id>/`. If you run `npm run generate:local` without
`--no-image`, it also requires `GEMINI_API_KEY` for cover image generation.

The local generation flow now:

- loads existing topic hub, cluster, and article titles from `../website/content/topics`
- passes those internal link options into the article prompt
- asks for 3-10 natural inline internal links, capped at 10 per article
- runs general research plus statistics/data-focused searches
- requires concrete data claims to cite original sources with markdown links
- starts the body with a short conversational answer before the first section heading

## Local single-article generation

Use this when you want to regenerate one existing topic article and test image generation locally.

Preview mode writes to `auto-blogger/dry-runs/<artifact-id>/`:

```bash
npm run generate:local -- --path ../website/content/topics/copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website.md
```

Write mode replaces the markdown under `website/content/topics` and writes the generated image under
`website/public/topic-images`:

```bash
npm run generate:local -- --path ../website/content/topics/copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website.md --write
```

You can also target a keyword from `list.md`:

```bash
npm run generate:local -- --keyword "how to copy css from any website"
```

Options:

- `--path <article.md>` regenerates from an existing topic article path
- `--keyword "<keyword>"` generates from a keyword in `list.md`
- `--write` writes into the website content/image directories
- `--no-image` skips image generation for faster copy-only testing
- `--date YYYY-MM-DD` overrides the generated article date

## Required Production Env

- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `AUTO_BLOG_S3_BUCKET`
- `AUTO_BLOG_NOTIFY_TO`
- `AUTO_BLOG_NOTIFY_FROM`

Optional: `OPENAI_API_KEY` only if `AUTO_BLOG_TEXT_PROVIDER=openai`.

## Common Env

- `DAILY_ARTICLES=1`
- `AUTO_BLOG_MODE=daemon`
- `AUTO_BLOG_TEXT_PROVIDER=anthropic`
- `AUTO_BLOG_TEXT_MODEL=claude-haiku-4-5`
- `AUTO_BLOG_S3_PREFIX=auto-blogger`
- `AUTO_BLOG_IMAGE_MODEL=gemini-2.5-flash-image`
- `AUTO_BLOG_IMAGE_PALETTE=vibrant`

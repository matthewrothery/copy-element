/**
 * Deterministic element naming: derives a human-readable display name and
 * machine-friendly slug from a DOM element using a priority-based pipeline
 * (attributes → text → id → class → parent context → tag suffix).
 */

export interface ExtractedNameResult {
  /** Slug for filenames, component names (e.g. "start-free-trial-button"). */
  machineName: string;
  /** Human-readable label (e.g. "Start Free Trial Button"). */
  displayName: string;
  confidence: number;
  source: string;
}

const USEFUL_ATTRS = [
  "aria-label",
  "data-testid",
  "data-test",
  "data-qa",
  "name",
  "id",
  "title",
  "alt",
  "placeholder",
  "role"
];

const NOISY_CLASS_PATTERNS = [
  /^css-[a-zA-Z0-9]+$/,
  /^sc-[a-zA-Z0-9]+$/,
  /^jsx-[a-zA-Z0-9]+$/,
  /^__[a-zA-Z0-9]+$/,
  /^x[0-9a-f]{5,}$/i,
  /^[a-z0-9]{8,}$/i,
  /^(mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py|gap|grid|flex|block|inline|hidden|relative|absolute|text|bg|border|rounded|w|h|min|max)-/
];

const GENERIC_WORDS = new Set([
  "container",
  "wrapper",
  "inner",
  "outer",
  "content",
  "box",
  "item",
  "component",
  "module",
  "section",
  "row",
  "col",
  "root"
]);

const MAX_VISIBLE_TEXT_LENGTH = 60;

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[''"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function machineNameToDisplayName(machineName: string): string {
  if (!machineName) return machineName;
  return machineName
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function getTagSuffix(el: Element): string {
  const tag = el.tagName.toLowerCase();

  if (tag === "button") return "button";
  if (tag === "a") return "link";
  if (tag === "input") return "input";
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  if (tag === "img") return "image";
  if (tag === "form") return "form";
  if (tag === "nav") return "nav";
  if (tag === "section") return "section";
  if (tag === "article") return "article";
  if (tag === "ul" || tag === "ol") return "list";
  if (tag === "li") return "item";
  if (tag === "header") return "header";
  if (tag === "footer") return "footer";
  if (tag === "aside") return "aside";

  const role = el.getAttribute("role");
  if (role) {
    if (role === "button") return "button";
    if (role === "link") return "link";
    if (role === "navigation") return "nav";
    if (role === "search") return "search";
    if (role === "dialog") return "dialog";
    if (role === "tab") return "tab";
  }

  return "container";
}

function isNoisyClass(token: string): boolean {
  return NOISY_CLASS_PATTERNS.some((pattern) => pattern.test(token));
}

function getUsefulClassTokens(el: Element): string[] {
  const classList = Array.from(el.classList);

  return classList
    .map((c) => c.trim())
    .filter(Boolean)
    .filter((c) => !isNoisyClass(c))
    .flatMap((c) => c.split(/[-_]/g))
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2)
    .filter((t) => !GENERIC_WORDS.has(t));
}

function getShortVisibleText(el: Element): string | null {
  const text = cleanText(el.textContent || "");
  if (!text) return null;
  if (text.length > MAX_VISIBLE_TEXT_LENGTH) return null;
  return text;
}

function getNearestParentContext(el: Element): string | null {
  let current: Element | null = el.parentElement;
  let depth = 0;

  while (current && depth < 3) {
    const id = current.getAttribute("id");
    if (id) {
      const slug = slugify(id);
      if (slug && !GENERIC_WORDS.has(slug)) return slug;
    }

    const usefulClass = getUsefulClassTokens(current)[0];
    if (usefulClass) return slugify(usefulClass);

    const tag = current.tagName.toLowerCase();
    if (
      ["nav", "header", "footer", "main", "aside", "section", "article"].includes(
        tag
      )
    ) {
      return tag;
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

function dedupeWords(parts: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    result.push(part);
  }

  return result;
}

function buildResult(
  machineName: string,
  confidence: number,
  source: string
): ExtractedNameResult {
  return {
    machineName,
    displayName: machineNameToDisplayName(machineName),
    confidence,
    source
  };
}

/**
 * Extracts a deterministic name from a DOM element using a priority-based
 * pipeline: explicit attributes → visible text → id → cleaned class tokens
 * → parent context → tag/role suffix.
 */
export function extractElementName(el: Element): ExtractedNameResult {
  const suffix = getTagSuffix(el);

  for (const attr of USEFUL_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value) continue;

    const slug = slugify(value);
    if (slug && slug.length >= 3) {
      const name =
        slug.endsWith(`-${suffix}`) || slug === suffix ? slug : `${slug}-${suffix}`;
      return buildResult(name, 0.95, `attribute:${attr}`);
    }
  }

  const text = getShortVisibleText(el);
  if (text) {
    const slug = slugify(text);
    if (slug) {
      const name =
        slug.endsWith(`-${suffix}`) || slug === suffix ? slug : `${slug}-${suffix}`;
      return buildResult(name, 0.88, "text");
    }
  }

  const id = el.getAttribute("id");
  if (id) {
    const slug = slugify(id);
    if (slug) {
      const name = slug.endsWith(`-${suffix}`) ? slug : `${slug}-${suffix}`;
      return buildResult(name, 0.82, "id");
    }
  }

  const classTokens = getUsefulClassTokens(el);
  if (classTokens.length) {
    const main = dedupeWords(classTokens)
      .slice(0, 3)
      .join("-");
    if (main) {
      const name = main.endsWith(`-${suffix}`) ? main : `${main}-${suffix}`;
      return buildResult(name, 0.72, "class");
    }
  }

  const parentContext = getNearestParentContext(el);
  if (parentContext) {
    return buildResult(`${parentContext}-${suffix}`, 0.6, "parent-context");
  }

  return buildResult(suffix, 0.3, "fallback");
}

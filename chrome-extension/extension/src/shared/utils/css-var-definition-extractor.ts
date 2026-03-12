/**
 * Extracts CSS custom property definitions used in extracted rules and emits
 * a :root block with computed values so snippets render correctly when
 * variable definitions live on unmatched selectors (e.g. body.web, :root).
 */

/** Matches var(--name) or var(--name, fallback). Captures the custom property name including --. */
const VAR_NAME_RE = /var\s*\(\s*(--[\w-]+)\s*(?:,\s*[^)]+)?\s*\)/g;

/**
 * Collects all custom property names referenced in CSS text via var(--name).
 * Returns a set of names including the leading -- (e.g. "--typo-copy").
 */
export function collectVarNamesFromCss(cssText: string): Set<string> {
  const names = new Set<string>();
  VAR_NAME_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VAR_NAME_RE.exec(cssText)) !== null) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Returns a :root { --name: value; ... } block for all variables used in
 * cssText that have a computed value on rootElement. Variables inherit, so
 * the root of the captured subtree is sufficient. Returns "" if none.
 */
export function extractUsedCssVariableDefinitions(
  rootElement: Element,
  cssText: string
): string {
  const names = collectVarNamesFromCss(cssText);
  if (names.size === 0) {
    return "";
  }

  const computed = window.getComputedStyle(rootElement);
  const declarations: string[] = [];

  for (const name of names) {
    const value = computed.getPropertyValue(name).trim();
    if (value.length > 0) {
      declarations.push(`${name}: ${value}`);
    }
  }

  if (declarations.length === 0) {
    return "";
  }

  return `:root {\n  ${declarations.join(";\n  ")};\n}`;
}

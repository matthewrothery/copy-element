/**
 * Detects var(--*) and var(--x, fallback) in CSS values.
 * Matches CSS custom property references with optional fallback.
 */
const VAR_RE = /var\s*\(\s*--[\w-]+\s*(?:,\s*[^)]+)?\s*\)/;

export function containsVarReference(value: string): boolean {
  return VAR_RE.test(value);
}

/**
 * Resolves var(--*) in author values to computed values using getComputedStyle.
 * Nested/recursive variables (e.g. --a: var(--b); --b: 1px) are handled by
 * the browser's getComputedStyle for standard properties.
 */
export function resolveVarInValue(
  element: Element,
  property: string,
  authorValue: string
): string {
  if (!containsVarReference(authorValue)) {
    return authorValue;
  }
  const computed = window.getComputedStyle(element).getPropertyValue(property).trim();
  return computed || authorValue;
}

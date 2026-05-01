/**
 * Schema.org expects ISO-8601 datetimes. Front matter often uses date-only (YYYY-MM-DD).
 */
export function schemaIsoDateFromFrontmatter(date: string): string {
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00.000Z`;
  }
  return trimmed;
}

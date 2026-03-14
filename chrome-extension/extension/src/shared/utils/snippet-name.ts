import {
  uniqueNamesGenerator,
  adjectives,
  names
} from "unique-names-generator";

/**
 * Generates a human-readable random name for a snippet (e.g. "Admiring Curie").
 * Uses adjective + name for 50M+ combinations.
 */
export function generateSnippetName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, names],
    separator: " ",
    length: 2,
    style: "capital"
  });
}

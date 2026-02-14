const STOP_WORDS = new Set([
  "de",
  "du",
  "le",
  "la",
  "les",
  "des",
  "un",
  "une",
  "the",
  "of",
  "and",
  "et",
  "a",
  "l",
  "d",
]);

/**
 * Normalize a race name for fuzzy matching:
 * - lowercase
 * - remove accents
 * - remove special characters
 * - remove stop words
 * - collapse whitespace
 */
export function normalizeRaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ") // replace special chars with space
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

/**
 * Split a normalized race name into search terms for ILIKE queries.
 */
export function getSearchTerms(normalizedName: string): string[] {
  return normalizedName.split(/\s+/).filter((t) => t.length >= 2);
}

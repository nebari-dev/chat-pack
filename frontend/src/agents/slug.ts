/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * The maximum length of the human-readable part of a generated agent id.
 */
const MAX_SLUG_LENGTH = 40;

/**
 * The length of the random suffix appended to a generated agent id.
 */
const SUFFIX_LENGTH = 6;

/**
 * The alphabet for the random suffix (base36, lowercase).
 */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Turn an agent name into a URL-safe slug.
 *
 * Diacritics are stripped, everything that is not `[a-z0-9]` collapses to a
 * single dash, and the result is trimmed and truncated. An empty result
 * (e.g. a name written entirely in a non-Latin script) falls back to `agent`.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || 'agent';
}

/**
 * Generate a random base36 suffix.
 */
function randomSuffix(): string {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

/**
 * Generate a unique-enough agent id from a display name.
 *
 * Ravnar requires the client to supply the id and rejects duplicates with a
 * 409, so a short random suffix keeps two agents with the same name apart.
 * The result satisfies `AGENT_ID_PATTERN` from `@/api`.
 */
export function makeAgentId(name: string): string {
  return `${slugify(name)}-${randomSuffix()}`;
}

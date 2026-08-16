/**
 * Minimal ambient types used by the Sites/Cloudflare build.
 *
 * The production implementations are injected by Cloudflare. Keeping these
 * declarations local also lets the same application pass Next.js type checks
 * when Netlify builds it.
 */
type D1Database = any;

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

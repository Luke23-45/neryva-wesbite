/**
 * Bare HTTP client for the PUBLIC marketing forms only
 * (contact / newsletter / careers / blog).
 *
 * Everything authenticated goes through `engine()` (`@lib/engine/client`)
 * with the OP session. This instance carries NO Bearer token, NO refresh
 * queue, and NO dev block — it is transport for anonymous form posts.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : 'https://neryva-backend.vercel.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
  withCredentials: true,
});

/**
 * Derive a user-facing message from an unknown throw site.
 *
 * The public marketing APIs type their catches as `unknown` (never `any`):
 * axios failures are narrowed with `axios.isAxiosError`, and anything else
 * falls back to the caller-supplied message. `response.data` is untyped by
 * axios, so the extracted `message` is validated as a string before use.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

export default api;

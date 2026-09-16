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

export default api;

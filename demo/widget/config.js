/**
 * config.js — the ONLY file a customer edits.
 *
 * ENGINE_URL  — public origin of the Neryva Engine serving the widget plane,
 *               e.g. "https://engine.example.com". No trailing slash.
 * PUBLIC_KEY  — the website-widget channel's public key (nk_live_...),
 *               copied from the console (Channels → your Website widget).
 *
 * The snippet below injects the stock one-line loader from ENGINE_URL, so
 * this demo exercises the exact production path a customer install uses.
 */
window.NERYVA_DEMO = {
  // Direct-engine tunnel (bypasses the vite dev proxy, which answers CORS
  // preflights itself instead of forwarding them — dev-only artifact;
  // production edges route straight to the engine).
  ENGINE_URL: 'https://2c2fa6697d695ab9-27-34-72-172.serveousercontent.com',
  PUBLIC_KEY: 'nk_live_KX7NG1abxDwmnj1zSIqZNUqV',
};

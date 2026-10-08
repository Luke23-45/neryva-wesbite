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
  ENGINE_URL: 'http://127.0.0.1:3001',
  PUBLIC_KEY: 'nk_live_REPLACE_ME',
};

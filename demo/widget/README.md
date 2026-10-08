# Acme Corp — website-widget demo site

Fictional static company site (plain HTML/CSS/JS, **no build step**) that
exercises the production Neryva website-widget path end to end: the stock
loader (`neryva.js`) renders the chat bubble on every page, mints a visitor
session, and opens the agent in an iframe.

Pages: `index.html` (home) · `pricing.html` (bubble persists across
navigation) · `support.html` (escalation/CSAT story).

## 1. Create the channel account (console, ~1 minute)

1. Open the console → your org → **Channels → New → Website widget**.
2. Bind it to **Loop Test Agent** (`default_assistant_id`).
3. In **Allowed domains**, add the exact origin you will serve this demo
   from, e.g. `http://127.0.0.1:8081` (scheme + host + port, no path).
   The engine enforces an exact match — a wrong entry fails with
   `403 origin is not allowlisted` at session mint.
4. Copy the **public key** (`nk_live_...`) from the account view.

## 2. Point the demo at your engine

Edit `config.js` (the only file with secrets/URLs):

```js
window.NERYVA_DEMO = {
  ENGINE_URL: 'http://127.0.0.1:3001', // public engine origin, no trailing slash
  PUBLIC_KEY: 'nk_live_...',           // from step 1
};
```

## 3. Serve + open

Any static server works (the pages are file-relative except the loader):

```bash
npx serve demo/widget -l 8081
# open http://127.0.0.1:8081
```

Click the 💬 bubble, chat with the agent, navigate to Pricing — the bubble
is on every page. Each page load mints a fresh visitor session (by design:
sessions are per-page-load; reload after ~24h idle).

## Customer CSP (for real installs)

If the customer site sends a `Content-Security-Policy`, allowlist the
engine origin or the panel will be blocked after the loader runs:

```
script-src 'self' https://engine.example.com;
frame-src https://engine.example.com;
connect-src https://engine.example.com;
```

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| No bubble, console warns about `config.js` | `PUBLIC_KEY` still `REPLACE_ME` → step 2 |
| Bubble opens, "widget session 403" | page origin not in **Allowed domains** → step 1.3 (exact match incl. port) |
| Bubble opens, "widget session 404" | wrong key or account deactivated → re-copy `nk_live_...` |
| "widget account has no assistant configured" (409) | channel has no `default_assistant_id` → re-bind Loop Test Agent |
| 429 `session message limit reached` | per-session hourly cap → wait; `retry_after_seconds` says how long |
| Chat works on one page, 403 on another | allowed domains cover origins, not paths — but ports/hosts must match each served origin |

## Layout contract (do not break)

- All key/URL state lives in `config.js`. Pages only inject the **stock**
  loader from `ENGINE_URL` — never a forked copy. If the loader changes
  upstream, this demo picks it up with zero edits.
- `demo/` is intentionally outside `src/` and `public/`: the console build
  never bundles it and no route serves it. It ships in git for reference
  only — serve it with a static server, never deploy it as the console.

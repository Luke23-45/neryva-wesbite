import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Load .env without clobbering variables already set in the real environment.
try {
  const envPath = path.resolve(process.cwd(), '.env');
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

const viteArgs = process.argv.slice(2).filter((a) => a !== '--tunnel');
const tunnel = process.argv.slice(2).includes('--tunnel');
const children = [];

function shutdown(code = 0) {
  for (const c of children) {
    try { c.kill(); } catch {}
  }
  process.exit(code);
}

// ngrok's default Windows installer drops ngrok.exe in
// %LOCALAPPDATA%\ngrok without adding it to PATH, so a bare NGROK_BIN=ngrok
// fails with "'ngrok' is not recognized". Resolve it: full path in .env
// wins, then PATH, then the default install location.
function resolveNgrokBin(configured) {
  const candidates = [configured];
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'ngrok', 'ngrok.exe'));
  }
  for (const c of candidates) {
    if (!c) continue;
    if (path.isAbsolute(c)) {
      if (existsSync(c)) return c;
    } else {
      const probe = spawnSync(c, ['version'], { encoding: 'utf8', shell: false });
      if (!probe.error && probe.status === 0) return c;
    }
  }
  return null;
}

// Which flag this ngrok binary wants for a reserved domain: `--url` on
// newer v3 agents, `--domain` on older ones. Probes `http --help` once.
function pickDomainFlag(bin) {
  try {
    const help = spawnSync(bin, ['http', '--help'], { encoding: 'utf8', shell: false });
    const text = `${help.stdout || ''}\n${help.stderr || ''}`;
    if (/--url[\s=:}]/m.test(text)) return 'url';
    if (/--domain[\s=:}]/m.test(text)) return 'domain';
  } catch {}
  return 'url';
}

// Port vite actually listens on (default matches vite.config.ts), so ngrok
// forwards to the right place when --port is overridden.
let port = '3000';
const portIdx = viteArgs.findIndex((a) => a === '--port');
if (portIdx !== -1 && viteArgs[portIdx + 1]) port = viteArgs[portIdx + 1];
const portEq = viteArgs.find((a) => a.startsWith('--port='));
if (portEq) port = portEq.split('=')[1];

// In tunnel mode the ngrok target must equal the port vite actually binds,
// so forbid vite's silent port-shifting: if :port is busy, fail loudly
// instead of serving :3001 while ngrok forwards to an unrelated :3000.
const viteSpawnArgs = [...viteArgs];
if (tunnel && !viteSpawnArgs.some((a) => a === '--strictPort' || a.startsWith('--strictPort='))) {
  viteSpawnArgs.push('--strictPort');
}
const viteBin = path.resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
const vite = spawn(process.execPath, [viteBin, ...viteSpawnArgs], { stdio: 'inherit' });
children.push(vite);
vite.on('error', (err) => console.error('[dev] failed to start vite:', err.message));
vite.on('exit', (code) => shutdown(code ?? 0));

// Wait until vite actually accepts connections before exposing it. ngrok
// returns its 503 error page for any request that arrives while the
// upstream is still booting, and a Vite page load fires dozens of asset
// requests at once — so opening the tunnel early guarantees a burst of 503s.
async function waitForVite(port) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (vite.exitCode !== null && vite.exitCode !== undefined) return false;
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return vite.exitCode === null || vite.exitCode === undefined;
}

if (tunnel) {
  const bin = resolveNgrokBin(process.env.NGROK_BIN || 'ngrok');
  if (!bin) {
    console.error('[dev] ngrok binary not found: set NGROK_BIN in .env to the full');
    console.error('[dev] path of ngrok.exe, or install it (winget install ngrok.ngrok).');
    console.error('[dev] Continuing with local vite only.');
  } else {
    console.log(`[dev] waiting for vite on :${port}…`);
    if (!(await waitForVite(port)) || vite.exitCode !== null) {
      console.error(`[dev] vite on :${port} never became ready (port busy? another instance running?) — not starting ngrok.`);
      shutdown(1);
    }
    console.log('[dev] vite is up — starting tunnel…');
    // Standard auth per ngrok docs: save the token into the agent config
    // once (`config add-authtoken`) instead of passing `--authtoken` on
    // every run — the flag leaks the secret into the process list where any
    // local user can read it, and the config file is the documented home
    // for it. Idempotent; re-saving the same token is a no-op.
    if (process.env.NGROK_AUTHTOKEN) {
      const saved = spawnSync(bin, ['config', 'add-authtoken', process.env.NGROK_AUTHTOKEN], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
      if (saved.status !== 0) {
        console.error('[dev] ngrok refused the authtoken:');
        console.error((saved.stderr || saved.stdout || '').trim());
        shutdown(1);
      }
      // The agent is strict about its config schema (a stray legacy key fails
      // every ngrok invocation with a YAML error). Validate before starting
      // anything so a broken ngrok.yml surfaces here, not as a dead tunnel.
      const checked = spawnSync(bin, ['config', 'check'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
      if (checked.status !== 0) {
        console.error('[dev] ngrok config invalid — fix or delete %LOCALAPPDATA%\\ngrok\\ngrok.yml,');
        console.error('[dev] then re-run (the authtoken in .env will be re-saved):');
        console.error((checked.stderr || checked.stdout || '').trim());
        shutdown(1);
      }
    }
    const ngrokArgs = ['http', port];
    if (process.env.NGROK_URL) {
      // Reserved static domain (host only, no scheme). The flag name depends
      // on the agent version: newer v3 uses `--url`, older v3 uses `--domain`
      // (this machine has both). Ask the binary instead of guessing.
      const host = process.env.NGROK_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      ngrokArgs.push(`--${pickDomainFlag(bin)}=${host}`);
    }
    // Logging: the agent's default is `log: false` with a TUI dashboard, and
    // the TUI can't render under `npm run` (not a TTY) — so it looks dead.
    // The opposite extreme (`--log-level=info`) floods the terminal with a
    // "join connections" line per socket, which buries vite's own output.
    // `warn` is the useful middle: silent on normal traffic, but auth
    // failures, domain/plan errors, bind failures and dropped sessions still
    // surface. Override with NGROK_LOG_LEVEL=debug when debugging.
    const logLevel = process.env.NGROK_LOG_LEVEL || 'warn';
    ngrokArgs.push('--log=stdout', '--log-format=logfmt', `--log-level=${logLevel}`);
    // shell:false + absolute path: no DEP0190 warning, no PATH dependency,
    // and the token can't be mangled by cmd.exe quoting.
    console.log(`[dev] tunnel: ${process.env.NGROK_URL || '(random ngrok URL)'} -> http://localhost:${port}`);
    const ngrokStart = Date.now();
    const ngrok = spawn(bin, ngrokArgs, { stdio: 'inherit', shell: false });
    children.push(ngrok);
    ngrok.on('error', (err) => console.error(`[dev] failed to start ${bin}:`, err.message));
    // Tunnel failure shouldn't kill local dev — just report it. An exit
    // within seconds usually means either the reserved domain is already
    // bound by another agent (ERR_NGROK_334 — stop the other instance) or
    // ngrok rejected its flags; the ERROR line it printed above says which.
    ngrok.on('exit', (code) => {
      if (code === 0) return;
      console.error(`[dev] ngrok exited (code ${code}). Local vite keeps running — Ctrl+C to stop.`);
      if (Date.now() - ngrokStart < 15000) {
        console.error('[dev] It died right away — check the ngrok ERROR line above: either another');
        console.error('[dev] `npm run dev -- --tunnel` already holds this domain, or a flag was rejected.');
      }
    });
    // Confirm the tunnel is actually online via the local agent API
    // (ngrok picks 4040, or the next free port if e.g. Expo holds 4040).
    confirmTunnelOnline(process.env.NGROK_URL, ngrok);
  }
}

// Poll the ngrok agent API until our public URL shows up (or give up quietly
// after ~20s — the agent's own logs remain the source of truth for errors).
// Bails out early if OUR agent died: otherwise a tunnel with the same URL
// bound by some other agent would produce a false "online" confirmation.
async function confirmTunnelOnline(expectedUrl, agent) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (agent.exitCode !== null && agent.exitCode !== undefined) {
      console.error('[dev] ngrok exited before the tunnel came up — see the ngrok output above.');
      return;
    }
    for (let apiPort = 4040; apiPort <= 4045; apiPort++) {
      try {
        const res = await fetch(`http://127.0.0.1:${apiPort}/api/tunnels`);
        if (!res.ok) continue;
        const data = await res.json();
        const hit = (data.tunnels || []).find(
          (t) => !expectedUrl || t.public_url === expectedUrl || t.public_url === expectedUrl.replace(/^http:/, 'https:'),
        );
        if (hit || (!expectedUrl && (data.tunnels || []).length)) {
          const shown = hit ? hit.public_url : data.tunnels[0].public_url;
          console.log(`[dev] tunnel online: ${shown}`);
          // The agent's local inspector is where request/response detail lives
          // now that per-request logs are off.
          console.log(`[dev] inspector:   http://127.0.0.1:${apiPort}`);
          return;
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('[dev] tunnel not confirmed within 20s — see the ngrok output above.');
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// render-card.mjs — regenerates card.svg for the aniketmallick profile README.
//
// The card is a terminal-style status readout in the buildsbyaniket skin. Two
// lines are DYNAMIC and re-verified on every run (daily via GitHub Actions):
//   ledger  → fetches buildsbyaniket.com/history.jsonl and RECOMPUTES the full
//             SHA-256 hash chain (same recipe as the site's /verify page);
//             prints entries · head, or an honest ✗ broken if it ever fails
//   updated → run date
//
// No dependencies — Node 20+, WebCrypto. Usage:
//   node scripts/render-card.mjs                    # live fetch (CI)
//   node scripts/render-card.mjs --history file.jsonl  # offline fixture (tests)

import { readFileSync, writeFileSync } from "node:fs";

const LEDGER_URL = "https://buildsbyaniket.com/history.jsonl";
const OUT = new URL("../card.svg", import.meta.url);

// ── chain recipe (byte-for-byte the site's src/lib/chain.mjs) ────────────────
const GENESIS = "sha256:GENESIS";
const canonicalDay = (d) =>
  JSON.stringify({ type: "day", date: d.date, planned: d.planned, done: d.done, missed_major: d.missed_major });
async function sha256Hex(s) {
  const b = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
async function verifyChain(entries) {
  const sorted = [...entries].sort((a, b) => a.seq - b.seq);
  let prev = GENESIS;
  for (const e of sorted) {
    const expected = "sha256:" + (await sha256Hex(prev + canonicalDay(e)));
    if (e.prev_hash !== prev || e.hash !== expected) return { ok: false, count: sorted.length, head: prev };
    prev = e.hash;
  }
  return { ok: true, count: sorted.length, head: prev };
}

// ── data ─────────────────────────────────────────────────────────────────────
const fixture = process.argv.indexOf("--history");
let text;
if (fixture !== -1) {
  text = readFileSync(process.argv[fixture + 1], "utf8");
} else {
  const res = await fetch(LEDGER_URL, { headers: { "user-agent": "profile-card-verifier" } });
  if (!res.ok) throw new Error(`ledger fetch failed: HTTP ${res.status}`);
  text = await res.text();
}
const entries = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
const chain = await verifyChain(entries);
const head7 = chain.head.replace(/^sha256:/, "").slice(0, 7);
const today = new Date().toISOString().slice(0, 10);

// ── card ─────────────────────────────────────────────────────────────────────
const C = { bg: "#0A0B0D", panel: "#111318", line: "#1E2329", ink: "#E8EAED", muted: "#7A828E", dim: "#4B515B", accent: "#2DD4BF", danger: "#FF5A5A", warn: "#FFB23E" };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ledgerLine = chain.ok
  ? [ ["✓ verified", C.accent], [` · ${chain.count} entries · head sha256:${head7}…`, C.ink] ]
  : [ ["✗ broken", C.danger], [` · ${chain.count} entries — recomputation failed`, C.ink] ];

const ROWS = [
  { label: "identity", parts: [["Aniket Mallick — Bengaluru, India", C.ink]] },
  { label: "mission",  parts: [["AI you can ", C.ink], ["refuse", C.accent], [" — trust gates in control code, not prompts", C.ink]] },
  { label: "now",      parts: [["VLA vs zero-shot on a $200 arm: ", C.ink], ["28% completion · 44% grasp · 78% contact", C.accent], [" · baseline 0", C.ink]] },
  { label: "arm",      parts: [["SO-101 · 50 self-recorded demos · eval rows carry model ref + revision", C.ink]] },
  { label: "shipped",  parts: [["2 acquired · 1 open source · 1 live", C.ink]] },
  { label: "ledger",   parts: ledgerLine },
  { label: "updated",  parts: [[`${today} · re-verified daily by CI`, C.ink]] },
];

const W = 880, PAD = 34, TOP = 92, LH = 34;
const H = TOP + ROWS.length * LH + 78;
const mono = `font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="15"`;

let rows = "";
ROWS.forEach((r, i) => {
  const y = TOP + i * LH;
  const spans = r.parts.map(([t, col]) => `<tspan fill="${col}">${esc(t)}</tspan>`).join("");
  rows += `<text x="${PAD}" y="${y}" ${mono} fill="${C.muted}">${esc(r.label.padEnd(10, " "))}</text>`;
  rows += `<text x="${PAD + 122}" y="${y}" ${mono}>${spans}</text>`;
});

const promptY = TOP + ROWS.length * LH + 14;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aniket Mallick — live status card; ledger re-verified daily">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${C.bg}" stroke="${C.line}" stroke-width="2"/>
  <circle cx="30" cy="30" r="6" fill="${C.danger}" opacity="0.85"/>
  <circle cx="52" cy="30" r="6" fill="${C.warn}" opacity="0.85"/>
  <circle cx="74" cy="30" r="6" fill="${C.accent}" opacity="0.85"/>
  <text x="${W / 2}" y="35" ${mono} fill="${C.dim}" text-anchor="middle">aniket@buildsbyaniket: ~/status</text>
  <line x1="1" y1="52" x2="${W - 1}" y2="52" stroke="${C.line}" stroke-width="1.5"/>
  <text x="${PAD}" y="${TOP - 28}" ${mono}><tspan fill="${C.dim}">aniket@buildsbyaniket</tspan><tspan fill="${C.muted}">:</tspan><tspan fill="${C.accent}">~</tspan><tspan fill="${C.muted}">$</tspan><tspan fill="${C.ink}"> ./status --verify</tspan></text>
  ${rows}
  <text x="${PAD}" y="${promptY}" ${mono}><tspan fill="${C.dim}">aniket@buildsbyaniket</tspan><tspan fill="${C.muted}">:</tspan><tspan fill="${C.accent}">~</tspan><tspan fill="${C.muted}">$</tspan><tspan fill="${C.accent}"> ▮<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/></tspan></text>
</svg>
`;

writeFileSync(OUT, svg);
console.log(`card.svg written — ledger ${chain.ok ? "verified" : "BROKEN"} · ${chain.count} entries · head ${head7}…`);

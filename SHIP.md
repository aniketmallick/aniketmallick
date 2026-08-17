# Ship the live profile (10 minutes)

The kit: `README.md` · `card.svg` · `scripts/render-card.mjs` · `.github/workflows/update-card.yml`

## If the `aniketmallick/aniketmallick` repo exists (you said you created it)
```bash
git clone https://github.com/aniketmallick/aniketmallick.git
cd aniketmallick
# copy the four files in, preserving paths:
#   README.md  card.svg  scripts/render-card.mjs  .github/workflows/update-card.yml
git add -A && git commit -m "feat: live terminal status card — ledger re-verified daily by CI"
git push
```
(Or upload via github.com → the repo → "Add file → Upload files" — drag the whole folder structure.)

## If it doesn't exist yet
github.com/new → name it EXACTLY `aniketmallick` → Public → create, then do the above.
The repo name must equal your username or GitHub won't render it on your profile.

## After pushing
1. Open github.com/aniketmallick — the card + README render at the top.
2. Actions tab → `update-card` → "Run workflow" once, manually. Green run = the daily
   self-verification loop is live (05:45 UTC each day; commits only when the card changes).
3. Still pending from the last checklist: location SF → Bengaluru, website field →
   buildsbyaniket.com, bio line, pins. The card says Bengaluru — settings must agree.

## How the "live" part works (what to tell people)
Every morning CI fetches buildsbyaniket.com/history.jsonl, recomputes the entire
SHA-256 hash chain — same recipe as the site's /verify page — and repaints the card.
If anyone ever tampers with the ledger, your own GitHub profile calls it out with a
red ✗ the next morning. The profile doesn't just look alive; it audits you.

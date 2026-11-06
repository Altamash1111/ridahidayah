# Rida Hidayah (رِضَا هِدَايَة)
*Find peace. Seek guidance. Remember Allah.*

Plain HTML + CSS + JavaScript ES modules. No build step for the site itself.

## Run
```bash
cd rida-hidayah
python3 -m http.server 8000      # any static server works; file:// will not (JSON is fetched)
# open http://localhost:8000
```
Fonts (Amiri, Cormorant Garamond, DM Sans) load from Google Fonts; offline it falls back to system fonts.
Quran recitation streams from cdn.islamic.network and needs a connection.

## Layout
- `index.html`, `css/` (tokens → base → layout → components → pages)
- `js/core/` data, router (hash), store (localStorage, guarded), search, audio, dom
- `js/components/` duaCard, tiles, navbar, footer, settingsPanel
- `js/pages/` one module per route; each returns `{ title, html, mount? }` so it ports cleanly to React components
- `data/` generated JSON (entries, taxonomy, emotions, adhkar, names, review queue)
- `content/` authoring sources; `tools/build-data.mjs` verifies and builds `data/`

## Content pipeline
`content/*.json` → `node tools/build-data.mjs` (needs the Quran and Hadith datasets via `QURAN_JSON` / `HADITH_JSON`) → `data/entries.json`.
Only entries with `verification_status: VERIFIED` are shown. See `CONTENT-REVIEW.md`.

## Tests
```bash
python3 -m http.server 8123 &  node tools/smoke-test.cjs
```
Covers all routes, every category/feeling/dua page, search queries, favourites, adhkar, settings, random dua, names and mobile overflow.

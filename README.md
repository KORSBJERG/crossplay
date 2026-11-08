# Next Move — Crossplay companion

A mobile-friendly web app for Peter: import an NYT Crossplay screenshot, check the recognized board and rack, and explore scored moves with placement previews.

## Publish on Cloudflare

### Option A — Cloudflare Workers (recommended)

1. In Cloudflare, open **Workers & Pages → Create application → Import a repository** (or **Connect to Git**).
2. Select **KORSBJERG/crossplay**, branch **main**.
3. Use these settings:

| Setting | Value |
| --- | --- |
| Root directory | Repository root (leave blank) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Environment variables / secrets | None |
| Node.js | 22 or newer |

The checked-in `wrangler.jsonc` serves the generated `dist` directory as Worker static assets. No Worker backend, database, paid AI service, or NYT sign-in is required. If Cloudflare asks for a preview deploy command, use `npx wrangler versions upload`.

### Option B — Cloudflare Pages

Create a **Pages** project connected to this repository, select **None** as the framework preset, and set:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank
- Production branch: `main`
- Node.js: 22 or newer (the repository includes `.node-version`)

Do not configure a deploy command in Pages. Cloudflare handles publication after the build.

## Use on your iPhone

1. Take a screenshot with the whole Crossplay board and your rack visible. Zoom the board fully out. Light mode with blue tiles is supported.
2. Open this app in Safari and tap **Import a screenshot**.
3. Check the green crop square, adjust it if needed, and tap **Read screenshot**.
4. Check every recognized letter. Tap a square to correct it, erase it, change its premium, or mark an existing blank tile. Orange outlines indicate low-confidence recognition. `?` on the board must be corrected before solving.
5. Check the seven rack letters. Use `?` only for an actual blank tile in your rack.
6. Tap **Find my moves** and select a result. Green tiles show where to play. Italic letters indicate blank substitutions.
7. In Safari, use **Share → Add to Home Screen** for quick access.

The example board is under **More tools & settings**.

## What works

- Screenshot import, automatic board location, and adjustable square crop.
- On-device OCR using locally hosted Tesseract.js, its WASM engine, and English recognition data.
- Recognition of the 15×15 board and the seven-tile rack below it.
- Editable board, rack, bonus squares, blank tiles, and point values.
- Trie-based move search in a Web Worker, with perpendicular dictionary checks, board attachment, opening-center requirement, rack multiplicity, and edge handling.
- Scores include new letter/word bonuses, all crossing words, zero-point blanks, and Crossplay's 40-point bonus for using seven tiles.
- Up to 100 highest-scoring placements with visual previews.
- Board/rack autosave in this browser, and custom plain-text dictionary import for the current session.
- Responsive layout, accessible labeled controls, paste-image support on compatible browsers, and a home-screen manifest.

## Accuracy and limits

**Dictionary:** Crossplay uses NWL2023, according to the [NYT help page](https://thenewyorktimeshelpcenter.helpjuice.com/crossplay-app). This app ships the public-domain ENABLE list instead. It is not an exact Crossplay dictionary: some suggestions may be rejected and some valid moves may be missing. Import a word list you are entitled to use for closer coverage. The app never claims that ENABLE suggestions are guaranteed to be accepted.

**OCR:** Optimized for full-size, light-mode iPhone screenshots with blue tiles. Dark mode, zoomed boards, changed app fonts/layouts, compression, and screenshots with overlays may need corrections. Existing blank tile assignments must be marked manually, because letter recognition alone does not distinguish their zero-point value. Check all tiles before using scores. Rack blanks or unreadable rack letters can appear as `?`; verify that they are real blanks before solving.

**Scoring:** The premium layout was reconstructed from the supplied screenshot using its rotational symmetry. The default tile values are editable, including J and X, which were absent from that screenshot. Verify those values against your game. This app ranks immediate scores; it does not predict opponents or evaluate multi-turn strategy.

**Privacy:** Screenshot pixels and recognized game state are processed in the browser. There are no screenshot uploads to a backend, analytics, trackers, API keys, or NYT credentials. Board/rack state is stored in localStorage on this browser. The original image stays in memory only. Hosting servers still receive normal static asset requests. A first load downloads OCR assets from your own deployment. This app needs an internet connection to load its assets; it is not an offline PWA.

## Local development

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Build preparation copies OCR runtime files from pinned npm dependencies and downloads the ENABLE word list from a fixed GitHub commit, verifying its SHA-256 checksum. All assets are then included in `dist`; visitors do not load OCR files from a third-party CDN.

## Verification

Nine automated scoring/move-legality tests cover opening placement, used premiums, crossing words, invalid perpendicular words, rack blanks, existing blanks, sweep bonuses, adjacent prefixes/suffixes, bounds, and rack multiplicity. Screenshot import and result selection were also checked in a real browser with the supplied iPhone screenshot. A physical iPhone/Safari device has not been tested.

## Credits

- [Tesseract.js](https://github.com/naptha/tesseract.js), Apache-2.0.
- [Tesseract.js core](https://github.com/naptha/tesseract.js-core), Apache-2.0.
- [Tesseract English language data](https://github.com/naptha/tessdata), Apache-2.0.
- [ENABLE word list](https://github.com/dolph/dictionary/blob/master/enable1.txt), public domain; compiled by M. Cooper and A. Beale. Word-list snapshot is integrity-pinned in `scripts/prepare-ocr.mjs`.

Independent personal helper, not affiliated with or endorsed by The New York Times. Crossplay is a game by The New York Times.

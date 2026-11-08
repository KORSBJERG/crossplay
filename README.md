# Next Move — word game companion

A mobile-friendly personal helper for NYT Crossplay and Wordfeud: import a screenshot, check the board and rack, and explore scored moves. Tap the small book icon for English word meanings.

## Games and languages

| Game | Word-list languages |
| --- | --- |
| NYT Crossplay | English |
| Wordfeud | English, Danish, Swedish, Norwegian Bokmål, Dutch, German |

Select the game and word language above the board. Each game/language keeps a separate saved board, rack, tile values, and bonus layout. The interface remains English; the selector changes the word list, tile alphabet, scores, and OCR model.

Wordfeud uses its own standard board layout and official language-specific tile scores, including Æ/Ø/Å, Ä/Ö, and Ä/Ö/Ü. Both games award 40 extra points for a seven-tile sweep. Crossplay's original configuration is retained.

**Open lists are not official game dictionaries.** Suggestions can be rejected and accepted words may be missing. You can import a word list you are entitled to use for the selected alphabet. English meanings are deliberately disabled for non-English games, to avoid showing an unrelated English definition for a matching spelling.

## Publish on Cloudflare

### Cloudflare Workers

Connect **KORSBJERG/crossplay**, branch **main**, and use:

| Setting | Value |
| --- | --- |
| Root directory | Repository root; leave blank |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Environment variables / secrets | None |
| Node.js | 22 or newer |

The checked-in `wrangler.jsonc` serves `dist` as static assets. No backend, database, paid AI service, or game account is required. For a preview deploy command, use `npx wrangler versions upload` if requested by Cloudflare.

### Cloudflare Pages

Create a Pages project connected to the repository. Framework preset **None**, build command **`npm run build`**, output **`dist`**, production branch **`main`**, root left blank. Pages does not need a deploy command. The repository includes `.node-version`.

The build downloads integrity-pinned open word lists and copies OCR models from npm dependencies. It includes all six languages in the deployment, but browsers only load the selected dictionary and recognition model.

## Use on your iPhone

1. Select the game and word language.
2. Take a full-board screenshot with the rack visible. Crossplay's blue-tile theme and Wordfeud's classic light tiles with dark lettering are supported.
3. Import it, check the green crop rectangle, adjust if needed, and tap **Read screenshot**.
4. Check every letter. Tap a square to correct it, erase it, change its bonus, or mark an existing zero-point blank. Orange outlines mark uncertain recognition. Board `?` marks must be corrected before solving.
5. Check the rack. Use `?` only for a genuine rack blank, not an unreadable letter.
6. Tap **Find my moves**. Green squares show the new tiles for the selected move. Italic letters use a blank.
7. In English games, tap the small book icon beside a word for its meaning. Closing the popup leaves the selected move unchanged.

Use Safari's **Share → Add to Home Screen** for quick access. The example Crossplay board is under **More tools & settings**.

### Random Wordfeud boards

Choose **Random / custom**. Bonus squares begin empty: tap squares to enter the bonuses from your game, then tick the confirmation before solving. Random bonus placement is not inferred from screenshots. Covered bonuses no longer affect existing tiles, so only bonuses on empty squares matter for the next move.

## Open language packs and licences

| Language | Included alternative | Selected licence |
| --- | --- | --- |
| English | ENABLE | Public domain |
| Danish | Stavekontrolden/Hunspell, direct entries and one-step affix expansion | MPL 1.1 from its tri-licence |
| Swedish | OpenSLR SLR29 pronunciation lexicon, pronunciations removed | CC0 |
| Norwegian Bokmål | Norsk Ordbank, 2022 extraction by Ondkloss | CC BY 4.0 |
| Dutch | OpenTaal approved base-word list | Revised BSD |
| German | Enz German word-game list | CC0 |

The generated `/wordlists/manifest.json` records counts, sources, and licences. `/credits.html` provides attribution; `/licences/` includes notices, the full Dutch notice, and original Danish `.dic`/`.aff` source files. Transformations are in `scripts/prepare-languages.mjs`. Preserve these when redistributing.

These lists differ materially from Wordfeud's official lists: Danish is not Retskrivningsordbogen, Swedish is not SAOL, Norwegian is not NSF-ordlisten, Dutch is not TaalTik, and English is not TWL/SOWPODS. Some packs contain corpus-specific words or names; others omit inflections. Do not market them as exact matches. German ß is expanded to SS. Entries outside a game's physical tile alphabet or longer than 15 tiles are excluded.

## Word meanings

The small book icon opens a compact popup. English definitions are bundled from WordNet 3.1 with up to four senses and examples. Lookups load only an alphabetic chunk from this app, cached for the session; no selected word is sent to an external service. Simple English inflections may show a labelled base form. Rare words can lack definitions.

Definitions in other languages are not bundled; the popup says so explicitly. It never shows an English meaning for Danish `gift`, for example.

## iOS / App Store preparation

A Capacitor configuration and build commands are included. See **[docs/IOS_RELEASE.md](docs/IOS_RELEASE.md)** for setup, signing, device tests, privacy declarations, dictionary terms and App Store requirements.

```sh
npm ci
npm run ios:setup   # once, on a Mac; creates the iOS project
npm run ios:open
```

For subsequent updates:

```sh
npm run ios:sync
npm run ios:open
```

This is preparation for a future native build, not a signed or submitted App Store app. Native WKWebView OCR and memory use require real-device testing. Apple approval is not guaranteed. The generic app name is **Next Move**, application ID `dk.peaknet.nextmove` (confirm availability before release), with no remote server URL.

## Privacy

Screenshots, game state, solver searches, and meanings are processed on-device. Boards/racks/settings are saved in localStorage, with one session per game/language. The original image remains in memory only. Custom word lists are used for the session. There are no accounts, analytics, advertising, API keys, or game credentials.

The web host receives ordinary asset requests; the privacy notice explains normal hosting logs. Native configuration bundles assets locally. Read `/privacy.html` and verify the final publisher/contact details before public release.

## Local development and verification

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Automated tests cover game-specific values, Unicode alphabets, blank scoring, seven-tile sweeps, crossing words, board edges, rack multiplicity, glyph extraction, accent preservation, dark ink, private definition loading, caching, missing words and non-English definition isolation.

Browser QA covers game/language switching, saved sessions, random-board scoring protection, and Danish move generation. The supplied real Crossplay screenshot and an internal synthetic Danish Wordfeud fixture were available. Real Wordfeud screenshots in every language, alternate themes and a physical iPhone/native build have not yet been tested.

### Primary references

- [Wordfeud rules and tile values](https://wordfeud.com/wfweb/help/)
- [Wordfeud official dictionaries](https://wordfeud.com/dictionaries/)
- [Standard board reference](https://github.com/Thomilist/wordfeud/blob/master/resources/boards/Wordfeud.json) — only factual premium positions are used, not its code/assets.
- [Tesseract.js](https://github.com/naptha/tesseract.js) / Tesseract.js-core / OCR models: Apache 2.0.
- [WordNet](https://wordnet.princeton.edu/): Princeton University licence bundled at `/dictionary/LICENSE.txt`.
- [Capacitor](https://capacitorjs.com/): MIT.

Independent helper. Wordfeud is a trademark of Bertheussen IT; Crossplay is a game by The New York Times. No affiliation or endorsement is implied.

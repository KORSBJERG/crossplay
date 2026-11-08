# Next Move: iOS release preparation

This repository is still a web app with a Capacitor iOS build configuration. It is not a signed App Store application, and no App Store submission has been made.

## Create the native project on a Mac

Requirements: a supported macOS/Xcode installation, an Apple Developer account, and an iPhone for device testing. Use the Xcode version required by the installed Capacitor major version.

```sh
npm ci
npm run ios:setup
npm run ios:open
```

After changes:

```sh
npm run ios:sync
npm run ios:open
```

`ios:setup` builds all local assets and adds the iOS platform once. `ios:sync` builds and copies future changes into an existing native project. Use `ios:setup` only before an `ios/` directory exists. Capacitor may need to download the native platform's standard dependencies. Commit the generated native project after reviewing it.

The default application ID is `dk.peaknet.nextmove`; confirm that it is available in your Apple Developer account. The display name is **Next Move**. Configure your signing team, version/build numbers, app icons, launch screen, supported device families and orientations in Xcode. No remote `server.url` is configured: the release uses bundled local assets, dictionaries, language licences, and OCR models.

## Feature scope

- NYT Crossplay in English.
- Wordfeud in English, Danish, Swedish, Norwegian Bokmål, Dutch, and German.
- Separate board/rack sessions per game/language.
- Correct language-specific tile scores, Unicode letters, standard Wordfeud board, 40-point sweep bonus.
- Custom/random Wordfeud boards can be entered manually; the user must confirm bonus squares before scoring. Screenshot recognition does not reconstruct random bonuses automatically.
- English WordNet definitions. Other language definitions are explicitly unavailable; English meanings are never shown for non-English words.
- UI language is English; word-list language selection is not a full UI translation.
- OCR is optimized for Crossplay's blue tiles and Wordfeud's classic light tiles with dark lettering. Other themes/layouts may require manual entry or corrections.

## Test before submission

Test on actual iPhones and iPads, particularly Safari/WKWebView Web Workers, WASM, the native screenshot picker, local `capacitor://` asset loading, dark/light appearance, VoiceOver, larger text and memory pressure. Danish, Swedish, and German dictionaries are large; verify language switching and on-device recognition on the oldest supported devices. Web/browser QA does not establish that native WKWebView OCR works.

Test real Wordfeud screenshots in all advertised languages; only synthetic Wordfeud fixtures and the supplied real Crossplay screenshot were available during development. Do not claim verified recognition for every game theme or device.

If the native worker cannot load OCR assets, resolve it in the native build before release; do not replace local processing with an undisclosed server upload.

## Data and licensing

The app includes open alternatives, not Wordfeud's proprietary official dictionaries. Accepted words can differ. The Swedish corpus is not SAOL, Danish uses Stavekontrolden/Hunspell rather than Retskrivningsordbogen, Norwegian uses Norsk Ordbank rather than NSF-ordlisten, Dutch uses OpenTaal base words rather than TaalTik, and English ENABLE is not TWL/SOWPODS. These limitations must remain visible.

Retain the bundled licence notices, Danish source `.dic`/`.aff` files, and transformation source. Sources and selected licences are recorded at `/credits.html`, `/licences/`, `scripts/prepare-languages.mjs`, and the lockfile. Review these exact data-distribution terms for the final commercial package. Replacing a list with an official game dictionary requires redistribution permission; finding it online is not permission.

The bundled privacy notice is `/privacy.html`. Publish it at a stable URL for App Store Connect, verify the contact and publisher identity, and keep it accurate. Complete App Privacy answers for the final native binary and any SDKs actually included. Add and validate a `PrivacyInfo.xcprivacy` manifest with Apple's required-reason API declarations for that binary. Do not copy guessed declarations from an unrelated app.

## Store presentation

Use the independent **Next Move** identity, with original icons and screenshots. Do not put another developer's logo or product name into the app's name/icon or imply endorsement. Mention supported games accurately in the description. The generic existing SVG icon is a web icon, not a complete iOS AppIcon asset set.

Apple guideline 4.2 requires utility beyond a repackaged website. Local screenshot recognition, on-device solver, bundled dictionaries and saved game sessions provide useful functionality, but approval is Apple's decision. A native screenshot/share-extension workflow would be a useful later improvement; it is not implemented here.

Once tested and signed: archive in Xcode, validate, upload to App Store Connect, distribute through TestFlight, then submit for review.

## Primary references

- https://developer.apple.com/app-store/review/guidelines/ (4.2, 4.1, 5.1)
- https://capacitorjs.com/docs/ios
- https://capacitorjs.com/docs/ios/privacy-manifest
- https://wordfeud.com/wfweb/help/
- https://wordfeud.com/dictionaries/

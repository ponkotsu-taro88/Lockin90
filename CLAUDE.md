# Lock-in 90 — repo rules for Claude Code

This repo hosts a single-file PWA on GitHub Pages: https://ponkotsu-taro88.github.io/Lockin90/

The URL is case-sensitive — the lowercase `/lockin90/` form 404s.

## Layout (repo root = site)
- `index.html` — the built app. A self-unpacking bundle: outer shell, a manifest of
  base64 assets (React, support.js, fonts, icon), and a `__bundler/template` holding
  the document. **Do not hand-edit the bundle body — regenerate it (below).**
- `apple-touch-icon.png` (180×180), `icon-512.png`, `manifest.webmanifest`, `.nojekyll`
- `source/Lock-in App.dc.html` — **the app source. Edit this.** Readable markup plus a
  `<script type="text/x-dc">` holding the whole `Component` class.
- `source/support.js` — the dc-runtime, already built. Do not edit.
- `scripts/build.mjs` — rebuilds `index.html` from `source/`
- `scripts/inject-head.mjs` — injects iOS/PWA tags into the OUTER `<head>` of `index.html`
- `docs/` — change specs

## Making a change

```
edit source/Lock-in App.dc.html
node scripts/build.mjs          # regenerates index.html
node scripts/inject-head.mjs index.html
git add -A && git commit -m "<short message>" && git push origin main
```

Then tell the user: wait ~10 min (Pages cache), then open the app.

`node scripts/build.mjs --check` rebuilds without writing and reports whether the
result matches the current `index.html` byte for byte. Run it after touching
`build.mjs` itself, with `source/` unmodified, to prove the pipeline still round-trips.

The build replaces everything between `</helmet>` and the last `</script>`, applying the
two rewrites the original bundler applies: camelCase event attributes become
`sc-camel-*` (`onClick` → `sc-camel-on-click`), and valueless attributes get `=""`.
Assets and the `<helmet>` are carried over from the existing bundle untouched.

### Verifying before you push

```
node --check <extracted dc-script>     # syntax
python3 -m http.server 8787            # then headless Chrome --dump-dom
```

Render it and confirm the DOM contains `STREAK` / `START WORKOUT` and that
`__bundler_thumbnail` is gone — that proves the bundle unpacked and the app mounted.

## Two hazards in this codebase

1. **Never bump `v`.** `Component.load()` keeps the stored db only when `d.v === 1`
   and silently falls back to `freshDb()` otherwise — bumping it erases every record
   on the user's phone. Add new fields as optional, defaulted on read, and leave `v: 1`.
2. **Set edits replace the object.** `eSave` assigns `{ w, r }` over the whole set, so
   any new per-set field is dropped the moment the user taps EDIT. Spread the existing
   set: `{ ...s0, w, r }`.

## Limits of the build

Changes to the `<helmet>` block in `source/` do **not** reach `index.html` — the build
carries over the bundle's own helmet, whose font CSS is inlined and whose asset refs are
rewritten to manifest uuids. `build.mjs` warns when the source helmet changes. Head tags,
title and icons are handled by `scripts/inject-head.mjs` on the outer `<head>` instead.

## Never
- Never change the localStorage key `lockin90.v1` — all workout history lives there on
  the phone, and there is no server copy.
- Never rename `index.html` or move it out of the root.

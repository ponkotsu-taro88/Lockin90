# Lock-in 90 — repo rules for Claude Code

This repo hosts a single-file PWA on GitHub Pages: https://<user>.github.io/lockin90/

## Layout (repo root = site)
- index.html — the whole app (self-unpacking bundle exported from the design tool). Do not hand-edit the bundle body.
- apple-touch-icon.png (180×180), icon-512.png, manifest.webmanifest, .nojekyll
- scripts/inject-head.mjs — injects iOS/PWA head tags into the OUTER <head> of index.html
- source/ — editable design source (reference only, not served)

## "Deploy" / "update" means
1. If the user provides a new index.html, replace ./index.html with it.
2. Run: node scripts/inject-head.mjs index.html
3. Bump the ?v=N on the apple-touch-icon link inside scripts/inject-head.mjs ONLY when the icon PNG changed, then re-run step 2.
4. git add -A && git commit -m "<short message>" && git push origin main
5. Tell the user: wait ~10 min (Pages cache), then open the app.

## Never
- Never change the localStorage key `lockin90.v1` or the data shape — all workout history lives there on the phone.
- Never rename index.html or move it out of the root.

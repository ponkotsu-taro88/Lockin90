// Usage: node scripts/build.mjs [--check]
//
// Rebuilds index.html from source/Lock-in App.dc.html.
//
// index.html is a self-unpacking bundle: an outer shell, a manifest of assets
// (React, support.js, fonts, icon) as base64, and a __bundler/template holding
// the .dc.html document as a JSON string. Only the template's body changes when
// the app changes, so this script swaps that body and leaves the assets alone.
//
// The body differs from source/ by one mechanical rule: camelCase event
// attributes are encoded as sc-camel-* (onClick -> sc-camel-on-click), because
// HTML attribute names are case-insensitive.
//
// --check builds without writing and reports whether the result matches the
// current index.html byte for byte.
import fs from 'node:fs';
import crypto from 'node:crypto';

const SRC = 'source/Lock-in App.dc.html';
const OUT = 'index.html';
const SHA = 'source/.helmet-sha';
const check = process.argv.includes('--check');

const slice = (s, from, to) => {
  const i = s.indexOf(from);
  if (i < 0) throw new Error(`marker not found: ${from}`);
  const j = s.lastIndexOf(to);
  if (j < 0) throw new Error(`marker not found: ${to}`);
  return [i, j];
};

// The bundler rewrites the body in two mechanical ways:
//   camelCase event attributes -> sc-camel-kebab (onClick -> sc-camel-on-click),
//   and valueless attributes get an explicit empty value.
const norm = s => s
  .replace(/\b(on[A-Z][a-zA-Z]*)=/g,
    (_, a) => 'sc-camel-' + a.replace(/([A-Z])/g, '-$1').toLowerCase() + '=')
  .replace(/(\sdata-dc-script)(?=[\s>])/g, '$1=""');

// The bundle escapes the "/" of "</" so the payload can never close its own
// <script>. Every other slash, and all non-ASCII, stays literal.
const enc = s => {
  let o = '"', prev = '';
  for (const c of s) {
    if (c === '\\') o += '\\\\';
    else if (c === '"') o += '\\"';
    else if (c === '\n') o += '\\n';
    else if (c === '\r') o += '\\r';
    else if (c === '\t') o += '\\t';
    else if (c === '/' && prev === '<') o += '\\u002F';
    else if (c < ' ') o += '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
    else o += c;
    prev = c;
  }
  return o + '"';
};

const src = fs.readFileSync(SRC, 'utf8');
const out = fs.readFileSync(OUT, 'utf8');

// Locate the template payload inside index.html.
const open = '<script type="__bundler/template">';
const ts = out.indexOf(open);
if (ts < 0) throw new Error('__bundler/template not found in ' + OUT);
const te = out.indexOf('</script>', ts);
const raw = out.slice(ts + open.length, te);
const lead = raw.slice(0, raw.length - raw.trimStart().length);
const tail = raw.slice(raw.trimEnd().length);
const tpl = JSON.parse(raw.trim());

// Keep the bundle's own <helmet> (fonts already inlined, asset refs already
// rewritten to uuids) and its tail after the last </script>, and replace
// everything between: the <x-dc> markup AND the dc-script holding the app
// logic, which lives after </x-dc>.
const [, th] = slice(tpl, '<x-dc>', '</helmet>');
const head = tpl.slice(0, th + '</helmet>'.length);
const tx = tpl.lastIndexOf('</script>');
const foot = tpl.slice(tx);

const [, sh] = slice(src, '<x-dc>', '</helmet>');
const sx = src.lastIndexOf('</script>');
if (sx < 0) throw new Error('no closing </script> in ' + SRC);
const body = src.slice(sh + '</helmet>'.length, sx);

// The <helmet> is carried over from the bundle, so edits to it in source/ do
// not reach the build. Warn when it changes.
const h = crypto.createHash('sha256').update(src.slice(0, sh)).digest('hex').slice(0, 16);
if (fs.existsSync(SHA)) {
  if (fs.readFileSync(SHA, 'utf8').trim() !== h) {
    console.warn('WARNING: the <helmet> block in ' + SRC + ' changed.');
    console.warn('  This build carries over the bundle\'s existing <helmet>, so that');
    console.warn('  change is NOT in index.html. Head tags, title, icon and font links');
    console.warn('  have to be updated in the bundle by hand or by the original tool.');
  }
} else if (!check) {
  fs.writeFileSync(SHA, h + '\n');
}

const built = out.slice(0, ts + open.length) + lead + enc(head + norm(body) + foot) + tail + out.slice(te);

if (check) {
  const same = built === out;
  console.log(same
    ? 'check: rebuilt output is byte-identical to ' + OUT + ' ✓'
    : 'check: MISMATCH — rebuilt ' + built.length + ' bytes vs ' + out.length + ' on disk');
  process.exit(same ? 0 : 1);
}

fs.writeFileSync(OUT, built);
console.log('built ' + OUT + ' from ' + SRC + ' (' + built.length + ' bytes)');

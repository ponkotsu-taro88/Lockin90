// Usage: node scripts/inject-head.mjs path/to/index.html
// The design tool exports a self-unpacking single-file index.html. iOS only reads
// <link rel="apple-touch-icon"> etc. from the OUTER <head>, so we inject them there.
import fs from 'node:fs';
const file = process.argv[2] || 'index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<!-- lockin90:head -->[\s\S]*?<!-- \/lockin90:head -->\n?/, '');
const HEAD = "<!-- lockin90:head -->\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">\n<meta name=\"apple-mobile-web-app-title\" content=\"Lock-in 90\">\n<meta name=\"theme-color\" content=\"#DADAD3\">\n<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png?v=2\">\n<link rel=\"icon\" type=\"image/png\" href=\"icon-512.png\">\n<link rel=\"manifest\" href=\"manifest.webmanifest\">\n<style>body{background:#DADAD3 !important}#__bundler_thumbnail{background:#DADAD3 !important}</style>\n<!-- /lockin90:head -->\n";
const i = html.indexOf('</head>');
if (i < 0) throw new Error('</head> not found');
html = html.slice(0, i) + HEAD + html.slice(i);
fs.writeFileSync(file, html);
console.log('head tags injected into', file);

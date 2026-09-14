import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const pathFor = (name) => new URL(name, root);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentSecurityPolicyHash(source) {
  return `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
}

function pngInfo(buffer) {
  assert(
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'Invalid PNG signature',
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

const [manifestText, html, serviceWorker, headers] = await Promise.all([
  readFile(pathFor('manifest.webmanifest'), 'utf8'),
  readFile(pathFor('index.html'), 'utf8'),
  readFile(pathFor('sw.js'), 'utf8'),
  readFile(pathFor('_headers'), 'utf8'),
]);
const manifest = JSON.parse(manifestText);
assert(manifest.id === '/', 'Manifest id must be /');
assert(
  manifest.name === 'Affordi' && manifest.short_name === 'Affordi',
  'Manifest name is incorrect',
);
assert(
  manifest.start_url === '/' && manifest.scope === '/',
  'Manifest navigation scope is incorrect',
);
assert(manifest.display === 'standalone', 'Manifest must use standalone display');
assert(
  manifest.icons?.some((icon) => icon.sizes === '192x192'),
  'Manifest lacks 192px icon',
);
assert(
  manifest.icons?.some((icon) => icon.sizes === '512x512'),
  'Manifest lacks 512px icon',
);
assert(
  manifest.icons?.some((icon) => icon.purpose === 'maskable'),
  'Manifest lacks maskable icon',
);

const iconSpecs = [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/icon-maskable-512.png', 512],
  ['icons/apple-touch-icon-180.png', 180],
];
const icons = await Promise.all(iconSpecs.map(([file]) => readFile(pathFor(file))));

for (const [iconIndex, [file, size]] of iconSpecs.entries()) {
  const png = icons[iconIndex];
  const info = pngInfo(png);
  assert(info.width === size && info.height === size, `${file} must be ${size}x${size}`);
}

assert(
  html.includes('manifest.webmanifest') && html.includes('viewport-fit=cover'),
  'iOS/PWA HTML metadata is incomplete',
);
assert(
  html.includes('<script type="module">') && html.includes('<style>'),
  'The entry script and stylesheet must be inlined in the app shell',
);
const inlineScript = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
const inlineStyle = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(
  serviceWorker.includes('precacheAndRoute') && serviceWorker.includes('cleanupOutdatedCaches'),
  'Generated service worker is missing complete precaching',
);
assert(
  serviceWorker.includes('index.html'),
  'Generated service worker lacks the navigation fallback',
);
const precacheUrls = [...serviceWorker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
assert(
  precacheUrls.length === new Set(precacheUrls).size,
  'Generated service worker contains duplicate precache entries',
);
assert(
  headers.includes('Content-Security-Policy') && headers.includes('/assets/*'),
  'Cloudflare headers are incomplete',
);
assert(
  !headers.includes('__ENTRY_') && /script-src[^;]*'sha256-/.test(headers),
  'Cloudflare CSP hashes were not generated',
);
assert(
  inlineScript !== undefined && headers.includes(contentSecurityPolicyHash(inlineScript)),
  'Cloudflare CSP does not allow the generated entry script',
);
assert(
  inlineStyle !== undefined && headers.includes(contentSecurityPolicyHash(inlineStyle)),
  'Cloudflare CSP does not allow the generated entry stylesheet',
);
console.log('PWA artifacts valid: manifest, icons, service worker, HTML metadata, and headers.');

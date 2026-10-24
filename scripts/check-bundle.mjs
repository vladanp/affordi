import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const outputPath = join(process.cwd(), 'dist');
const assetsPath = join(outputPath, 'assets');
const files = await readdir(assetsPath);
const fileAssets = await Promise.all(
  files
    .filter((file) => /\.(?:js|css)$/.test(file))
    .map(async (file) => {
      const content = await readFile(join(assetsPath, file));
      return { file, content };
    }),
);
const html = await readFile(join(outputPath, 'index.html'), 'utf8');
const inlineAssets = [
  ...[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((match, index) => ({
    file: `inline-${index}.js`,
    content: Buffer.from(match[1] ?? ''),
  })),
  ...[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match, index) => ({
    file: `inline-${index}.css`,
    content: Buffer.from(match[1] ?? ''),
  })),
];
const assets = [...fileAssets, ...inlineAssets];

/** The gzipped size of the files with an extension. */
function gzipTotal(extension, entries = assets) {
  return entries
    .filter(({ file }) => file.endsWith(extension))
    .reduce((sum, { content }) => sum + gzipSync(content).length, 0);
}

/**
 * Reports the size of the build without limiting it, so features are not held back by a byte
 * count. Lighthouse checks what users notice: how fast the page paints and responds.
 *
 * The first screen's script is inlined in the HTML and runs before anything paints, so it is
 * reported on its own. Copy in languages other than English loads on demand and counts only
 * toward the total.
 */
const kibibytes = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
console.log(
  `Bundle size: first screen JS ${kibibytes(gzipTotal('.js', inlineAssets))} gzip, ` +
    `all JS ${kibibytes(gzipTotal('.js'))} gzip, CSS ${kibibytes(gzipTotal('.css'))} gzip.`,
);

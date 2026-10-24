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

function total(extension) {
  return assets
    .filter(({ file }) => file.endsWith(extension))
    .reduce(
      (result, { content }) => ({
        raw: result.raw + content.length,
        gzip: result.gzip + gzipSync(content).length,
      }),
      { raw: 0, gzip: 0 },
    );
}

/**
 * Gzip budgets are a tripwire for accidental weight, such as a new dependency, rather than a
 * target. The app ships as one HTML file with its scripts inlined, and Lighthouse checks the
 * user-facing result: performance 100, largest paint under 2 s, and blocking time under 200 ms.
 * React and React DOM take about 60 KiB of the script budget; the rest leaves room for the pages
 * and their copy in five languages.
 */
const JS_GZIP_BUDGET = 120 * 1024;
const CSS_GZIP_BUDGET = 20 * 1024;

const javascript = total('.js');
const css = total('.css');
const kibibytes = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
if (javascript.gzip > JS_GZIP_BUDGET)
  throw new Error(`JS gzip budget exceeded: ${kibibytes(javascript.gzip)}`);
if (css.gzip > CSS_GZIP_BUDGET) throw new Error(`CSS gzip budget exceeded: ${kibibytes(css.gzip)}`);
if (javascript.raw > 400 * 1024 || css.raw > 80 * 1024)
  throw new Error(
    `Raw bundle budget exceeded (JS ${kibibytes(javascript.raw)}, CSS ${kibibytes(css.raw)})`,
  );
console.log(
  `Bundle budgets valid: JS ${kibibytes(javascript.gzip)} gzip, CSS ${kibibytes(css.gzip)} gzip.`,
);

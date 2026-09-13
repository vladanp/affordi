import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const assetsPath = join(process.cwd(), 'dist', 'assets');
const files = await readdir(assetsPath);
const assets = await Promise.all(
  files
    .filter((file) => /\.(?:js|css)$/.test(file))
    .map(async (file) => {
      const content = await readFile(join(assetsPath, file));
      return { file, content };
    }),
);

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

const javascript = total('.js');
const css = total('.css');
const kibibytes = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
if (javascript.gzip > 100 * 1024)
  throw new Error(`JS gzip budget exceeded: ${kibibytes(javascript.gzip)}`);
if (css.gzip > 20 * 1024) throw new Error(`CSS gzip budget exceeded: ${kibibytes(css.gzip)}`);
if (javascript.raw > 400 * 1024 || css.raw > 80 * 1024)
  throw new Error(
    `Raw bundle budget exceeded (JS ${kibibytes(javascript.raw)}, CSS ${kibibytes(css.raw)})`,
  );
console.log(
  `Bundle budgets valid: JS ${kibibytes(javascript.gzip)} gzip, CSS ${kibibytes(css.gzip)} gzip.`,
);

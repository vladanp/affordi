import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const scriptHashPlaceholder = '__ENTRY_SCRIPT_HASH__';
const styleHashPlaceholder = '__ENTRY_STYLE_HASH__';

function contentSecurityPolicyHash(source: string): string {
  return `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
}

function inlineEntryAssets(): Plugin {
  let scriptHash: string | null = null;
  let styleHash: string | null = null;

  return {
    name: 'affordi-inline-entry-assets',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const htmlAsset = bundle['index.html'];
        if (htmlAsset?.type !== 'asset') throw new Error('The build did not emit index.html.');
        let html = String(htmlAsset.source);

        const stylesheet = Object.values(bundle).find(
          (entry) => entry.type === 'asset' && entry.fileName.endsWith('.css'),
        );
        if (stylesheet === undefined || stylesheet.type !== 'asset') {
          throw new Error('The build did not emit an entry stylesheet.');
        }
        const stylesheetSource = String(stylesheet.source).replaceAll('</style', '<\\/style');
        const stylesheetTag = `<link rel="stylesheet" crossorigin href="/${stylesheet.fileName}">`;
        if (!html.includes(stylesheetTag))
          throw new Error('Could not locate the entry stylesheet tag.');
        html = html.replace(stylesheetTag, () => `<style>${stylesheetSource}</style>`);
        styleHash = contentSecurityPolicyHash(stylesheetSource);
        delete bundle[stylesheet.fileName];

        const entryScript = Object.values(bundle).find(
          (entry) => entry.type === 'chunk' && entry.isEntry,
        );
        if (entryScript === undefined || entryScript.type !== 'chunk') {
          throw new Error('The build did not emit an entry script.');
        }
        let scriptSource = entryScript.code;
        for (const importedFile of [...entryScript.imports, ...entryScript.dynamicImports]) {
          scriptSource = scriptSource.replaceAll(`./${basename(importedFile)}`, `/${importedFile}`);
        }
        scriptSource = scriptSource.replaceAll('</script', '<\\/script');
        const scriptTag = `<script type="module" crossorigin src="/${entryScript.fileName}"></script>`;
        if (!html.includes(scriptTag)) throw new Error('Could not locate the entry script tag.');
        html = html.replace(scriptTag, () => `<script type="module">${scriptSource}</script>`);
        scriptHash = contentSecurityPolicyHash(scriptSource);
        delete bundle[entryScript.fileName];

        htmlAsset.source = html;
      },
    },
    async writeBundle(options) {
      if (scriptHash === null || styleHash === null) {
        throw new Error('Entry asset hashes were not generated.');
      }
      const outputDirectory = resolve(options.dir ?? 'dist');
      const headersPath = resolve(outputDirectory, '_headers');
      const headers = await readFile(headersPath, 'utf8');
      if (!headers.includes(scriptHashPlaceholder) || !headers.includes(styleHashPlaceholder)) {
        throw new Error('Cloudflare CSP hash placeholders are missing.');
      }
      await writeFile(
        headersPath,
        headers.replace(scriptHashPlaceholder, scriptHash).replace(styleHashPlaceholder, styleHash),
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Affordi',
        short_name: 'Affordi',
        description: 'Turn prices into the time it takes to earn them.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#f4f1eb',
        background_color: '#f4f1eb',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
    inlineEntryAssets(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**'],
      thresholds: {
        branches: 85,
        functions: 95,
        lines: 90,
        statements: 90,
      },
    },
  },
});

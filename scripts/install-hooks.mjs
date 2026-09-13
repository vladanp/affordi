import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.CI) process.exit(0);

try {
  await access(resolve(projectRoot, '.git'), constants.F_OK);
} catch {
  // Package installation also happens in source archives and CI checkouts without .git.
  process.exit(0);
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: projectRoot });

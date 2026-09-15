import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const deploymentUrl = process.argv[2];
if (deploymentUrl === undefined) {
  throw new Error('Pass the production URL to verify.');
}

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [relative(distDirectory, path)];
    }),
  );
  return files.flat();
}

const deployedFiles = (await listFiles(distDirectory))
  .filter((path) => path !== '_headers')
  .toSorted();
const expectedFiles = new Map(
  await Promise.all(
    deployedFiles.map(async (path) => [path, await readFile(join(distDirectory, path))]),
  ),
);

function deploymentRequest(path) {
  const url = new URL(path, deploymentUrl);
  url.searchParams.set('deployment-check', String(Date.now()));
  return fetch(url, {
    headers: { 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(10_000),
  });
}

function requireExactHeader(response, name, expected) {
  const actual = response.headers.get(name) ?? '';
  if (actual !== expected) {
    throw new Error(`${name} header is invalid: ${actual || 'missing'}`);
  }
}

function requireHeaderParts(response, name, expectedParts) {
  const actual = response.headers.get(name) ?? '';
  if (!expectedParts.every((part) => actual.includes(part))) {
    throw new Error(`${name} header is invalid: ${actual || 'missing'}`);
  }
}

async function requireExactFile(path, expected) {
  const response = await deploymentRequest(`/${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);

  const actual = Buffer.from(await response.arrayBuffer());
  if (!actual.equals(expected)) {
    throw new Error(`${path} does not match the validated production build`);
  }
}

function requireSecurityHeaders(response) {
  requireHeaderParts(response, 'cache-control', ['no-cache', 'no-store', 'must-revalidate']);
  requireExactHeader(response, 'x-content-type-options', 'nosniff');
  requireExactHeader(response, 'x-frame-options', 'DENY');
  requireExactHeader(response, 'cross-origin-opener-policy', 'same-origin');
  requireExactHeader(response, 'cross-origin-resource-policy', 'same-origin');
  requireExactHeader(response, 'referrer-policy', 'no-referrer');
  requireHeaderParts(response, 'strict-transport-security', ['max-age=31536000']);
  requireHeaderParts(response, 'permissions-policy', [
    'camera=()',
    'geolocation=()',
    'microphone=()',
  ]);

  const policy = response.headers.get('content-security-policy') ?? '';
  const requiredPolicyParts = ["script-src 'self' 'sha256-", "style-src 'self' 'sha256-"];
  if (!requiredPolicyParts.every((part) => policy.includes(part)) || policy.includes('__ENTRY_')) {
    throw new Error('production is missing the generated Content Security Policy hashes');
  }
}

async function verifyOnce() {
  const response = await deploymentRequest('/');
  if (!response.ok) throw new Error(`production returned HTTP ${response.status}`);

  const actualHtml = Buffer.from(await response.arrayBuffer());
  if (!actualHtml.equals(expectedFiles.get('index.html'))) {
    throw new Error('production has not published the exact validated app shell yet');
  }

  requireSecurityHeaders(response);
  await Promise.all(
    deployedFiles
      .filter((path) => path !== 'index.html')
      .map((path) => requireExactFile(path, expectedFiles.get(path))),
  );
}

async function verifyDeployment(attempt) {
  try {
    await verifyOnce();
    console.log(
      `Production deployment verified at ${deploymentUrl} (${deployedFiles.length} exact files).`,
    );
    return;
  } catch (error) {
    if (attempt >= 12) {
      const failure = error instanceof Error ? error.message : String(error);
      throw new Error(`Production deployment verification failed: ${failure}`, { cause: error });
    }
  }
  await delay(5_000);
  return verifyDeployment(attempt + 1);
}

await verifyDeployment(1);

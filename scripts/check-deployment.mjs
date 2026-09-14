import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const deploymentUrl = process.argv[2];
if (deploymentUrl === undefined) {
  throw new Error('Pass the production URL to verify.');
}

const expectedHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

async function verifyDeployment(attempt) {
  let failure = 'deployment did not respond';
  try {
    const url = new URL(deploymentUrl);
    url.searchParams.set('deployment-check', String(Date.now()));
    const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    const html = await response.text();
    const policy = response.headers.get('content-security-policy') ?? '';

    if (!response.ok) {
      failure = `production returned HTTP ${response.status}`;
    } else if (html !== expectedHtml) {
      failure = 'production has not published the exact validated app shell yet';
    } else if (!policy.includes("script-src 'self' 'sha256-") || policy.includes('__ENTRY_')) {
      failure = 'production is missing the generated Content Security Policy hashes';
    } else {
      console.log(`Production deployment verified at ${deploymentUrl}.`);
      return;
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  if (attempt >= 12) {
    throw new Error(`Production deployment verification failed: ${failure}`);
  }
  await delay(5_000);
  return verifyDeployment(attempt + 1);
}

await verifyDeployment(1);

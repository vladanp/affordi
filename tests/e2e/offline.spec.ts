import { expect, test } from '@playwright/test';

import { completeSetup } from './helpers';

test.use({ serviceWorkers: 'allow' });

test('installed app shell keeps calculator usable offline', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'The service worker check runs once.');

  await completeSetup(page);
  await page.getByRole('textbox', { name: 'Enter a price' }).fill('750');
  await expect(page.getByText('43 hours of work')).toBeVisible();

  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
  });
  await page.context().setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Enter a price' }).fill('750');
    await expect(page.getByText('43 hours of work')).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

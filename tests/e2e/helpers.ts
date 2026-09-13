import { expect, type Page } from '@playwright/test';

export async function completeSetup(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start with your income' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Take-home income' }).fill('3000');
  await page.getByRole('combobox', { name: 'Pay frequency' }).selectOption('monthly');
  await page.getByRole('textbox', { name: 'Work hours each week' }).fill('40');
  await page.getByRole('textbox', { name: 'Work days each week' }).fill('5');
  await page.getByRole('combobox', { name: 'Currency' }).selectOption('EUR');
  await page.getByRole('button', { name: 'Start calculating' }).click();
  await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
}

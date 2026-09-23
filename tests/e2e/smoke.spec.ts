import { expect, test } from '@playwright/test';

test('a new game can cut pine and see it in the inventory', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Welcome to Ironbark')).toBeVisible();
  await page.goto('/skills/woodcutting/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  // Peter's toast: "+1 (1)" after the first 3-second chop.
  await expect(page.getByText('+1', { exact: true })).toBeVisible({ timeout: 6000 });
  await page.goto('/inventory/');
  await expect(page.getByTitle('Pine logs')).toBeVisible();
});

test('coming back after a while shows what happened', async ({ page, context }) => {
  await page.goto('/skills/woodcutting/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  await page.waitForTimeout(300);
  await page.close();
  await context.addInitScript(() => {
    if (sessionStorage.getItem('rewound')) return;
    const s = JSON.parse(localStorage.getItem('ironbark:save') ?? '{}');
    s.now -= 3 * 3600e3;
    localStorage.setItem('ironbark:save', JSON.stringify(s));
    sessionStorage.setItem('rewound', '1');
  });
  const again = await context.newPage();
  await again.goto('/skills/woodcutting/');
  await expect(again.getByText('While you were away')).toBeVisible();
  await expect(again.getByText('+3,600')).toBeVisible();
});

for (const path of ['/', '/skills/woodcutting/', '/skills/smithing/', '/inventory/', '/equipment/', '/shop/', '/combat/encounters/']) {
  test(`no sideways scrolling on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const [scroll, view] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll).toBeLessThanOrEqual(view);
  });
}

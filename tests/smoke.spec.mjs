import { test, expect } from '@playwright/test';
const pages = ['/', '/resume', '/gallery', '/media', '/contact', '/privacy'];

for (const p of pages) {
  test(`loads ${p} with one h1, a title and no console errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const res = await page.goto(p);
    expect(res.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.title()).length).toBeGreaterThan(5);
    expect(errors).toEqual([]);
  });
}

test('home dots swap headshot and quote', async ({ page }) => {
  await page.goto('/');
  await page.locator('.dots button').nth(3).click();
  await expect(page.locator('.quote figcaption')).toContainText('THE MAIDS');
  await expect(page.locator('.dots button').nth(3)).toHaveAttribute('aria-pressed', 'true');
});

test('gallery lightbox opens and closes with Escape', async ({ page }) => {
  await page.goto('/gallery');
  await page.locator('.hgrid a').first().click();
  await expect(page.locator('.lb')).toHaveClass(/open/);
  const dl = page.locator('.lb .dl');
  await expect(dl).toBeVisible();
  await expect(dl).toHaveAttribute('download', /\.jpg$/);
  expect((await page.request.get(await dl.getAttribute('href'))).status()).toBe(200);
  // focus trap: tabbing from the last control wraps back inside the viewer
  await page.locator('.lb .next').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement.closest('.lb'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.lb')).not.toHaveClass(/open/);
});

test('resume downloads exist', async ({ request }) => {
  for (const f of ['/downloads/Isto-Barton-Resume.pdf', '/downloads/Isto-Barton-Headshot.jpg']) {
    expect((await request.get(f)).status()).toBe(200);
  }
});

test('missing page shows the custom 404', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.locator('h1')).toHaveText('LOST?');
});

import { test, expect } from '@playwright/test';
import { naturalCompare, compareProducts } from '../src/lib/api.js';

test.describe('7. Product Ordering, Deletion & Re-creation Lifecycle Suite', () => {

  test('7.1 Natural alphanumeric comparison accurately sequences numeric identifiers', () => {
    expect(naturalCompare('MWJCR 01', 'MWJCR 02')).toBeLessThan(0);
    expect(naturalCompare('MWJCR 06', 'MWJCR 7')).toBeLessThan(0);
    expect(naturalCompare('MWJCR 7', 'MWJCR 08')).toBeLessThan(0);
    expect(naturalCompare('MWJCR 08', 'MWJCR 09')).toBeLessThan(0);
    expect(naturalCompare('MWJCR 08', 'MWJCR 25')).toBeLessThan(0);
    expect(naturalCompare('MWJCR 25', 'MWJCR 26')).toBeLessThan(0);
  });

  test('7.2 Full sequence maintains expected order with exclusive products first', () => {
    const sample = [
      { id: 'custom-25', name: 'MWJCR 25', featured: false },
      { id: 'custom-1791959100466', name: 'MWJCR 08', featured: false, created_at: '2026-10-14T06:25:00Z' },
      { id: 'urbanedge-pro', name: 'Urban Edge Pro', featured: true },
      { id: 'custom-7', name: 'MWJCR 7', featured: false },
      { id: 'custom-1', name: 'MWJCR 01', featured: false },
      { id: 'custom-9', name: 'MWJCR 09', featured: false },
    ];

    const sorted = sample.sort(compareProducts);
    expect(sorted[0].name).toBe('Urban Edge Pro');
    expect(sorted[1].name).toBe('MWJCR 01');
    expect(sorted[2].name).toBe('MWJCR 7');
    expect(sorted[3].name).toBe('MWJCR 08');
    expect(sorted[4].name).toBe('MWJCR 09');
    expect(sorted[5].name).toBe('MWJCR 25');
  });

  test('7.3 Re-creating a product restores its exact intended position', () => {
    const catalogue = [
      { id: 'c-1', name: 'MWJCR 01' },
      { id: 'c-7', name: 'MWJCR 7' },
      { id: 'c-9', name: 'MWJCR 09' },
      { id: 'c-25', name: 'MWJCR 25' },
    ];

    // Re-create MWJCR 08 with newer timestamp
    const recreated08 = {
      id: `custom-${Date.now()}`,
      name: 'MWJCR 08',
      created_at: new Date().toISOString()
    };

    const updated = [...catalogue, recreated08].sort(compareProducts);
    expect(updated[2].name).toBe('MWJCR 08');
  });

  test('7.4 Storefront product grid renders in expected logical order', async ({ page }) => {
    await page.goto('/shop?category=slippers');
    await expect(page.getByText('MWJCR 01').first()).toBeVisible({ timeout: 15000 });

    const headings = await page.locator('.product-card h3, .product-card h2, h3.font-display').allInnerTexts();
    const mwjcrTitles = headings.filter(t => t.startsWith('MWJCR'));

    if (mwjcrTitles.length > 2) {
      const idx7 = mwjcrTitles.findIndex(t => t.includes('MWJCR 7') || t.includes('MWJCR 07'));
      const idx8 = mwjcrTitles.findIndex(t => t.includes('MWJCR 08') || t.includes('MWJCR 8'));
      const idx9 = mwjcrTitles.findIndex(t => t.includes('MWJCR 09') || t.includes('MWJCR 9'));

      if (idx7 !== -1 && idx8 !== -1) {
        expect(idx8).toBeGreaterThan(idx7);
      }
      if (idx8 !== -1 && idx9 !== -1) {
        expect(idx9).toBeGreaterThan(idx8);
      }
    }
  });

});

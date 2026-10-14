import { test, expect } from '@playwright/test';
import { sortSizes } from '../src/lib/utils.js';

test.describe('8. Product Size Ordering, Default Selection & Scroll Behavior Suite', () => {

  test('8.1 Normalizes and sorts descending numeric sizes into ascending sequence', () => {
    const descending = ['12', '11', '10', '9', '8', '7', '6'];
    const sorted = sortSizes(descending);
    expect(sorted).toEqual(['6', '7', '8', '9', '10', '11', '12']);
    expect(sorted[0]).toBe('6'); // Lowest available size
  });

  test('8.2 Handles jumbled, non-contiguous and single-digit vs multi-digit sizes', () => {
    const jumbled = ['10', '6', '12', '7', '11', '8', '9'];
    expect(sortSizes(jumbled)).toEqual(['6', '7', '8', '9', '10', '11', '12']);

    const missingSizes = ['11', '7', '9'];
    const sortedMissing = sortSizes(missingSizes);
    expect(sortedMissing).toEqual(['7', '9', '11']);
    expect(sortedMissing[0]).toBe('7');
  });

  test('8.3 Standardizes apparel non-numeric sizes in logical hierarchy', () => {
    const apparel = ['XL', 'S', 'XXL', 'M', 'XS', 'L'];
    expect(sortSizes(apparel)).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  test('8.4 Handles comma-separated strings, duplicates and empty values gracefully', () => {
    expect(sortSizes(' 10, 8, 9, 6, 7 , 8 ')).toEqual(['6', '7', '8', '9', '10']);
    expect(sortSizes([])).toEqual([]);
    expect(sortSizes(null)).toEqual([]);
    expect(sortSizes(undefined)).toEqual([]);
  });

  test('8.5 Live API returns normalized sizes across products', async () => {
    const { getProducts, getProduct } = await import('../src/lib/api.js');
    const { products } = await getProducts({ limit: 10 });
    for (const p of products) {
      if (p.sizes && p.sizes.length > 0) {
        expect(p.sizes).toEqual(sortSizes(p.sizes));
      }
    }

    const mwjcr03 = await getProduct('custom-1791790505796');
    if (mwjcr03 && mwjcr03.sizes) {
      expect(mwjcr03.sizes).toEqual(['6', '7', '8', '9', '10', '11', '12']);
      expect(mwjcr03.sizes[0]).toBe('6');
    }
  });

});
import { describe, expect, it } from 'vitest';
import { calculatePromoDiscount, normalizePromoCode, PromoCodeInput } from '@/lib/promocodes';

const activePromo: PromoCodeInput = {
  code: 'save10',
  type: 'PERCENT',
  value: 10,
  minOrderTotal: 0,
  isActive: true,
};

describe('Promo code discount calculation', () => {
  it('normalizes promo codes before use', () => {
    expect(normalizePromoCode('  save10 ')).toBe('SAVE10');
  });

  it('calculates percentage discounts', () => {
    const result = calculatePromoDiscount(500, activePromo);

    expect(result).toMatchObject({
      valid: true,
      code: 'SAVE10',
      discount: 50,
      total: 450,
    });
  });

  it('calculates fixed discounts and never returns a negative total', () => {
    const result = calculatePromoDiscount(120, {
      ...activePromo,
      code: 'minus200',
      type: 'FIXED',
      value: 200,
    });

    expect(result.valid).toBe(true);
    expect(result.discount).toBe(120);
    expect(result.total).toBe(0);
  });

  it('rejects inactive promo codes', () => {
    const result = calculatePromoDiscount(500, { ...activePromo, isActive: false });

    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(500);
  });

  it('rejects expired promo codes', () => {
    const result = calculatePromoDiscount(
      500,
      { ...activePromo, expiresAt: '2026-01-01' },
      new Date('2026-06-19')
    );

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Термін дії промокоду минув');
  });

  it('rejects orders below the minimum total', () => {
    const result = calculatePromoDiscount(250, { ...activePromo, minOrderTotal: 300 });

    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(250);
  });
});

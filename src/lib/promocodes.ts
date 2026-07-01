import { PromoCode } from './types';

export type PromoCodeInput = Pick<PromoCode, 'code' | 'type' | 'value' | 'minOrderTotal' | 'expiresAt' | 'isActive'>;

export interface PromoDiscountResult {
  valid: boolean;
  code?: string;
  discount: number;
  total: number;
  message?: string;
}

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculatePromoDiscount(
  subtotal: number,
  promoCode: PromoCodeInput | null | undefined,
  now: Date = new Date()
): PromoDiscountResult {
  const safeSubtotal = Math.max(0, roundMoney(subtotal));

  if (!promoCode) {
    return { valid: false, discount: 0, total: safeSubtotal, message: 'Промокод не знайдено' };
  }

  const code = normalizePromoCode(promoCode.code);

  if (!promoCode.isActive) {
    return { valid: false, code, discount: 0, total: safeSubtotal, message: 'Промокод неактивний' };
  }

  if (promoCode.expiresAt && new Date(promoCode.expiresAt) < now) {
    return { valid: false, code, discount: 0, total: safeSubtotal, message: 'Термін дії промокоду минув' };
  }

  const minOrderTotal = promoCode.minOrderTotal ?? 0;
  if (safeSubtotal < minOrderTotal) {
    return {
      valid: false,
      code,
      discount: 0,
      total: safeSubtotal,
      message: `Мінімальна сума замовлення ${minOrderTotal} ₴`,
    };
  }

  const rawDiscount = promoCode.type === 'PERCENT'
    ? safeSubtotal * (promoCode.value / 100)
    : promoCode.value;
  const discount = Math.min(safeSubtotal, Math.max(0, roundMoney(rawDiscount)));

  return {
    valid: true,
    code,
    discount,
    total: roundMoney(safeSubtotal - discount),
  };
}

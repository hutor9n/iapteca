export type UserRole = 'CUSTOMER' | 'ADMIN';
export type PromoCodeDiscountType = 'PERCENT' | 'FIXED';

export interface User { _id: string; phone: string; password?: string; name?: string; role: UserRole; isBanned: boolean; }
export interface Category { _id: string; name: string; }
export interface Medication { _id: string; name: string; description: string; price: number; stock: number; category: string; manufacturer: string; image?: string; isDeleted?: boolean; }
export interface OrderItem { medication: string; quantity: number; price: number; }
export interface Order { _id: string; user: string; items: OrderItem[]; subtotal?: number; discount?: number; promoCode?: string; total: number; status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'; createdAt: string | Date; }
export interface PromoCode {
  _id: string;
  code: string;
  type: PromoCodeDiscountType;
  value: number;
  minOrderTotal?: number;
  expiresAt?: string | Date;
  isActive: boolean;
  createdAt?: string | Date;
}

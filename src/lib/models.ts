import { model, models, Schema } from 'mongoose';
import { User, Medication, Order, OrderItem, Category, PromoCode } from './types';

const userSchema = new Schema<User>({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

const categorySchema = new Schema<Category>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

const medicationSchema = new Schema<Medication>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  category: { type: String, required: true },
  manufacturer: { type: String, required: true },
  image: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const orderItemSchema = new Schema<OrderItem>({
  medication: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema<Order>({
  user: { type: String, required: true },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, min: 0 },
  discount: { type: Number, min: 0, default: 0 },
  promoCode: { type: String, uppercase: true, trim: true },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
}, { timestamps: true });

const promoCodeSchema = new Schema<PromoCode>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderTotal: { type: Number, min: 0, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'promo_codes' });

export const UserModel = models.User || model<User>('User', userSchema);
export const CategoryModel = models.Category || model<Category>('Category', categorySchema);
export const MedicationModel = models.Medication || model<Medication>('Medication', medicationSchema);
export const OrderModel = models.Order || model<Order>('Order', orderSchema);
export const PromoCodeModel = models.PromoCode || model<PromoCode>('PromoCode', promoCodeSchema);

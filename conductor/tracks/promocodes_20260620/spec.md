# Specification: Implement Promo Codes Functionality

This specification defines the requirements and technical details for adding Promo Code support to the iApteca platform.

## 1. Overview
The Promo Codes feature allows administrators to define discount codes that customers can apply during checkout. Discounts can be either a percentage (e.g., 10% off) or a fixed amount (e.g., 100 UAH off). Promo codes can be subject to expiry, minimum order thresholds, and activation state.

## 2. Requirements

### Functional Requirements
- **Admin Panel (CRUD):**
  - Create new promo codes (code, discount type, value, expiry date, minimum order value, status).
  - View all existing promo codes in a table with search/filtering.
  - Toggle the active status of a promo code.
  - Edit or delete existing promo codes.
- **Validation Engine:**
  - Normalize codes (trim whitespace, uppercase).
  - Verify if a promo code exists, is active, is not expired, and matches the minimum order total.
  - Correctly calculate percentage and fixed discounts. Ensure the discount never exceeds the order total (minimum final order price is 0).
- **Checkout Integration:**
  - Input field on the checkout page to enter a promo code.
  - Real-time verification against the backend.
  - Display validation status (success with discount amount, or clear error messages in Ukrainian).
  - Apply the discount to the final total sent to the backend when placing an order.
- **Order Tracking:**
  - Store applied promo code and discount amount on the `Order` document.
  - Keep track of usage statistics for promo codes.

### Non-Functional Requirements
- **Validation Speed:** API response for promo code validation must be ≤ 150ms.
- **Security:** CRUD operations for promo codes are restricted to users with the `ADMIN` role.

## 3. Data Models

### Mongoose Schema: `PromoCode`
```typescript
interface IPromoCode {
  code: string; // Unique, uppercase
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderTotal: number;
  isActive: boolean;
  expiresAt?: Date;
  usageCount: number;
  maxUsages?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Mongoose Schema Update: `Order`
- Add `promoCode: String` (optional).
- Add `discountAmount: Number` (default 0).
- Add `subtotal: Number` (before discount).
- Add `total: Number` (after discount).

## 4. API Endpoints

### Public/Customer Endpoints
- `POST /api/promocodes/validate`
  - **Body:** `{ code: string, orderTotal: number }`
  - **Response (200 OK):**
    - Valid: `{ valid: true, code: string, discount: number, total: number }`
    - Invalid: `{ valid: false, message: string }`

### Admin Endpoints (Requires ADMIN role)
- `POST /api/promocodes` - Create promo code.
- `GET /api/promocodes` - List all promo codes.
- `PUT /api/promocodes/[id]` - Edit a promo code.
- `DELETE /api/promocodes/[id]` - Delete a promo code.

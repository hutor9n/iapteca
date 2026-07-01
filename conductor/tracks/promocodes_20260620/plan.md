# Implementation Plan: Implement Promo Codes Functionality

This plan defines the phases and tasks required to implement the Promo Codes functionality for the iApteca project.

---

## Phase 1: Database Model & Core Helper Functions

- [ ] **Task: Write Tests for PromoCode Schema & Helpers**
  - [ ] Add unit tests in `src/test/promocodes.test.ts` to validate the `PromoCode` schema constraints (unique codes, required fields) and verify correct discount calculations in helper functions.
- [ ] **Task: Implement PromoCode Mongoose Schema & Helpers**
  - [ ] Define the `PromoCode` schema and export the model in `src/lib/models.ts`.
  - [ ] Implement `normalizePromoCode` and `calculatePromoDiscount` functions in `src/lib/promocodes.ts` to satisfy the tests.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Database Model & Core Helper Functions' (Protocol in workflow.md)**
  - [ ] Verify that all unit tests for the schema and helpers pass using `pnpm test`.

---

## Phase 2: Validation API & Order Schema Update

- [ ] **Task: Write API Validation Tests**
  - [ ] Write integration tests for the validation endpoint `POST /api/promocodes/validate` covering both success scenarios (valid fixed/percentage codes) and failure scenarios (inactive, expired, below minimum order total).
- [ ] **Task: Implement Validation API Route & Update Order Schema**
  - [ ] Create the Next.js API route `src/app/api/promocodes/validate/route.ts` that processes validation requests.
  - [ ] Update the `Order` model in `src/lib/models.ts` to include `promoCode`, `discountAmount`, `subtotal`, and `total` fields.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Validation API & Order Schema Update' (Protocol in workflow.md)**
  - [ ] Test the validation endpoint with postman or curl request and verify automated test coverage.

---

## Phase 3: Admin Promo Code Management

- [ ] **Task: Write Admin CRUD API & Component Tests**
  - [ ] Write integration tests for the admin CRUD API endpoints and component tests for the admin promo code listing and form.
- [ ] **Task: Implement Admin CRUD API Routes**
  - [ ] Implement the `POST /api/promocodes` and `GET /api/promocodes` routes in `src/app/api/promocodes/route.ts` with ADMIN role check.
  - [ ] Implement edit (`PUT`) and delete (`DELETE`) routes in `src/app/api/promocodes/[id]/route.ts`.
- [ ] **Task: Implement Admin Manage Promo Codes Page**
  - [ ] Create the UI page `src/app/admin/promocodes/page.tsx` displaying the list of promo codes in a table with options to add, edit, toggle active status, and delete.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Admin Promo Code Management' (Protocol in workflow.md)**
  - [ ] Launch development server, navigate to `/admin/promocodes`, and verify all CRUD operations manually.

---

## Phase 4: Checkout Integration

- [ ] **Task: Write Checkout Page Promo Code Integration Tests**
  - [ ] Write component tests simulating a user applying a promo code during checkout, verifying that discounts are calculated and displayed correctly.
- [ ] **Task: Integrate Promo Code field in Checkout page**
  - [ ] Add the promo code field to the UI checkout page `src/app/checkout/page.tsx`. Integrate it with the validate API, update the order summary display in real-time, and pass the code and discount to the order creation payload.
- [ ] **Task: Update Order Creation Logic**
  - [ ] Update order creation endpoint `POST /api/orders` to validate the applied promo code on the server side, apply the discount to the final total, save it on the order document, and increment the promo code's usage count.
- [ ] **Task: Conductor - User Manual Verification 'Phase 4: Checkout Integration' (Protocol in workflow.md)**
  - [ ] Complete a manual test checkout applying a percentage/fixed promo code, and verify that the order is recorded with the correct subtotal, discount, and total.

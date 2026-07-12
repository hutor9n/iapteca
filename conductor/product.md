# Initial Concept
iApteca is a public web platform for online search and reservation of medications with an integrated administration panel for pharmacy catalog management.

# Product Guide

## Vision
To provide a seamless, reliable, and user-friendly online platform for searching, filtering, and reserving pharmaceutical products. iApteca connects customers with local pharmacies, ensuring real-time visibility into medication availability, prices, and status tracking, while providing pharmacy administrators with powerful, secure CRUD tools to manage inventory, categories, and orders.

## Target Audience
- **Guests:** Unregistered visitors searching for specific medications, checking availability, and viewing product details.
- **Customers:** Registered buyers who create profiles, manage shopping carts, reserve medications, and track their order history.
- **Administrators:** Pharmacy staff who manage the medication catalog, edit pricing/stock levels, customize categories, and process incoming orders.

## Core Features
1. **Medication Catalog & Search (SSR):**
   - High-performance, SEO-friendly listing page using Server-Side Rendering (SSR).
   - Fast dynamic search by name.
   - Multi-category filtering.
   - Stock status indicators ("In Stock", "Out of Stock", "Running Low").
   - Detailed product card page (`/product/[id]`).
2. **Cart & Reservation System:**
   - Client-side shopping cart powered by Zustand, persistent via LocalStorage.
   - Secure checkout for authenticated users, generating order records in `PENDING` status.
   - Order history and details available under the Customer Profile page.
3. **Admin Dashboard:**
   - Role-based secure access control (only `ADMIN` role allowed).
   - Complete CRUD operations for Medications and Categories.
   - Real-time price and stock updates.
   - Order management (transitioning statuses: `PENDING` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED`).
   - Customer user directory with search/lookup.
4. **User Authentication & Profiles:**
   - Registration and secure login using secure, HttpOnly session cookies.
   - Password hashing with Bcrypt (minimum 10 rounds).
   - Profile management and optional in-app status notifications.

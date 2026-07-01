# Technology Stack

## Core Technologies
- **Language:** TypeScript (`^5`) for type-safe code.
- **Framework:** Next.js (`16.2.4`) utilizing the App Router (`src/app`) for layouts, SSR, and API routes.
- **Frontend Core:** React (`19.2.4`) and React DOM (`19.2.4`).

## Styling & UI Components
- **Styling:** Tailwind CSS (`^4`) via PostCSS (`@tailwindcss/postcss`).
- **UI Components:** Radix UI primitives (`^1.4.3`) and styled components via Shadcn/UI conventions.
- **Icons:** Lucide React (`^1.8.0`).
- **Notifications:** Sonner (`^2.0.7`).
- **Utilities:** Class Variance Authority (`cva`) (`^0.7.1`), Clsx (`^2.1.1`), and Tailwind Merge (`^3.5.0`) for utility class management.

## State Management & Database
- **Client State:** Zustand (`^5.0.12`) for lightweight, client-side store management (e.g., shopping cart, authentication state).
- **Database ODM:** Mongoose (`^9.5.0`) for modeling MongoDB documents and querying database.
- **Environment:** Dotenv (`^17.4.2`) for environment variable handling.
- **Security:** Bcrypt (`^6.0.0`) for password hashing.

## Testing & Quality Assurance
- **Unit/Integration Testing:** Vitest (`^4.1.5`) with React Testing Library (`@testing-library/react` `^16.3.2`) and JSDOM (`^29.0.2`).
- **Load/Performance Testing:** k6 for API and load testing.
- **Linting:** ESLint (`^9`) with `eslint-config-next` (`16.2.4`).

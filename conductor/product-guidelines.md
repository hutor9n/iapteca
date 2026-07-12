# Product Guidelines

## Brand & Tone
- **Professional & Trustworthy:** As a health-related application, the tone must be serious, reliable, and clear. Avoid overly casual language.
- **Accessible & Inclusive:** Ensure medical terminology is explained where appropriate, and the interface is easy to read for users of all age groups.
- **Bilingual Support (Future-ready):** The platform is primarily oriented for Ukrainian-speaking users (based on existing requirements), but code and layout should remain localization-friendly.

## Design Principles
- **Clean & High Contrast:** Medical/pharmaceutical products require clean, high-contrast layouts. Use a clear color palette: primary colors should be medical-inspired (e.g., deep greens, blues, teals) and neutral background tones (slates, grays).
- **Clear Information Hierarchy:** Important details such as price, availability status, and prescription requirements (OTC vs Rx) must be highly visible and styled distinctly.
- **Mobile-First Responsive Design:** The catalog and checkout experiences must be highly optimized for mobile devices (minimum width 320px).

## User Experience (UX)
- **Zero Friction Search:** The search bar should be easily accessible, fast, and tolerant of typos/various spelling formats.
- **Explicit Availability Statuses:**
  - **In Stock:** Show a clear green badge/indicator.
  - **Out of Stock:** Grey out the product card, disable the "Add to Cart" button, and display a "Notify Me" or "Out of Stock" status.
  - **Running Low:** Show an amber warning badge when stock is less than 5 units.
- **Streamlined Checkout:** Keep the reservation flow to a minimum number of steps. Display clear feedback upon successful reservation.

## Development & Accessibility (A11y)
- **Accessibility:** Interactive elements must have proper ARIA attributes, semantic HTML tags, and support keyboard navigation.
- **Error Handling:** Form validations must fail gracefully with inline, assistive error messages.

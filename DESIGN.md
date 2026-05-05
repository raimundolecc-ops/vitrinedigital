---
name: Local Commerce Modern
colors:
  surface: '#f5fbf5'
  surface-dim: '#d5dcd6'
  surface-bright: '#f5fbf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff5ef'
  surface-container: '#e9efe9'
  surface-container-high: '#e4eae4'
  surface-container-highest: '#dee4de'
  on-surface: '#171d19'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#2c322e'
  inverse-on-surface: '#ecf2ec'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#595c5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#727577'
  on-tertiary-container: '#fbfdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f5fbf5'
  on-background: '#171d19'
  surface-variant: '#dee4de'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 16px
  gutter: 12px
---

## Brand & Style
The design system is engineered to foster trust and facilitate effortless local discovery. It targets users looking for quality and reliability in their immediate community. The aesthetic is **Corporate Modern** with a strong **Minimalist** influence, prioritizing content clarity over decorative elements. 

The emotional response should be one of "effortless reliability"—the UI acts as a transparent window to the products, using generous whitespace and a refined color palette to reduce cognitive load. The style emphasizes precision and high-quality product photography to elevate local merchants to a professional standard.

## Colors
The palette is centered around **Emerald Green**, chosen for its associations with growth, stability, and professional reliability. This primary color is used sparingly for key actions and brand moments.

The neutral palette utilizes a **Slate-inspired range** of grays. Backgrounds use very light tints to create subtle separation between sections without the harshness of pure white. Text uses a deep Navy-Slate for high legibility and a sense of established authority.

## Typography
This design system utilizes **Manrope** for its modern, balanced proportions and exceptional legibility across mobile screens. The scale is designed to create a clear information hierarchy, moving from tight, bold headlines to airy, readable body copy.

- **Headlines:** Use a slightly tighter letter-spacing to create a "blocky," professional feel.
- **Body Copy:** Maintains a standard line height to ensure long product descriptions remain scannable.
- **Labels:** Utilized for categories and metadata, often employing a medium weight to distinguish from body text.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile devices, transitioning to a centered, max-width container (1200px) for desktop viewing. 

A strict **8px spacing rhythm** ensures vertical consistency. On mobile, the system uses a 16px outer margin to provide a safe "breathing room" for thumbs while maximizing screen real estate for product images. Vertical gaps between catalog cards should be consistently 12px or 16px to maintain a rhythmic flow during scrolling.

## Elevation & Depth
Depth is conveyed through **Ambient Shadows** and a **Tonal Layering** system. This design system avoids heavy shadows, instead using extremely soft, large-radius blurs with low opacity (4-8%) to suggest that elements are gently floating above the canvas.

- **Level 1 (Base):** Product cards and input fields. Uses a 1px border with a soft shadow.
- **Level 2 (Active/Floating):** Navigation bars and bottom sheets. Uses a more pronounced shadow to indicate it sits above the catalog.
- **Level 3 (Modals):** High-contrast overlay to dim the background, focusing entirely on the interaction.

## Shapes
The shape language is defined by **Rounded (0.5rem to 1rem)** corners. This removes the "sharpness" of corporate software while maintaining more structure than a pill-shaped system.

- **Primary Buttons:** 0.5rem (8px) for a sturdy, clickable feel.
- **Product Cards:** 1rem (16px) to frame imagery softly.
- **Search Inputs:** 0.5rem (8px) to align with the button language.
- **Image Containers:** Always inherit the parent card's radius or use a slightly smaller internal radius.

## Components

### Buttons
Primary buttons are high-contrast Emerald Green with white text. Secondary buttons use a Slate-100 background with Slate-900 text. Ensure a minimum touch target of 48px for all mobile interactions.

### Cards
Product cards are the core of the catalog. They feature a 1:1 aspect ratio image container at the top, followed by a vertical stack of Title (Headline-md), Price (Label-md, Primary Color), and Location (Label-sm, Neutral). Shadows are only applied to the container, not the image.

### Input Fields
Search bars and text inputs use a light gray fill (#F1F5F9) and a 1px border. On focus, the border transitions to the Primary Emerald Green. Use clear icons for "Search" and "Clear" to assist user flow.

### Chips & Tags
Use chips for categories (e.g., "Organic," "Local," "Sale"). These should be low-profile with a light tint of the primary color and no shadows, ensuring they don't compete with the main product imagery.

### List Items
For settings or non-visual data, use clean list rows with 16px padding and a subtle 1px divider. Each row should have a chevron to indicate a drill-down action.
# Design System

**Stack:** Tailwind CSS 4.1.x + shadcn/ui (Radix primitives) + Lucide React icons

---

## 1. Colors

**Primary Palette (INFERRED from Tailwind classes used in components):**

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#2563eb` (blue-600) | Primary buttons, links, active states |
| `--primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--secondary` | `#f1f5f9` (slate-100) | Secondary buttons, card backgrounds |
| `--secondary-foreground` | `#1e293b` (slate-800) | Text on secondary backgrounds |
| `--accent` | `#f8fafc` (slate-50) | Accent backgrounds, hover states |
| `--accent-foreground` | `#1e293b` (slate-800) | Text on accent backgrounds |
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#0f172a` (slate-900) | Primary text color |
| `--card` | `#ffffff` | Card background |
| `--card-foreground` | `#0f172a` (slate-900) | Card text |
| `--muted` | `#f1f5f9` (slate-100) | Muted backgrounds |
| `--muted-foreground` | `#64748b` (slate-500) | Muted text |
| `--destructive` | `#ef4444` (red-500) | Error states, delete actions |
| `--border` | `#e2e8f0` (slate-200) | Borders, dividers |
| `--input` | `#e2e8f0` (slate-200) | Input borders |
| `--ring` | `#2563eb` (blue-600) | Focus rings |

**Category Colors (INFERRED — each category may have a distinct color):**

| Category | Likely Color |
|----------|-------------|
| Houseboat | Blue |
| Shikara | Teal/Cyan |
| Artisan | Amber/Orange |
| Guide | Green |
| Vendor | Purple |

---

## 2. Typography

**Font Family:** Geist (via `next/font/google`)
- Sans-serif, modern geometric typeface
- Weights used: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Scale (INFERRED from Tailwind defaults):**

| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| h1 | text-4xl (2.25rem / 36px) | 700 | 2.5rem |
| h2 | text-3xl (1.875rem / 30px) | 600 | 2.25rem |
| h3 | text-2xl (1.5rem / 24px) | 600 | 2rem |
| h4 | text-xl (1.25rem / 20px) | 600 | 1.75rem |
| Body | text-base (1rem / 16px) | 400 | 1.5rem |
| Small | text-sm (0.875rem / 14px) | 400 | 1.25rem |
| XS | text-xs (0.75rem / 12px) | 400 | 1rem |

---

## 3. Spacing

**Based on Tailwind's default spacing scale:**
- `p-4` (1rem) = standard card padding
- `p-6` (1.5rem) = generous card/section padding
- `gap-4` (1rem) = standard grid gap
- `gap-6` (1.5rem) = large grid gap
- `space-y-4` (1rem) = vertical stack spacing
- `space-y-6` (1.5rem) = vertical section spacing
- `m-0` = reset margins

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 0.25rem (4px) | Inputs, small elements |
| `rounded-md` | 0.375rem (6px) | Default button radius |
| `rounded-lg` | 0.5rem (8px) | Cards, dialogs |
| `rounded-xl` | 0.75rem (12px) | Large cards, modals |
| `rounded-full` | 9999px | Badges, avatars |

---

## 5. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle card elevation |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Dialog, elevated cards |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Full-screen overlays |

---

## 6. Component Variants (shadcn/ui)

### Button
| Variant | Classes | Usage |
|---------|---------|-------|
| default | bg-primary text-primary-foreground | Primary CTA |
| secondary | bg-secondary text-secondary-foreground | Secondary action |
| outline | border border-input bg-background | Tertiary action |
| ghost | hover:bg-accent hover:text-accent-foreground | Subtle action |
| destructive | bg-destructive text-destructive-foreground | Delete/remove |
| link | text-primary underline-offset-4 | Text link |

### Badge
| Variant | Usage |
|---------|-------|
| default | Status indicator |
| secondary | Category tag |
| destructive | Error/alert |
| outline | Counter badge |

### Card
- `card` — white background, rounded-lg, shadow-sm, border
- `card-header` — padding, flex layout
- `card-title` — text-lg, semibold
- `card-description` — text-sm, muted
- `card-content` — padding
- `card-footer` — padding, flex, items-center

---

## 7. Layout Patterns

### Page Shell
```
┌──────────────────────────────────────┐
│  Header (optional)                   │
├──────────────────────────────────────┤
│                                      │
│  Page Content (max-w-7xl mx-auto)    │
│  ┌──────────────┐ ┌──────────────┐  │
│  │   Card        │ │   Card       │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
├──────────────────────────────────────┤
│  Footer                              │
└──────────────────────────────────────┘
```

### Portal Sidebar (Dashboard)
```
┌──────────┬───────────────────────────┐
│ Sidebar  │  Main Content             │
│ (w-64)   │                           │
│          │  Dashboard / Edit Form    │
│ Nav:     │                           │
│ • Dashbd │                           │
│ • Edit   │                           │
│ • View   │                           │
│ • Logout │                           │
└──────────┴───────────────────────────┘
```

### Operator Card
```
┌─────────────────────────┐
│ [Photo]                 │
│                         │
│ Name              ⭐ ⭐ ⭐ │
│ Short Description       │
│ 🏷️ Badge               │
│                         │
│ [View] [WhatsApp]       │
└─────────────────────────┘
```

---

## 8. Animation & Transitions

- `transition-colors` — color transitions on buttons and links
- `hover:scale-105` — card hover scale (INFERRED)
- `animate-in` / `fade-in` — dialog/sheet entrance (shadcn defaults)
- Loading skeletons use `animate-pulse` (Tailwind)
- Toast notifications use Sonner's built-in animations

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

**Grid behavior:**
- Mobile: 1 column (operator cards)
- Tablet: 2 columns
- Desktop: 3 columns
- Wide: 4 columns

---

## 10. Icons

**Library:** Lucide React
**Common icons used (INFERRED from imports):**
- `IconHome`, `IconSailboat`, `IconPalette`, `IconMapPin`, `IconShoppingBag` — Categories
- `IconSearch` — Search bar
- `IconMap` — Near Me / Map
- `IconPhone`, `IconMessageCircle` — Contact actions
- `IconStar` — Ratings
- `IconChevronLeft`, `IconChevronRight` — Navigation
- `IconMenu`, `IconX` — Mobile menu toggle
- `IconUpload` — Photo upload
- `IconUser`, `IconSettings` — Dashboard
- `IconLogOut` — Sign out

---

## 11. Tailwind CSS Configuration

**File:** `postcss.config.mjs` (PostCSS config for Tailwind v4)

**Key classes used across components:**
```
Layout:    container, max-w-7xl, mx-auto, px-4, py-8
Flex:      flex, flex-col, flex-row, items-center, justify-between
Grid:      grid, grid-cols-1, md:grid-cols-2, lg:grid-cols-3, gap-6
Spacing:   p-4, p-6, space-y-4, space-y-6, gap-4, gap-6
Typography: text-3xl, text-2xl, text-xl, text-lg, text-base, text-sm
Buttons:   inline-flex, items-center, justify-center, rounded-md, font-medium
Cards:     rounded-lg, border, bg-card, shadow-sm
Images:    object-cover, rounded-lg, aspect-video
States:    hover:bg-*, focus:ring-2, focus:ring-ring, disabled:opacity-50
Animations: animate-pulse (skeleton)
```

---

## 12. Dark Mode

**Status:** ❌ Not implemented — light mode only. No `dark:` variants found in codebase.

# Design Tokens

All three themes share the same **structure** (same token names, same component shapes); they differ in values. Implement as CSS custom properties scoped to a `[data-theme]` attribute on `<html>` or `<body>` so a theme switch is a single attribute change.

```html
<html data-theme="clean">  <!-- or "dark" or "club" -->
```

```css
:root[data-theme="clean"] { --color-bg: #F6F5F1; … }
:root[data-theme="dark"]  { --color-bg: #0B0D12; … }
:root[data-theme="club"]  { --color-bg: #F2EBDA; … }
```

---

## Themes overview

| | Чисто (`clean`) | Турнир (`dark`) | Клуб (`club`) |
| --- | --- | --- | --- |
| Mood | Clean minimal, light | Dark premium, neon | Warm classic, serif |
| Heading font | Geist | Geist | Instrument Serif |
| Body font | Geist | Geist | Geist |
| Mono font | Geist Mono | Geist Mono | Geist Mono |
| Accent | Emerald `#0E6B3B` | Chalk blue `#6BB1F5` | Felt green `#1A4D33` |
| iOS status bar | light icons false (dark glyphs) | true (light glyphs) | false |
| Default | **YES** | optional | optional |

---

## Color tokens (per theme)

### Чисто — `clean`

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#F6F5F1` | App background |
| `--color-surface` | `#FFFFFF` | Cards, sheets, inputs |
| `--color-surface-alt` | `#F2F1EC` | Subtle fills, chips |
| `--color-text` | `#15171A` | Primary text |
| `--color-text-muted` | `#6E7178` | Secondary text, labels |
| `--color-text-faint` | `#A4A6AB` | Tertiary text, past items |
| `--color-border` | `rgba(20,22,26,0.08)` | Hairline borders |
| `--color-border-strong` | `rgba(20,22,26,0.14)` | Heavier borders, handles |
| `--color-accent` | `#0E6B3B` | Primary accent (CTAs, badges, active states) |
| `--color-accent-soft` | `#E3F1E8` | Tinted accent surface |
| `--color-accent-text` | `#0A4F2B` | Accent text on tinted surface |
| `--color-danger` | `#B23A48` | Destructive |
| `--color-warn` | `#B5752A` | Weekend numbers, "today" status |
| `--color-badge-bg` | `#0E6B3B` | Count badges, primary buttons |
| `--color-badge-text` | `#FFFFFF` | On badge / on accent |
| `--color-ball-8` | `#15171A` | 8-ball pip body |
| `--color-ball-9` | `#D4A437` | 9-ball pip body |
| `--color-ball-10` | `#1F5FB0` | 10-ball pip body |

### Турнир — `dark`

| Token | Value |
| --- | --- |
| `--color-bg` | `#0B0D12` |
| `--color-surface` | `#161922` |
| `--color-surface-alt` | `#1D2130` |
| `--color-text` | `#F2F4F8` |
| `--color-text-muted` | `#9098AB` |
| `--color-text-faint` | `#5D6478` |
| `--color-border` | `rgba(255,255,255,0.08)` |
| `--color-border-strong` | `rgba(255,255,255,0.14)` |
| `--color-accent` | `#6BB1F5` |
| `--color-accent-soft` | `rgba(107,177,245,0.14)` |
| `--color-accent-text` | `#9CCAFA` |
| `--color-danger` | `#F07178` |
| `--color-warn` | `#E7B33D` |
| `--color-badge-bg` | `#6BB1F5` |
| `--color-badge-text` | `#0B0D12` |
| `--color-ball-8` | `#F2F4F8` |
| `--color-ball-9` | `#E7B33D` |
| `--color-ball-10` | `#6BB1F5` |

### Клуб — `club`

| Token | Value |
| --- | --- |
| `--color-bg` | `#F2EBDA` |
| `--color-surface` | `#FBF6E9` |
| `--color-surface-alt` | `#EBE2CA` |
| `--color-text` | `#231C12` |
| `--color-text-muted` | `#6E5E47` |
| `--color-text-faint` | `#A99878` |
| `--color-border` | `rgba(35,28,18,0.10)` |
| `--color-border-strong` | `rgba(35,28,18,0.20)` |
| `--color-accent` | `#1A4D33` |
| `--color-accent-soft` | `#DDE6D4` |
| `--color-accent-text` | `#0F3622` |
| `--color-danger` | `#8E3A2A` |
| `--color-warn` | `#8B5A1B` |
| `--color-badge-bg` | `#1A4D33` |
| `--color-badge-text` | `#FBF6E9` |
| `--color-ball-8` | `#231C12` |
| `--color-ball-9` | `#C19A35` |
| `--color-ball-10` | `#1A4D33` |

---

## Typography

Load via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

Token stack:

```css
--font-head:  "Geist", "Helvetica Neue", system-ui, sans-serif;     /* clean + dark */
--font-head:  "Instrument Serif", "Cormorant Garamond", Georgia, serif; /* club only */
--font-body:  "Geist", "Helvetica Neue", system-ui, sans-serif;
--font-mono:  "Geist Mono", ui-monospace, monospace;
```

### Type scale

| Role | Size | Weight | Family | Letter-spacing | Notes |
| --- | --- | --- | --- | --- | --- |
| Display (detail name, login title) | 24 px (clean/dark) · 30 px (club) | 700 · 500 club | head | -0.5 · 0 club | line-height 1.1 |
| Title (month, day in popup) | 26 px (control bar) · 22 px (popup) · 30 px club | 700 · 500 club | head | -0.6 · 0 club | nowrap on month |
| App name (in header) | 18 px clean/dark · 17 px club | 600 · 500 club | head | -0.3 · 0 club | nowrap |
| Section heading | 17 px | 600 | head | -0.2 | |
| Body | 14–15 px | 400–500 | body | normal | inputs, primary copy |
| Row title | 15 px | 600 | head | -0.2 | tournament rows |
| Row meta | 12 px | 500 | body | normal | time · club · city |
| Caption / label | 11 px | 600 | mono | 0.5 (uppercase) | section labels |
| Day-of-week header | 11 px | 500 | mono | 0.5 (uppercase) | calendar grid |
| Day number (calendar cell) | 13 px | 500 (700 today) | mono | normal | |
| Day number (list view) | 24 px | 600 | mono | tabular-nums | |
| Count badge | 11 px | 700 | mono | normal | tabular-nums |
| Start hour | 12 px | 400 | mono | tabular-nums | |
| Status pill (минал/днес/предстоящ) | 11 px | 600 | mono | 0.5 uppercase | |

### Letter-spacing & smoothing

- Sans headings: slight negative tracking (`-0.2` to `-0.6`), unless the theme is **Клуб**, where the serif sits at `0`.
- Body: `0`.
- Mono labels: `+0.5` and uppercase.
- Add `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;` globally.

---

## Spacing

Use a 4 px base unit. Common values used in the prototype:

| px | Use |
| --- | --- |
| 4 | tight inline gaps |
| 6 | chip vertical padding |
| 8 | small gap (between rows, chips) |
| 10 | medium gap |
| 12 | row padding, gap between groups |
| 14 | card inner padding |
| 16 | card outer padding |
| 18 | section horizontal padding (app gutter) |
| 22 | screen horizontal padding (detail) |
| 24 | section vertical spacing |
| 32 | screen vertical breathing |

App gutter (left/right of content) is **18 px**, except inside the detail screen which uses **22 px**.

---

## Radii

Per theme — the `club` theme uses smaller radii to feel more classic, the others use a softer rounded modern radius.

| Token | clean | dark | club | Use |
| --- | --- | --- | --- | --- |
| `--radius-sm` | 10 | 10 | 6 | day cells, small chips |
| `--radius-md` | 14 | 14 | 8 | cards, inputs, buttons, list rows |
| `--radius-lg` | 22 | 22 | 14 | sheet tops, large modals |
| pill | 999 | 999 | 999 | chips, status pills |

---

## Shadows

Mostly hairline borders rather than shadows. Where shadows are used:

| Use | Shadow |
| --- | --- |
| Sheet (bottom-sheet card) | `0 -8px 30px rgba(0,0,0,0.18)` |
| Confirm dialog | `0 20px 60px rgba(0,0,0,0.3)` |
| FAB | `0 6px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)` |
| Toggle thumb | `0 1px 3px rgba(0,0,0,0.18)` |

Borders are mostly `inset 0 0 0 1px var(--color-border)` so they don't shift layout.

---

## Iconography

All icons are 14–20 px stroked SVGs with `stroke-width="1.5"` to `2"` and `stroke-linecap="round"`. See `Icon` in `reference/screens.jsx` for the full set:

- `chevL`, `chevR`, `chevDown` — navigation
- `filter`, `plus`, `edit`, `trash`, `close`, `back`, `check`, `search`
- `user` (admin avatar)
- `clock`, `pin`, `cal`, `listIcon` (info icons)
- `shirt` (dress code), `handicap` (target)

Match the stroke widths and viewport sizes exactly when re-drawing — they read consistently across all three themes only because of these uniform line weights.

---

## Ball pip (visual specifier)

Each tournament shows a colored circle representing the ball type. This is one of the most distinctive visual elements — implement carefully.

- Outer disc: `--color-ball-{type}` (per theme).
- 8-ball: solid disc.
- 9-ball / 10-ball: striped — solid color top 28% + bottom 28%, white belt in the middle 44% (use `linear-gradient(180deg, c 0%, c 28%, #fff 28%, #fff 72%, c 72%, c 100%)`).
- Inset shine: `inset 0 0 0 1px rgba(0,0,0,0.08), inset (size*0.18)px (size*0.18)px 0 rgba(255,255,255,0.35)`.
- Center white circle (size × 0.55, font size × 0.42) containing the number `8` / `9` / `10` in mono, weight 700.
- The center number color: `8 → #fff` on the 8-ball; everything else `#15171A`.

Sizes used: 14, 18, 28, 56 px. The same component scales by `size` prop.

---

## Animations

| What | Duration | Easing |
| --- | --- | --- |
| Bottom sheet rise | 250 ms | `cubic-bezier(.2, .7, .3, 1)` |
| Full-screen push | 220 ms | `ease-out` (`opacity 0→1`, `translateX 8→0`) |
| Toggle thumb | 150 ms | linear |
| Segmented toggle | 150 ms | `background .15s, color .15s` |
| Day cell tap | 120 ms | `transform .12s` |

Reduce motion preference: respect `prefers-reduced-motion: reduce` and skip the slide-in transforms (jump-cut).

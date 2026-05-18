# Screens — Detailed breakdown

Eleven screens / overlays in total. All measurements assume a **402 × 874** viewport (iPhone 16-ish). The app is responsive within 360–420 dp width.

Screen surfaces (z-index order, bottom to top):

1. **Main shell** (header + control bar + calendar or list)
2. **Day popup** — bottom sheet
3. **Tournament detail** — full-screen push
4. **Filters** — bottom sheet, tall
5. **Admin login** — full-screen modal
6. **Tournament form** — full-screen push (add or edit)
7. **Confirm dialog** — centered modal

The first six are referenced in `INTERACTIONS.md`'s screen stack.

---

## 1. App header

Sticky at top, below the iOS status bar.

| Spec | Value |
| --- | --- |
| Height | 56 px |
| Padding | 10 px top / 12 px bottom / 18 px sides |
| Background | `--color-bg` |

**Left:** square 32×32 px logo at radius 8 with text "8/9" in mono 14/700 (color: `--color-badge-text` on `--color-accent`). Then app name "Билярд Турнири" (18 px head, 600). If admin mode active, a tiny uppercase mono caption underneath in `--color-accent`: "АДМИН РЕЖИМ".

**Right:** 36×36 round button with user icon. When not admin, opens login. When admin, taps log out.

---

## 2. Control bar

Sticky below header.

**Row 1 — month + today button**

- Left cluster: prev arrow (32×32), month title, next arrow.
- Month title: `BG.months[month] + " " + year`. Month in `--color-text`, weight 700 (500 in club). Year in `--color-text-muted`, weight 400. Inline-block, `white-space: nowrap`.
- Right: "Днес" pill — `--color-surface-alt` background, 12/600 body, padding 6/12 px.

**Row 2 — view toggle + filter button**

- Segmented toggle (flex: 1) with two segments: "Календар" (with calendar icon) / "Списък" (with list icon). Active segment uses `--color-accent` background and badge-text color.
- Filter button (36 px height, 12 px horizontal padding). When zero filters active: surface bg + 1 px border. When ≥ 1 filter active: accent bg + badge text + count number.

---

## 3. Calendar view

Below the sticky region.

- Day-of-week header row: Пн Вт Ср Чт Пт Сб Нд in mono 11/500 uppercase. Weekend (Сб, Нд) colored with `--color-warn`. Others `--color-text-faint`.
- 7-column grid, 4 px gap, 14 px horizontal padding.
- 6 rows × 7 cols = 42 cells (includes trailing/leading days from neighboring months at `opacity: 0.32`).

**Day cell**

| Spec | Value |
| --- | --- |
| Aspect ratio | 1 / 1.1 |
| Background | `--color-surface` (default), `--color-accent-soft` if today |
| Border | `inset 0 0 0 1px var(--color-border)`; `inset 0 0 0 1.5px var(--color-accent)` if today |
| Border radius | `--radius-sm` |
| Padding | 6 / 7 px |
| Number position | top-left, mono 13 px, 500 weight (700 if today). Past days: `--color-text-faint`. Weekend in-month: `--color-warn`. |
| Count badge | bottom-right, min-width 18, height 18, padding 0/5, radius 9, mono 11/700, tabular-nums, `--color-accent` bg + `--color-badge-text` (or `--color-surface-alt` / `--color-text-muted` if past) |

Cells without tournaments are non-interactive (cursor default). Cells with tournaments are buttons; tap → opens **day popup** for that date.

---

## 4. List view

Same sticky shell. Body is a column of day groups (gap 22 px).

**Day group header**

- Big day number left (mono 24/600 tabular-nums).
- Day-of-week label (BG.daysFull[(dow+6)%7]) in body 11/600 uppercase. Weekend → warn color.
- Below: status + count, body 11/400 in faint color: `"Предстоящ · 3 турнира"` etc.

**Row** (used in list view AND day popup)

A button row that takes the full width and opens the tournament detail on tap.

| Spec | Value |
| --- | --- |
| Background | `--color-surface` |
| Border | inset 1 px border-color |
| Radius | `--radius-md` |
| Padding | 12 / 14 px |
| Opacity | 0.72 if past |
| Layout | flex: ball pip (28 px) · text column · admin actions (if admin) |
| Title line | status dot (6 px) · name (head 15/600) · "· {version}" (mono 11/faint) |
| Meta line | start hour (mono 12, tabular) · "·" · club · "·" · city — all body 12 / `--color-text-muted` |

When admin: append a 2-cell vertical strip on the right with edit (top) and trash (bottom) icon buttons, each 40 wide, divider between them.

Empty state (no results in month): centered "Няма турнири" in body 14, muted color.

---

## 5. Day popup (bottom sheet)

Triggered by tapping a calendar day cell that has tournaments.

- Backdrop: `rgba(0,0,0,0.32)` with 2 px blur, fills the unfilled space above the sheet.
- Sheet: full width, max height 75%, radius-lg top corners, `--color-bg` background, `0 -8px 30px rgba(0,0,0,0.18)` shadow, 42 px bottom padding for home indicator.
- Drag handle: 40 × 4 px pill in border-strong color, centered at top with 8/6 px padding.
- Header content (padding 4/22/0):
  - Caption: `Предстоящ` / `Минал` / `Днес` in mono 11/600 uppercase, muted.
  - Title: "Събота, 16 май" in head 22/700 (28/500 club), `--color-text`. Long format: `daysFull[dow]`, `dayN`, `months[m].toLowerCase()`.
  - Subtitle: "3 турнира" in body 13, muted.
- Body: vertical list of Row components (16/18 px padding, 8 px gap, max-height 380 px scroll).
- Admin tail: "+ Добави турнир" dashed button (1.5 px dashed border-strong, accent text).
- Animation: `transform: translateY(100%) → 0` over 250 ms easing-out.
- Tap backdrop → close.

---

## 6. Tournament detail (full-screen push)

Pushed over main view. Full opaque `--color-bg` background.

**Top bar** (54 px top + 8 px bottom padding, 14 px sides)
- Left: "Назад" pill — back chevron + label, surface bg, body 14/500.
- Right: status pill — mono 11/600 uppercase, color depends on state:
  - Past → faint text on surface-alt
  - Today → warn text on rgba warn-12%
  - Upcoming → accent-text on accent-soft

**Hero** (padding 10/22/22)
- Ball pip 56 px + column:
  - Caption: "9-Бол · Издание Q1" in mono 11/600 uppercase, muted.
  - Name: head 24/700 (30/500 club), wrap.

**Date / time card** — 2-column grid

| Date | Start hour |
| --- | --- |
| cal icon + "Дата" label | clock icon + "Начален час" label |
| "Събота, 16 май" (head 15/600) | "18:00" (mono 15/600 tabular) |

Border: `inset 0 0 0 1px var(--color-border)`, radius-md, faint vertical divider between cells.

**Location card** — pin icon (accent) + club name (head 17/600) + city (body 13 muted).

**Details card** — three key-value rows: Ниво / Хандикап / Дрескод. Last row no bottom border. The icon and value are in `--color-accent` when toggle is true.

**Admin tail** — flex row of "Редактирай" (full-width accent button, edit icon) + "Изтрий" (outline danger button, trash icon). 24 px top margin.

---

## 7. Filters sheet (bottom sheet, tall)

Same Sheet container as day popup but `fullHeight=true` (max-height = device height - 40).

**Header** (4/18/14 padding):
- Left: "Изчисти всички" — body 14, muted color, transparent.
- Middle: "Филтри" — head 18/600.
- Right: "Готово" — body 14/600, accent color.

**Body** (scrollable, 18 px sides, 18 px bottom):

Eight filter groups, gap 18 px between. Each group has a mono 11/600 uppercase label, then the controls below.

1. **Търси** — text input with search icon (left padding 36 px). Placeholder "Търси по име или клуб…". Filters both `name` and `club` substring, case-insensitive.
2. **Вид** — three equal-flex pills with ball pip + label. Multi-select.
3. **Ниво** — three pills (Про / Аматьор / Смесен). Multi-select.
4. **Дни** — three pills (Всички / Работни / Уикенди). Single-select.
5. **Хандикап** — three pills (Всеки / Да / Не). Single-select.
6. **Дрескод** — three pills (Всеки / Да / Не). Single-select.
7. **Град** — wrap-flex of city chips (compact 6/11 px padding). Multi-select.
8. **Клуб** — wrap-flex of club chips. Multi-select.

Chip active state: `--color-accent` bg + `--color-badge-text`, no border. Inactive: `--color-surface` bg + inset 1 px border, `--color-text` color.

---

## 8. Admin login (full-screen modal)

- Top bar: only a close button on the right (round 36 px, surface bg).
- Body, vertically centered:
  - 64 × 64 logo square, radius 18, accent bg, mono 24/700 "8/9".
  - Title: head 26/700 (30/500 club) — "Вход за администратори".
  - Subtitle: body 13 muted — "Само одобрени потребители могат да управляват турнирите."
  - Username field — labeled "Потребител", input default "admin".
  - Password field — labeled "Парола", input default "••••••••".
  - Login button — accent bg, badge-text color, body 15/600, 13 px padding, radius-md.

Field component: mono 11/600 uppercase label, then surface input with inset border, body 15 text, 12/14 px padding.

In prototype any credentials succeed. In production wire to real auth.

---

## 9. Tournament form (full-screen push)

Used for both add and edit.

- Top bar: "Отказ" (left, muted body 15) · "Нов турнир" or "Редакция" (center, head 16/600) · "Запази" (right, body 15/700, accent — faint if name is empty).
- Body fields, in order, gap 12–14 px:

| Field | Control |
| --- | --- |
| Име | text input |
| Издание | text input |
| Вид | 3 pill buttons (ball pip + label) — single-select |
| Ниво | 3 pill buttons — single-select |
| Град | native select (down chevron) populated from CITIES |
| Клуб | native select populated from CLUBS |
| Дата + Начален час | 2-column row (1.4fr / 1fr); both text inputs |
| Хандикап | toggle row (icon + label + iOS-style switch) |
| Дрескод | toggle row |

- Bottom (edit only): outline danger "Изтрий" button full-width, 24 px top margin.

**Toggle row** — surface bg, radius-md, inset border, 12/14 padding. Icon left (accent when on, muted when off). Label flex: 1, body 15/500. Switch right: 44 × 26 px track, 22 × 22 thumb with `0 1px 3px` shadow; track switches between `--color-surface-alt` (off) and `--color-accent` (on), thumb slides 150 ms.

---

## 10. Confirm dialog (centered modal)

Centered card over backdrop `rgba(0,0,0,0.45)` with 2 px blur.

- Card: max-width 320, padding 20/22/16, `--color-bg`, radius-lg, `0 20px 60px rgba(0,0,0,0.3)` shadow.
- Title: head 17/600.
- Body: body 13 muted, 1.5 line-height.
- Buttons row: "Отказ" surface (left) + destructive accent (right), each flex: 1.

Body for delete confirmation: title "Изтриване на турнир?", body "Това действие е необратимо.", confirm label "Изтрий".

---

## 11. FAB (admin only)

Floating action button on main view (calendar + list), bottom-right, 50 px from bottom, 20 px from right.

- 56 × 56, radius 28, `--color-accent` bg, badge text, plus icon 22 px.
- Shadow: `0 6px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)`.
- Hidden when any sheet/screen is open.

---

## Touch targets

Every tappable element ≥ 44 × 44 px hit area. Calendar day cells are smaller visually but still meet the threshold given the 4 px gap. Inline edit/trash icons have a 40 px hit area each.

## Accessibility

- All icon-only buttons need a Bulgarian `aria-label`. Sample mapping in `INTERACTIONS.md`.
- Color contrast: every text/background pair in the tokens meets WCAG AA — verify if you adjust.
- Focus visible: 2 px accent outline at 2 px offset.
- The popup, filters sheet, login, form, and dialog are modal; trap focus and add an Escape-to-close handler on each (Escape pops the top of the screen stack).

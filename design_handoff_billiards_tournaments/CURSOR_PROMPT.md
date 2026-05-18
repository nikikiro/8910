# Cursor Agent Prompt — Billiards Tournaments App

Copy everything below into Cursor's agent chat as your first message. Adjust the **Target stack** section if you already have a codebase.

---

## Prompt

You are implementing a production mobile web app called **Билярд Турнири** (Billiards Tournaments). The full design, copy, and interaction spec lives in `design_handoff_billiards_tournaments/`. Treat that folder as the source of truth.

### Critical context

- **Language: Bulgarian only.** All UI copy is in `reference/data.js` as the `BG` object. Use it verbatim — do not translate to English or invent Bulgarian.
- **The HTML/JSX in `reference/` is a design prototype**, not production code. Do not copy files wholesale. Reimplement in our codebase's conventions.
- **Three themes are designed.** Implement all three (`clean`, `dark`, `club`) as switchable theme objects driving CSS custom properties. Ship `clean` as default.
- **Week starts Monday.** Use Monday-first day-of-week ordering everywhere.
- **Mobile-first.** Target viewport 360–420 dp width. Desktop is out of scope but should not break.

### Target stack

> Replace this section with your real choice if you have an existing codebase. Default recommendation below.

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** CSS Modules + CSS custom properties for tokens
- **Routing:** React Router 6
- **Date utils:** `date-fns` with `bg` locale
- **State:** local + `useReducer`; no global store needed
- **Backend:** mock with `MSW` or a JSON file initially; abstract behind a `tournamentsService` so a real REST API can swap in

### Build order

Implement strictly in this order. After each step, run the app and confirm it matches `reference/Billiards Tournaments.html` (open it in a browser side-by-side).

1. **Project scaffold + theme tokens.**
   - Set up the stack above.
   - Implement the three themes from `DESIGN_TOKENS.md` as objects + CSS custom property layers.
   - Add a `<ThemeProvider>` that writes tokens to `:root` and exposes a hook.

2. **Data model + service.**
   - Implement the `Tournament` TypeScript type from `DATA_MODEL.md`.
   - Build a `tournamentsService` with: `list()`, `byMonth(year, month)`, `create()`, `update()`, `delete()`.
   - Seed with the 30 sample tournaments from `reference/data.js` (`TOURNAMENTS` array).
   - Implement `tournamentMatchesFilters(t, filters)` per `DATA_MODEL.md`.

3. **App shell + navigation.**
   - One screen at a time, no router yet — manage with a screen-stack reducer (see `INTERACTIONS.md`).
   - Top-level `AppHeader` (app name + admin button) and `ControlBar` (month nav, view toggle, filter icon).
   - Sticky top region; scrollable content below.

4. **Calendar view.**
   - 7-column grid, Monday-first, with leading/trailing days from neighboring months dimmed.
   - Day cell: number top-left, count badge bottom-right (only if > 0).
   - Today: tinted background + accent border.
   - Weekend numbers in warn color; past days in muted text.
   - Tap a day with badge → opens day popup.

5. **List view.**
   - Groups within the visible month, sorted by date asc, then `startHour` asc.
   - Per-day header: big day number + day-of-week + count + status (past/today/upcoming).
   - Row: ball pip + name + version + start hour + club + city.
   - Past tournaments dimmed (opacity 0.72).
   - Empty state if zero results.

6. **Day popup (bottom sheet).**
   - Triggered from calendar day tap.
   - Header: date in long Bulgarian format ("Събота, 16 май") + tournament count.
   - Body: same row component as list view.
   - Slide-up animation; backdrop tap dismisses.

7. **Tournament detail (full-screen push).**
   - Back chevron + status badge top.
   - Hero: ball pip + type + version + name.
   - Date/time card (two-up grid).
   - Location card (pin icon + club name + city).
   - Details card: level, handicap, dress code (key-value rows).

8. **Filters sheet (bottom sheet, tall).**
   - Search input (matches `name` and `club`, case-insensitive).
   - Type chips (8 / 9 / 10) — multi-select.
   - Level chips (Про / Аматьор / Смесен) — multi-select.
   - Day-kind chips (Всички / Работни / Уикенди) — single-select.
   - Handicap chips (Всеки / Да / Не) — single-select.
   - Dress-code chips — same.
   - City chips — multi-select, from `CITIES`.
   - Club chips — multi-select, from `CLUBS`.
   - Header: "Изчисти всички" (left) · "Филтри" (title) · "Готово" (right).

9. **Admin login.**
   - Username + password fields, login button.
   - In prototype any credentials succeed; in production hit a real auth endpoint.
   - On success, set admin state in app; persist to `localStorage`.

10. **Admin actions.**
    - FAB (+) on main view (calendar/list).
    - Inline edit/delete icons on every list & popup row.
    - Edit/delete buttons on tournament detail.
    - All deletes go through the `ConfirmDialog`.

11. **Tournament form (add/edit).**
    - Full-screen push.
    - Header: Отказ (left) · Нов турнир / Редакция (title) · Запази (right, disabled until name is non-empty).
    - All fields from `Tournament` type, native inputs.
    - Toggle rows for `handicap` and `dressCode`.
    - Delete button at bottom only when editing existing.

12. **Polish pass.**
    - Verify all 11 screens against `SCREENS.md`.
    - Animations match `INTERACTIONS.md`.
    - Hit-targets ≥ 44 px.
    - VoiceOver labels on icon-only buttons.

### Done-when

- All 30 sample tournaments render correctly in May & June 2026.
- Calendar count badges accurately reflect filtered tournaments.
- Filters update both calendar and list views live.
- Admin can create a new tournament, see it appear on the calendar, edit, delete.
- All copy matches `BG` strings exactly — no English leaks.

### Rules

- Read `SCREENS.md` before implementing each screen.
- Match the colors, font sizes, spacing, and radii in `DESIGN_TOKENS.md` exactly.
- Match the copy in `data.js → BG` exactly. If you need a string not present, ask before inventing one.
- Don't pull in heavy UI libraries (no MUI, no Chakra). Hand-roll components against the tokens.
- One commit per build-order step.

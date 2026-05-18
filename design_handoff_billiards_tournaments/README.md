# Handoff — Билярд Турнири (Billiards Tournaments)

A mobile web app in **Bulgarian** that lists 8/9/10-ball billiards tournaments on a monthly calendar, with full admin CRUD.

---

## How to use this handoff

1. Open `CURSOR_PROMPT.md` and paste it into Cursor's agent panel as your first message.
2. Drag the entire `design_handoff_billiards_tournaments/` folder into your Cursor workspace so the agent can read `reference/` for visuals.
3. Tell Cursor which framework to target (React + Vite, Next.js, React Native + Expo, Flutter, etc.) — see "Target stack" below.
4. Iterate per screen using `SCREENS.md`.

---

## About the design files

The files in `reference/` are **design references created in HTML/JSX as a prototype** — they show the intended look, copy, and behavior. They are **not** production code to copy directly. Recreate the experience in your own codebase using its existing patterns, components, and styling conventions. If there is no existing codebase yet, pick a sensible mobile-first stack (e.g. **React + Vite + TypeScript + CSS Modules**, or **Next.js App Router**, or **React Native + Expo**) and implement there.

`reference/Billiards Tournaments.html` is the entry point; it loads `data.js`, `themes.js`, `screens.jsx`, `app.jsx`, plus the iOS frame and design-canvas wrappers (the latter two are only for the side-by-side presentation — **drop them in production**).

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, copy, and interactions are final. Reproduce them pixel-perfectly inside the target stack's idioms. Three theme variants are provided — ship one as default and expose the others via a theme switcher if useful.

---

## Scope of the feature

A single-purpose mobile web app with two top-level views and three modal/sheet/screen flows on top.

**User-facing**
- Calendar view (default) — current month grid with a count badge on each day that has tournaments.
- List view — chronological list, grouped by day, within the visible month.
- Month nav — prev/next/today; landing month is current month.
- Day popup — tap a day with badge → bottom sheet with that day's tournaments.
- Tournament detail — tap a tournament from day popup or list → full-screen detail.
- Filters sheet — multi-faceted filter (search, type, level, day-kind, handicap, dress code, city, club).

**Admin (after login)**
- Add / edit / delete tournaments.
- FAB (+) on main view + inline edit/delete icons on every list/popup row + bottom edit/delete on detail.
- Login is a simple username/password screen; any credentials succeed in the prototype.

---

## Target stack recommendation

If you have a stack already, use it. Otherwise, recommended:

| Concern | Choice |
| --- | --- |
| Framework | React 18 + Vite + TypeScript |
| Styling | CSS Modules with theme tokens via CSS custom properties OR `vanilla-extract` (one source of truth for the three themes) |
| Router | React Router 6 (or none — manage screens via state, like the prototype) |
| Forms | Native inputs; no library needed for this scale |
| Date utils | `date-fns` with `bg` locale, or hand-rolled (prototype is hand-rolled) |
| State | Local component state + `useReducer` for the screen stack; persist via `localStorage` or a real API |
| Backend | Bring your own — see "Data model" |
| i18n | Hard-code Bulgarian strings (see `data.js → BG`); wire into i18next only if multi-lingual is on the roadmap |

---

## Locale

Hard-coded **Bulgarian (bg-BG)**. Week starts **Monday**. All copy and sample data are in Bulgarian. Don't localize cities/clubs — they are proper nouns. The `BG` object in `reference/data.js` is the canonical string table; copy it verbatim.

---

## Data model

```ts
// One tournament. id is server-generated; everything else is editable in admin.
type Tournament = {
  id: number;
  name: string;                    // free text, e.g. "Sofia Spring Open"
  version: string;                 // free text identifier — "1", "2", "Q1", "F" etc.
  type: 8 | 9 | 10;                // ball type
  level: "pro" | "amateur" | "both";
  handicap: boolean;
  city: string;                    // see CITIES list in data.js
  club: string;                    // see CLUBS list in data.js
  date: string;                    // ISO "YYYY-MM-DD" (no time component)
  startHour: string;               // "HH:MM" 24h
  dressCode: boolean;
};
```

Bulgarian display labels for enums:
- `type` → "8-Бол" / "9-Бол" / "10-Бол"
- `level` → "Про" / "Аматьор" / "Смесен"
- `handicap` / `dressCode` → "Да" / "Не"

---

## File map (`reference/`)

| File | What it is |
| --- | --- |
| `Billiards Tournaments.html` | Prototype entry — three theme variants on a design canvas |
| `app.jsx` | `BilliardsApp` — top-level state + screen stack |
| `screens.jsx` | All screens + helpers + icons (≈ 1000 lines) |
| `data.js` | Bulgarian string table `BG`, sample `TOURNAMENTS`, `CITIES`, `CLUBS`, `TODAY` |
| `themes.js` | Three theme objects: `clean`, `dark`, `club` |
| `ios-frame.jsx` | iOS device bezel — **drop in production** |
| `design-canvas.jsx` | Side-by-side canvas wrapper — **drop in production** |
| `tweaks-panel.jsx` | In-design tweaks UI — **drop in production** |

---

## Read next

- `CURSOR_PROMPT.md` — copy-paste prompt for Cursor's agent
- `DESIGN_TOKENS.md` — colors, typography, spacing, radii, all three themes
- `SCREENS.md` — every screen broken down: layout, components, copy, states
- `INTERACTIONS.md` — navigation graph, state machine, animations
- `DATA_MODEL.md` — types, sample data, filter logic

---

## Notes from the designer

- Three visual directions are provided — pick one to ship. **Чисто** is the safest default; **Турнир** suits dark-mode-first audiences; **Клуб** suits a more premium, traditional club brand.
- The prototype renders **inside an iOS device frame** purely for presentation. The actual app is a responsive mobile web app — viewport target 360–420 dp width.
- Today's date in the prototype is **May 17, 2026** (override via `TODAY` in `data.js`). Replace with the real `new Date()` in production.

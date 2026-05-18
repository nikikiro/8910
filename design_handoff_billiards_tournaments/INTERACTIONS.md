# Interactions & Navigation

## Top-level state

```ts
type AppState = {
  // Selected view in the main shell
  view: "cal" | "list";
  // Visible month
  cursor: { y: number; m: number }; // m is 0-indexed
  // Tournaments (loaded from service; mutable in admin)
  tournaments: Tournament[];
  // Active filters
  filters: Filters;
  // Stack of overlay screens above the main shell, top is rendered last
  stack: OverlayKind[];
  // What the currently-open day popup is showing (null = closed)
  selectedDate: Date | null;
  // What the currently-open detail/form is targeting
  selectedTournament: Tournament | null;
  editingDraft: Tournament | null;
  // Confirm dialog
  pendingDelete: Tournament | null;
  // Auth
  isAdmin: boolean;
};

type OverlayKind = "filters" | "login" | "form" | "detail";
```

## Screen stack

The `stack` is an array of overlay kinds; the last entry is what's visible on top. Multiple overlays can coexist (e.g. detail under a delete confirm dialog).

Operations:
- `push(kind)` appends.
- `pop()` removes the top.
- `popKind(kind)` filters out the given kind (used for filters/login which can be dismissed individually).

The day popup is **not** in the stack — it's controlled by `selectedDate`. The confirm dialog is **not** in the stack — it's controlled by `pendingDelete`. Both live "above" whatever else is showing.

## Navigation graph

```
Main shell ──tap day with badge──▶ Day popup
                                        │
                                        ├──tap row──▶ Tournament detail
                                        │                   │
                                        │                   ├─(admin)─▶ Form (edit)
                                        │                   └─(admin)─▶ Confirm dialog ──confirm──▶ pop detail
                                        └─(admin)─▶ "+ Добави" ──▶ Form (new, date pre-filled)

Main shell ──tap user icon──▶ Login ──success──▶ isAdmin=true, close
                          ──(admin)──▶ logout (no screen)

Main shell ──tap filter button──▶ Filters sheet
Main shell ──tap FAB (admin)──▶ Form (new)

List row ──tap──▶ Tournament detail
List row ──tap edit icon (admin)──▶ Form (edit)
List row ──tap trash icon (admin)──▶ Confirm dialog
```

Hardware back / swipe-back should pop the top of the stack. If stack is empty, dismiss `selectedDate` first, then `pendingDelete`.

## State transitions

```ts
// Month nav
goPrev = (s) => ({ ...s, cursor: s.cursor.m === 0
  ? { y: s.cursor.y - 1, m: 11 }
  : { y: s.cursor.y, m: s.cursor.m - 1 } });
goNext = symmetric
goToday = (s) => ({ ...s, cursor: { y: NOW.year, m: NOW.month } });

// Day popup
openDay(date)  => set selectedDate = date
closeDay()     => set selectedDate = null

// Detail
openDetail(t)  => set selectedTournament = t, stack.push("detail")
closeDetail()  => stack.pop(); after 200ms (so animation runs) set selectedTournament = null

// Filters
openFilters()  => stack.push("filters")
closeFilters() => stack.popKind("filters")

// Login
openLogin()  => stack.push("login")
closeLogin() => stack.popKind("login")
loginSuccess => set isAdmin=true; closeLogin()

// Form
openForm(t)   => set editingDraft = t (or new template), stack.push("form")
closeForm()   => stack.popKind("form"); set editingDraft = null
saveTournament(draft):
  if draft.id == null:
    id = max(existing ids) + 1
    tournaments = [...tournaments, { ...draft, id }]
  else:
    tournaments = tournaments.map(t => t.id === draft.id ? draft : t)
  closeForm()

// Delete
askDelete(t)    => set pendingDelete = t
confirmDelete() =>
  tournaments = tournaments.filter(t => t.id !== pendingDelete.id)
  pendingDelete = null
  if top of stack is "form": closeForm()
  if top of stack is "detail": closeDetail()
cancelDelete()  => set pendingDelete = null
```

## Animations

| Transition | Direction | Timing |
| --- | --- | --- |
| Day popup | bottom → top, fade-in backdrop | `translateY(100% → 0)` over 250 ms `cubic-bezier(.2,.7,.3,1)` |
| Filters sheet | same | same |
| Detail screen | right slide | `translateX(8px → 0)` + `opacity(0 → 1)` over 220 ms `ease-out` |
| Form screen | same | same |
| Login screen | same | same |
| Confirm dialog | none required; appears instantly OR fade-in backdrop 150 ms | |
| View toggle (cal/list) | none — instant swap | |
| Day cell tap | `transform: scale(0.96)` while held | 120 ms |
| FAB | scale 0 → 1 on appear | 200 ms `cubic-bezier(.2,.7,.3,1)` |

Respect `prefers-reduced-motion: reduce` — when set, drop all `translate`/`scale` and only keep opacity changes (or none).

## Empty / loading / error states

| Where | Empty | Loading | Error |
| --- | --- | --- | --- |
| Calendar | All days show 0 → all cells render with no badge; no message | Skeleton: keep grid, fade cells to surface-alt | Toast "Грешка при зареждане" + retry button below header |
| List | "Няма турнири" centered, body 14 muted | Skeleton rows (3 dummy rows) | Same toast |
| Day popup | not reachable (only opens if count > 0) | spinner centered | message in body, "Опитай отново" |
| Filters | n/a | n/a | n/a |
| Detail | n/a (we always have a tournament) | spinner | "Не може да зареди турнира" + back button |
| Form | n/a | disable save while saving | inline message above save button |
| Login | n/a | disable button + spinner | inline message above button: "Грешен потребител или парола" |

## Filter logic

Pseudo-code (full implementation in `reference/screens.jsx → tournamentMatchesFilters`):

```ts
function matches(t: Tournament, f: Filters): boolean {
  if (f.types.length   && !f.types.includes(t.type))   return false;
  if (f.levels.length  && !f.levels.includes(t.level)) return false;
  if (f.handicap !== "any"   && (f.handicap   === "yes") !== t.handicap)   return false;
  if (f.dressCode !== "any"  && (f.dressCode  === "yes") !== t.dressCode)  return false;
  if (f.cities.length  && !f.cities.includes(t.city)) return false;
  if (f.clubs.length   && !f.clubs.includes(t.club))  return false;
  if (f.dayKind !== "any") {
    const dow = (new Date(t.date).getDay() + 6) % 7; // 0=Mon … 6=Sun
    const weekend = dow >= 5;
    if (f.dayKind === "weekend" && !weekend) return false;
    if (f.dayKind === "workday" &&  weekend) return false;
  }
  if (f.q?.trim()) {
    const q = f.q.toLowerCase();
    if (!t.name.toLowerCase().includes(q) &&
        !t.club.toLowerCase().includes(q)) return false;
  }
  return true;
}
```

Active filter count (shown on filter button) is the count of *non-default* slots:

```ts
function countActive(f: Filters): number {
  return [
    f.types.length > 0,
    f.levels.length > 0,
    f.handicap !== "any",
    f.dressCode !== "any",
    f.cities.length > 0,
    f.clubs.length > 0,
    f.dayKind !== "any",
    !!f.q?.trim(),
  ].filter(Boolean).length;
}
```

## Persistence

| State | Persist where | Why |
| --- | --- | --- |
| `view` (cal/list) | `localStorage` | Remember last preferred view across visits |
| `filters` | `localStorage` (optional) | UX nicety, not required |
| `isAdmin` | `localStorage` token + httpOnly cookie if real backend | Survive page reload |
| `cursor` | not persisted | Always land on current month |
| `tournaments` | server (or `localStorage` if you implement local-only) | Source of truth |
| `selectedDate`, `selectedTournament`, `stack` | not persisted | Always start at calendar |

## Keyboard

| Key | Action |
| --- | --- |
| `Esc` | Pop top overlay (or close popup / cancel dialog) |
| `←` / `→` | (Optional) prev/next month when calendar is focused |
| `Enter` on field | Submit form / login |

## Aria labels (icon-only buttons)

| Button | `aria-label` |
| --- | --- |
| Prev month chevron | "Предишен месец" |
| Next month chevron | "Следващ месец" |
| User / admin icon | "Вход за администратори" / "Изход" |
| Filter button | "Филтри" |
| Close sheet | "Затвори" |
| Back chevron | "Назад" |
| Edit row icon | "Редактирай турнир" |
| Trash row icon | "Изтрий турнир" |
| FAB | "Добави нов турнир" |
| Today pill | "Към днешен ден" |

## Routing (if you adopt React Router)

If you choose to add real URLs:

| URL | Screen |
| --- | --- |
| `/` | Main shell — current month, calendar view |
| `/list` | Main shell — list view |
| `/m/2026-05` | Specific month |
| `/d/2026-05-16` | Day popup over the right month |
| `/t/:id` | Tournament detail |
| `/admin/login` | Login |
| `/admin/new` | New tournament form |
| `/admin/edit/:id` | Edit tournament form |
| `/filters` | Filters sheet (or use a query string `?type=9&level=pro`) |

If you prefer a single-page state machine (no router), keep the pattern from the prototype. Either is acceptable; for share-by-link / refresh-stays-put, prefer the URL approach and persist `view` + `filters` in query strings.

## Time / "now"

The prototype freezes `TODAY` to **May 17, 2026** so the sample tournaments span past/present/future. In production use `new Date()` and ensure sample data is current — or wire the backend.

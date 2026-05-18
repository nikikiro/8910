# Data model

## TypeScript types

```ts
export type Tournament = {
  id: number;
  name: string;                            // free text
  version: string;                         // "1" | "2" | "Q1" | "Q3" | "F" | etc.
  type: 8 | 9 | 10;                        // ball type
  level: "pro" | "amateur" | "both";
  handicap: boolean;
  city: string;                            // see CITIES below; free text allowed
  club: string;                            // see CLUBS below; free text allowed
  date: string;                            // "YYYY-MM-DD" — no time component
  startHour: string;                       // "HH:MM" — 24-hour
  dressCode: boolean;
};

export type Filters = {
  types: (8 | 9 | 10)[];                   // empty = all
  levels: ("pro" | "amateur" | "both")[];  // empty = all
  handicap: "any" | "yes" | "no";
  dressCode: "any" | "yes" | "no";
  cities: string[];                        // empty = all
  clubs: string[];                         // empty = all
  dayKind: "any" | "workday" | "weekend";
  q: string;                               // search query
};

export const DEFAULT_FILTERS: Filters = {
  types: [], levels: [],
  handicap: "any", dressCode: "any",
  cities: [], clubs: [],
  dayKind: "any", q: "",
};
```

## Bulgarian display labels

| Field | Value | Label |
| --- | --- | --- |
| `type` | 8 | `8-Бол` |
| `type` | 9 | `9-Бол` |
| `type` | 10 | `10-Бол` |
| `level` | `pro` | `Про` |
| `level` | `amateur` | `Аматьор` |
| `level` | `both` | `Смесен` |
| `handicap` | `true` | `Да` |
| `handicap` | `false` | `Не` |
| `dressCode` | `true` | `Да` |
| `dressCode` | `false` | `Не` |
| `dayKind` | `any` | `Всички` |
| `dayKind` | `workday` | `Работни` |
| `dayKind` | `weekend` | `Уикенди` |

The full string table is `BG` in `reference/data.js` — copy it verbatim.

## Cities (Bulgarian)

```ts
export const CITIES = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Русе",
  "Стара Загора",
  "Плевен",
  "Велико Търново",
  "Благоевград",
];
```

## Clubs (Bulgarian)

```ts
export const CLUBS = [
  "Pool Pro Sofia",
  "Билярд Клуб Парадайс",
  "Алекс Билярд",
  "Билярд Тракия",
  "Пул Пловдив",
  "Морски Билярд",
  "Pool Black",
  "Бургас Пул Клуб",
  "Дунав Билярд",
  "Загора Пул",
  "Плевен Билярд",
  "Търново Билярд",
  "Пирин Пул",
];
```

These are sample values — admin can also enter free-text cities/clubs. Treat the lists as suggestions (autocomplete options), not enums.

## Service interface

Abstract behind a service so a real REST API can replace the in-memory implementation:

```ts
interface TournamentsService {
  list(): Promise<Tournament[]>;
  byMonth(year: number, month: number): Promise<Tournament[]>;
  get(id: number): Promise<Tournament>;
  create(input: Omit<Tournament, "id">): Promise<Tournament>;
  update(id: number, patch: Partial<Tournament>): Promise<Tournament>;
  delete(id: number): Promise<void>;
}
```

For the initial implementation, back it with the seed below in `localStorage`:

```ts
function createLocalService(): TournamentsService {
  const KEY = "billiards.tournaments.v1";
  const read  = () => JSON.parse(localStorage.getItem(KEY) ?? "null") ?? SEED_DATA;
  const write = (rows) => localStorage.setItem(KEY, JSON.stringify(rows));
  // … implement methods against this
}
```

## Seed data (30 tournaments, May–June 2026)

Copy verbatim from `reference/data.js → TOURNAMENTS`. Excerpt:

```json
[
  { "id": 1, "name": "Sofia Spring Open", "version": "Q1", "type": 9, "level": "pro", "handicap": false, "city": "София", "club": "Pool Pro Sofia", "date": "2026-05-02", "startHour": "10:00", "dressCode": true },
  { "id": 2, "name": "Тракия Купа", "version": "2", "type": 8, "level": "amateur", "handicap": true, "city": "Пловдив", "club": "Билярд Тракия", "date": "2026-05-03", "startHour": "14:00", "dressCode": false }
]
```

Use the full array from `data.js`. Mix is intentional: pro/amateur/both, with/without handicap & dress code, multiple events per day to test count badges, both months populated.

## Validation rules (form)

| Field | Rule | Error message (Bulgarian) |
| --- | --- | --- |
| `name` | non-empty trimmed | "Полето е задължително" |
| `version` | non-empty | "Полето е задължително" |
| `type` | must be 8, 9, or 10 | "Невалиден вид" |
| `level` | one of the three values | "Невалидно ниво" |
| `city` | non-empty | "Изберете град" |
| `club` | non-empty | "Изберете клуб" |
| `date` | `/^\d{4}-\d{2}-\d{2}$/` and a valid calendar date | "Невалидна дата" |
| `startHour` | `/^\d{2}:\d{2}$/` and 0–23 / 0–59 | "Невалиден час" |

The Save button stays disabled until at least `name` is non-empty (prototype rule). For production tighten to all required fields.

## Past / today / upcoming logic

```ts
function status(t: Tournament, today = new Date()): "past" | "today" | "upcoming" {
  const d = new Date(t.date);
  const cmp = startOfDay(d).valueOf() - startOfDay(today).valueOf();
  if (cmp < 0) return "past";
  if (cmp === 0) return "today";
  return "upcoming";
}
```

Used to color the status dot in row meta and the status pill in detail/popup.

## Date formatting (Bulgarian)

| Format | Example |
| --- | --- |
| Month + year (control bar) | `Май 2026` |
| Day in list group header | `16` |
| Day-of-week (uppercase row meta) | `СЪБОТА` |
| Long date (popup, detail) | `Събота, 16 май` (note month is lowercase) |
| Short date | `16 май` |

Day-of-week from `Date.getDay()` is Sun-based (0=Sun). Convert to Monday-based with `(dow + 6) % 7`, then index into `BG.daysFull = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота", "Неделя"]` (and `BG.daysShort = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"]`).

Months — array order: `["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"]`.

Short months — `["Ян","Фев","Мар","Апр","Май","Юни","Юли","Авг","Сеп","Окт","Ное","Дек"]`.

## API shape (if you build a real backend)

Suggested REST surface — adapt to your conventions:

```
GET    /api/tournaments?year=2026&month=5
GET    /api/tournaments/:id
POST   /api/tournaments
PATCH  /api/tournaments/:id
DELETE /api/tournaments/:id

POST   /api/auth/login   { username, password } → { token }
POST   /api/auth/logout
```

All endpoints return JSON. Tournament JSON keys match the TypeScript type exactly (camelCase). Authenticated endpoints require `Authorization: Bearer <token>`.

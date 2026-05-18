import type { Filters, Tournament } from "./types";
import { parseDateKey } from "./date";

export function tournamentMatchesFilters(t: Tournament, f: Filters): boolean {
  if (f.types.length && !f.types.includes(t.type)) return false;
  if (f.levels.length && !f.levels.includes(t.level)) return false;
  if (f.handicap !== "any" && (f.handicap === "yes") !== t.handicap) return false;
  if (f.dressCode !== "any" && (f.dressCode === "yes") !== t.dressCode) return false;
  if (f.cities.length && !f.cities.includes(t.city)) return false;
  if (f.clubs.length && !f.clubs.includes(t.club)) return false;

  if (f.dayKind !== "any") {
    const dow = (parseDateKey(t.date).getDay() + 6) % 7;
    const weekend = dow >= 5;
    if (f.dayKind === "weekend" && !weekend) return false;
    if (f.dayKind === "workday" && weekend) return false;
  }

  if (f.q.trim()) {
    const q = f.q.trim().toLocaleLowerCase("bg-BG");
    if (!t.name.toLocaleLowerCase("bg-BG").includes(q) && !t.club.toLocaleLowerCase("bg-BG").includes(q)) {
      return false;
    }
  }

  return true;
}

export function countActiveFilters(f: Filters) {
  return [
    f.types.length > 0,
    f.levels.length > 0,
    f.handicap !== "any",
    f.dressCode !== "any",
    f.cities.length > 0,
    f.clubs.length > 0,
    f.dayKind !== "any",
    f.q.trim().length > 0,
  ].filter(Boolean).length;
}

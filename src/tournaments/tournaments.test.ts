import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, SEED_TOURNAMENTS } from "./data";
import { formatDateKey, monthMatrix, parseDateKey } from "./date";
import { countActiveFilters, tournamentMatchesFilters } from "./filters";
import { toTournament } from "./tournamentsService";
import type { TournamentRow } from "./types";

describe("date helpers", () => {
  it("builds a Monday-first 42-cell month matrix", () => {
    const cells = monthMatrix(2026, 4);

    expect(cells).toHaveLength(42);
    expect(formatDateKey(cells[0])).toBe("2026-04-27");
    expect(formatDateKey(cells[6])).toBe("2026-05-03");
  });

  it("parses date keys without UTC drift", () => {
    const parsed = parseDateKey("2026-05-17");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(4);
    expect(parsed.getDate()).toBe(17);
  });
});

describe("filters", () => {
  it("matches type, level, weekend, city and query filters", () => {
    const tournament = SEED_TOURNAMENTS.find((t) => t.id === 9)!;

    expect(
      tournamentMatchesFilters(tournament, {
        ...DEFAULT_FILTERS,
        types: [9],
        levels: ["pro"],
        dayKind: "weekend",
        cities: ["София"],
        q: "alex",
      }),
    ).toBe(true);
  });

  it("counts non-default filter slots", () => {
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        types: [8],
        handicap: "yes",
        q: "pool",
      }),
    ).toBe(3);
  });
});

describe("service mapping", () => {
  it("maps Supabase snake_case rows to app tournaments", () => {
    const row: TournamentRow = {
      id: 31,
      name: "Тест",
      version: "1",
      type: 9,
      level: "both",
      handicap: false,
      city: "София",
      club: "Pool Pro Sofia",
      date: "2026-07-01",
      start_hour: "18:30:00",
      dress_code: true,
    };

    expect(toTournament(row)).toMatchObject({
      startHour: "18:30",
      dressCode: true,
    });
  });
});

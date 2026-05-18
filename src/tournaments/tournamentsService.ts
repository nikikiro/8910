import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { SEED_TOURNAMENTS } from "./data";
import type { Tournament, TournamentInput, TournamentRow, TournamentsService } from "./types";

const LOCAL_KEY = "billiards.tournaments.v1";

export function toTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    type: row.type,
    level: row.level,
    handicap: row.handicap,
    city: row.city,
    club: row.club,
    date: row.date,
    startHour: row.start_hour.slice(0, 5),
    dressCode: row.dress_code,
  };
}

function toRow(input: TournamentInput | Partial<TournamentInput>) {
  return {
    name: input.name,
    version: input.version,
    type: input.type,
    level: input.level,
    handicap: input.handicap,
    city: input.city,
    club: input.club,
    date: input.date,
    start_hour: input.startHour,
    dress_code: input.dressCode,
  };
}

function readLocal(): Tournament[] {
  const stored = localStorage.getItem(LOCAL_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_TOURNAMENTS));
    return SEED_TOURNAMENTS.map((t) => ({ ...t }));
  }
  return JSON.parse(stored) as Tournament[];
}

function writeLocal(rows: Tournament[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

const localService: TournamentsService = {
  async list() {
    return readLocal().sort((a, b) => a.date.localeCompare(b.date) || a.startHour.localeCompare(b.startHour));
  },
  async byMonth(year, month) {
    return readLocal()
      .filter((t) => {
        const d = new Date(`${t.date}T00:00:00`);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startHour.localeCompare(b.startHour));
  },
  async get(id) {
    const found = readLocal().find((t) => t.id === id);
    if (!found) throw new Error("Tournament not found");
    return found;
  },
  async create(input) {
    const rows = readLocal();
    const next = { ...input, id: Math.max(0, ...rows.map((t) => t.id)) + 1 };
    writeLocal([...rows, next]);
    return next;
  },
  async update(id, patch) {
    const rows = readLocal();
    const next = rows.map((t) => (t.id === id ? { ...t, ...patch } : t));
    const updated = next.find((t) => t.id === id);
    if (!updated) throw new Error("Tournament not found");
    writeLocal(next);
    return updated;
  },
  async delete(id) {
    writeLocal(readLocal().filter((t) => t.id !== id));
  },
};

const supabaseService: TournamentsService = {
  async list() {
    if (!supabase) return localService.list();
    const { data, error } = await supabase.from("tournaments").select("*").order("date").order("start_hour");
    if (error) throw error;
    return (data as TournamentRow[]).map(toTournament);
  },
  async byMonth(year, month) {
    if (!supabase) return localService.byMonth(year, month);
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = new Date(year, month + 1, 1).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .gte("date", from)
      .lt("date", to)
      .order("date")
      .order("start_hour");
    if (error) throw error;
    return (data as TournamentRow[]).map(toTournament);
  },
  async get(id) {
    if (!supabase) return localService.get(id);
    const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).single();
    if (error) throw error;
    return toTournament(data as TournamentRow);
  },
  async create(input) {
    if (!supabase) return localService.create(input);
    const { data, error } = await supabase.from("tournaments").insert(toRow(input)).select("*").single();
    if (error) throw error;
    return toTournament(data as TournamentRow);
  },
  async update(id, patch) {
    if (!supabase) return localService.update(id, patch);
    const { data, error } = await supabase.from("tournaments").update(toRow(patch)).eq("id", id).select("*").single();
    if (error) throw error;
    return toTournament(data as TournamentRow);
  },
  async delete(id) {
    if (!supabase) return localService.delete(id);
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) throw error;
  },
};

export const tournamentsService = isSupabaseConfigured ? supabaseService : localService;

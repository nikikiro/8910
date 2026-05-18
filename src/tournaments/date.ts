import { BG } from "./data";
import type { Tournament, TournamentStatus } from "./types";

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseDateKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offsetToMonday = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offsetToMonday);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function formatLongDate(d: Date) {
  return `${BG.daysFull[(d.getDay() + 6) % 7]}, ${d.getDate()} ${BG.months[d.getMonth()].toLowerCase()}`;
}

export function getTournamentStatus(t: Tournament, today = new Date()): TournamentStatus {
  const diff = startOfDay(parseDateKey(t.date)).valueOf() - startOfDay(today).valueOf();
  if (diff < 0) return "past";
  if (diff === 0) return "today";
  return "upcoming";
}

export function statusLabel(status: TournamentStatus) {
  if (status === "past") return BG.past;
  if (status === "today") return BG.today;
  return BG.upcoming;
}

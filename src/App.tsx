import { useEffect, useMemo, useState } from "react";
import { loginAdmin, logoutAdmin, getAdminSession } from "./auth/authService";
import { BallPip } from "./components/BallPip";
import { Icon } from "./components/Icons";
import styles from "./App.module.css";
import { BG, CITIES, DEFAULT_FILTERS } from "./tournaments/data";
import { formatDateKey, formatLongDate, getTournamentStatus, monthMatrix, pad2, parseDateKey, sameDay, startOfDay, statusLabel } from "./tournaments/date";
import { countActiveFilters, tournamentMatchesFilters } from "./tournaments/filters";
import { tournamentsService } from "./tournaments/tournamentsService";
import type { BallType, Filters, Tournament, TournamentInput, TournamentLevel, TournamentStatus } from "./tournaments/types";
import { useTheme } from "./theme/ThemeProvider";

type ViewMode = "cal" | "list";
type Overlay = "filters" | "login" | "detail" | "form";

const today = new Date();

const emptyDraft = (date = today): TournamentInput => ({
  name: "",
  version: "1",
  type: 9,
  level: "pro",
  handicap: false,
  city: CITIES[0],
  club: "",
  date: formatDateKey(date),
  startHour: "18:00",
  dressCode: false,
});

function App() {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem("billiards.view.v1") as ViewMode | null) ?? "cal");
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [stack, setStack] = useState<Overlay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [editingDraft, setEditingDraft] = useState<(TournamentInput & { id?: number }) | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Tournament | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setTournaments(await tournamentsService.list());
    } catch {
      setError(BG.loadError);
    }
  };

  useEffect(() => {
    void load();
    void getAdminSession().then((s) => setIsAdmin(s.isAdmin));
  }, []);

  useEffect(() => {
    localStorage.setItem("billiards.view.v1", view);
  }, [view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pendingDelete) setPendingDelete(null);
      else if (selectedDate) setSelectedDate(null);
      else setStack((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, selectedDate]);

  const filtered = useMemo(() => tournaments.filter((t) => tournamentMatchesFilters(t, filters)), [tournaments, filters]);
  const clubOptions = useMemo(() => uniqueSorted(tournaments.map((t) => t.club)), [tournaments]);
  const byDate = useMemo(() => {
    const map: Record<string, Tournament[]> = {};
    filtered.forEach((t) => {
      (map[t.date] ??= []).push(t);
    });
    return map;
  }, [filtered]);

  const top = stack[stack.length - 1];
  const activeFilters = countActiveFilters(filters);

  const refreshAfter = async <T,>(fn: () => Promise<T>) => {
    const result = await fn();
    await load();
    return result;
  };

  const saveTournament = async (draft: TournamentInput & { id?: number }) => {
    await refreshAfter(() => (draft.id ? tournamentsService.update(draft.id, draft) : tournamentsService.create(draft)));
    setStack((s) => s.filter((x) => x !== "form"));
    setEditingDraft(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await refreshAfter(() => tournamentsService.delete(pendingDelete.id));
    setPendingDelete(null);
    setSelectedTournament(null);
    setStack((s) => s.filter((x) => x !== "detail" && x !== "form"));
  };

  return (
    <main className={styles.app}>
      <div className={styles.sticky}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.logo}>8/9</div>
            <div>
              <div className={styles.appName}>{BG.appName}</div>
              {isAdmin && <div className={styles.adminCaption}>{BG.adminMode}</div>}
            </div>
          </div>
          <button
            className={`${styles.roundButton} ${isAdmin ? styles.adminButton : ""}`}
            aria-label={isAdmin ? "Изход" : "Вход за администратори"}
            onClick={async () => {
              if (isAdmin) {
                await logoutAdmin();
                setIsAdmin(false);
              } else {
                setStack((s) => [...s, "login"]);
              }
            }}
          >
            <Icon.user />
          </button>
        </header>
        <section className={styles.controlBar}>
          <div className={styles.monthRow}>
            <div>
              <button className={styles.iconButton} aria-label="Предишен месец" onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>
                <Icon.chevL />
              </button>
              <span className={styles.monthTitle}>
                {BG.months[cursor.m]} <span className={styles.muted}>{cursor.y}</span>
              </span>
              <button className={styles.iconButton} aria-label="Следващ месец" onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>
                <Icon.chevR />
              </button>
            </div>
            <button className={styles.todayButton} aria-label="Към днешен ден" onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}>
              {BG.today}
            </button>
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.segmented}>
              <button className={`${styles.segment} ${view === "cal" ? styles.activeSegment : ""}`} onClick={() => setView("cal")}>
                <Icon.cal /> {BG.calendar}
              </button>
              <button className={`${styles.segment} ${view === "list" ? styles.activeSegment : ""}`} onClick={() => setView("list")}>
                <Icon.list /> {BG.list}
              </button>
            </div>
            <button className={`${styles.filterButton} ${activeFilters ? styles.filterActive : ""}`} aria-label="Филтри" onClick={() => setStack((s) => [...s, "filters"])}>
              <Icon.filter /> {activeFilters || null}
            </button>
          </div>
        </section>
      </div>

      {error ? <ErrorState onRetry={load} /> : view === "cal" ? <CalendarView year={cursor.y} month={cursor.m} byDate={byDate} onDay={setSelectedDate} /> : <ListView year={cursor.y} month={cursor.m} tournaments={filtered} isAdmin={isAdmin} onSelect={(t) => { setSelectedTournament(t); setStack((s) => [...s, "detail"]); }} onEdit={(t) => { setEditingDraft(t); setStack((s) => [...s, "form"]); }} onDelete={setPendingDelete} />}

      {isAdmin && !top && !selectedDate && (
        <button className={styles.fab} aria-label="Добави нов турнир" onClick={() => { setEditingDraft(emptyDraft()); setStack((s) => [...s, "form"]); }}>
          <Icon.plus width={22} height={22} />
        </button>
      )}

      {selectedDate && (
        <DaySheet
          date={selectedDate}
          tournaments={byDate[formatDateKey(selectedDate)] ?? []}
          isAdmin={isAdmin}
          onClose={() => setSelectedDate(null)}
          onSelect={(t) => { setSelectedTournament(t); setStack((s) => [...s, "detail"]); }}
          onEdit={(t) => { setEditingDraft(t); setStack((s) => [...s, "form"]); }}
          onDelete={setPendingDelete}
          onAdd={(d) => { setEditingDraft(emptyDraft(d)); setStack((s) => [...s, "form"]); }}
        />
      )}

      {top === "filters" && <FiltersSheet filters={filters} clubOptions={clubOptions} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} onClose={() => setStack((s) => s.filter((x) => x !== "filters"))} />}
      {top === "login" && <LoginScreen onClose={() => setStack((s) => s.filter((x) => x !== "login"))} onSuccess={() => { setIsAdmin(true); setStack((s) => s.filter((x) => x !== "login")); }} />}
      {top === "detail" && selectedTournament && <DetailScreen t={selectedTournament} isAdmin={isAdmin} onBack={() => setStack((s) => s.slice(0, -1))} onEdit={(t) => { setEditingDraft(t); setStack((s) => [...s, "form"]); }} onDelete={setPendingDelete} />}
      {top === "form" && editingDraft && <TournamentForm draft={editingDraft} clubOptions={clubOptions} onCancel={() => { setStack((s) => s.filter((x) => x !== "form")); setEditingDraft(null); }} onSave={saveTournament} onDelete={(t) => setPendingDelete(t as Tournament)} />}
      {pendingDelete && <ConfirmDialog onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />}

      <select className={styles.themeSelect} value={theme} onChange={(e) => setTheme(e.target.value as "clean" | "dark" | "club")} aria-label="Тема">
        <option value="clean">Чисто</option>
        <option value="dark">Турнир</option>
        <option value="club">Клуб</option>
      </select>
    </main>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.error}>
      {BG.loadError}
      <div><button className={styles.secondaryButton} onClick={onRetry}>{BG.retry}</button></div>
    </div>
  );
}

function CalendarView({ year, month, byDate, onDay }: { year: number; month: number; byDate: Record<string, Tournament[]>; onDay: (date: Date) => void }) {
  return (
    <section className={styles.calendar}>
      <div className={styles.dowGrid}>
        {BG.daysShort.map((day, i) => <div key={day} className={`${styles.dow} ${i >= 5 ? styles.weekend : ""}`}>{day}</div>)}
      </div>
      <div className={styles.dayGrid}>
        {monthMatrix(year, month).map((date) => {
          const key = formatDateKey(date);
          const count = byDate[key]?.length ?? 0;
          const isToday = sameDay(date, today);
          const isPast = startOfDay(date) < startOfDay(today);
          const weekend = (date.getDay() + 6) % 7 >= 5;
          return (
            <button key={key} disabled={!count} className={`${styles.dayCell} ${count ? styles.dayCellHasEvents : ""} ${date.getMonth() !== month ? styles.dayOutside : ""} ${isToday ? styles.dayToday : ""}`} onClick={() => count && onDay(date)}>
              <span className={`${styles.dayNumber} ${isPast && !isToday ? styles.pastText : ""} ${weekend && date.getMonth() === month ? styles.weekend : ""}`}>{date.getDate()}</span>
              {count > 0 && <span className={`${styles.badge} ${isPast ? styles.pastBadge : ""}`}>{count}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ListView({ year, month, tournaments, isAdmin, onSelect, onEdit, onDelete }: { year: number; month: number; tournaments: Tournament[]; isAdmin: boolean; onSelect: (t: Tournament) => void; onEdit: (t: Tournament) => void; onDelete: (t: Tournament) => void }) {
  const groups = useMemo(() => {
    const map: Record<string, Tournament[]> = {};
    tournaments.forEach((t) => {
      const d = parseDateKey(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) (map[t.date] ??= []).push(t);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, items: items.sort((a, b) => a.startHour.localeCompare(b.startHour)) }));
  }, [month, tournaments, year]);

  if (!groups.length) return <div className={styles.empty}>{BG.noTournaments}</div>;
  return (
    <section className={styles.list}>
      {groups.map(({ date, items }) => {
        const d = parseDateKey(date);
        const status = getTournamentStatus(items[0], today);
        return (
          <div key={date}>
            <div className={styles.dayHeader}>
              <span className={styles.bigDay}>{pad2(d.getDate())}</span>
              <div>
                <div className={`${styles.label} ${(d.getDay() + 6) % 7 >= 5 ? styles.weekend : ""}`}>{BG.daysFull[(d.getDay() + 6) % 7]}</div>
                <div className={styles.muted}>{statusLabel(status)} · {items.length} {items.length === 1 ? BG.tournament : BG.tournaments}</div>
              </div>
            </div>
            <div className={styles.rows}>{items.map((t) => <TournamentRow key={t.id} t={t} isAdmin={isAdmin} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />)}</div>
          </div>
        );
      })}
    </section>
  );
}

function TournamentRow({ t, isAdmin, onSelect, onEdit, onDelete }: { t: Tournament; isAdmin: boolean; onSelect: (t: Tournament) => void; onEdit: (t: Tournament) => void; onDelete: (t: Tournament) => void }) {
  const status = getTournamentStatus(t, today);
  return (
    <div className={`${styles.row} ${status === "past" ? styles.rowPast : ""}`}>
      <button className={styles.rowMain} onClick={() => onSelect(t)}>
        <BallPip type={t.type} />
        <div className={styles.truncate}>
          <div className={styles.rowTitle}>
            <span className={styles.statusDot} style={{ background: statusColor(status) }} />
            <span className={styles.titleText}>{t.name}</span>
            <span className={styles.version}>· {t.version}</span>
          </div>
          <div className={styles.meta}><span>{t.startHour}</span><span>·</span><span className={styles.truncate}>{t.club}</span><span>·</span><span>{t.city}</span></div>
        </div>
      </button>
      {isAdmin && <div className={styles.adminActions}><button className={styles.adminAction} aria-label="Редактирай турнир" onClick={() => onEdit(t)}><Icon.edit /></button><button className={`${styles.adminAction} ${styles.dangerText}`} aria-label="Изтрий турнир" onClick={() => onDelete(t)}><Icon.trash /></button></div>}
    </div>
  );
}

function statusColor(status: TournamentStatus) {
  if (status === "past") return "var(--color-text-faint)";
  if (status === "today") return "var(--color-warn)";
  return "var(--color-accent)";
}

function DaySheet(props: { date: Date; tournaments: Tournament[]; isAdmin: boolean; onClose: () => void; onSelect: (t: Tournament) => void; onEdit: (t: Tournament) => void; onDelete: (t: Tournament) => void; onAdd: (d: Date) => void }) {
  const sorted = [...props.tournaments].sort((a, b) => a.startHour.localeCompare(b.startHour));
  const status = sorted[0] ? getTournamentStatus(sorted[0], today) : "upcoming";
  return (
    <Sheet onClose={props.onClose}>
      <div className={styles.sheetHeader}>
        <div className={styles.label}>{statusLabel(status)}</div>
        <div className={styles.sheetTitle}>{formatLongDate(props.date)}</div>
        <div className={styles.muted}>{sorted.length} {sorted.length === 1 ? BG.tournament : BG.tournaments}</div>
      </div>
      <div className={styles.sheetBody}>
        {sorted.map((t) => <TournamentRow key={t.id} t={t} isAdmin={props.isAdmin} onSelect={props.onSelect} onEdit={props.onEdit} onDelete={props.onDelete} />)}
        {props.isAdmin && <button className={styles.dashedButton} onClick={() => props.onAdd(props.date)}><Icon.plus /> {BG.addTournament}</button>}
      </div>
    </Sheet>
  );
}

function Sheet({ children, onClose, tall }: { children: React.ReactNode; onClose: () => void; tall?: boolean }) {
  return <div className={styles.sheetRoot}><button aria-label="Затвори" className={styles.backdrop} onClick={onClose} /><div className={`${styles.sheet} ${tall ? styles.sheetTall : ""}`}><div className={styles.handle} />{children}</div></div>;
}

function DetailScreen({ t, isAdmin, onBack, onEdit, onDelete }: { t: Tournament; isAdmin: boolean; onBack: () => void; onEdit: (t: Tournament) => void; onDelete: (t: Tournament) => void }) {
  const d = parseDateKey(t.date);
  const status = getTournamentStatus(t, today);
  return (
    <div className={styles.screen}>
      <div className={styles.screenTop}><button className={styles.backButton} onClick={onBack}><Icon.back /> {BG.back}</button><span className={styles.statusPill}>{statusLabel(status)}</span></div>
      <div className={styles.content}>
        <div className={styles.hero}><BallPip type={t.type} size={56} /><div><div className={styles.label}>{BG.ballType[t.type]} · {BG.version} {t.version}</div><div className={styles.displayTitle}>{t.name}</div></div></div>
        <div className={`${styles.card} ${styles.dateGrid}`}><Kv label="Дата" value={formatLongDate(d)} icon={<Icon.cal />} /><Kv label={BG.startHour} value={t.startHour} icon={<Icon.clock />} /></div>
        <div className={`${styles.card} ${styles.location}`}><Icon.pin /><div><div className={styles.titleText}>{t.club}</div><div className={styles.muted}>{t.city}</div></div></div>
        <div className={styles.label}>{BG.details}</div>
        <div className={styles.card}>
          <DetailRow label={BG.level} value={levelLabel(t.level)} />
          <DetailRow label={BG.handicap} value={t.handicap ? BG.yes : BG.no} accent={t.handicap} />
          <DetailRow label={BG.dressCode} value={t.dressCode ? BG.yes : BG.no} accent={t.dressCode} />
        </div>
        {isAdmin && <div className={styles.buttonRow}><button className={styles.primaryButton} onClick={() => onEdit(t)}><Icon.edit /> {BG.edit}</button><button className={styles.outlineDanger} onClick={() => onDelete(t)}><Icon.trash /> {BG.delete}</button></div>}
      </div>
    </div>
  );
}

function Kv({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className={styles.kv}><div className={styles.label}>{icon} {label}</div><div className={styles.kvValue}>{value}</div></div>;
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className={styles.detailRow}><span className={styles.muted}>{label}</span><strong className={accent ? styles.dangerText : ""}>{value}</strong></div>;
}

function levelLabel(level: TournamentLevel) {
  return level === "pro" ? BG.pro : level === "amateur" ? BG.amateur : BG.both;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg-BG"));
}

function FiltersSheet({ filters, clubOptions, onChange, onReset, onClose }: { filters: Filters; clubOptions: string[]; onChange: (f: Filters) => void; onReset: () => void; onClose: () => void }) {
  const patch = (p: Partial<Filters>) => onChange({ ...filters, ...p });
  const toggleArr = <K extends "types" | "levels" | "cities" | "clubs">(key: K, value: Filters[K][number]) => {
    const arr = filters[key] as unknown[];
    patch({ [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] } as Partial<Filters>);
  };
  return (
    <Sheet onClose={onClose} tall>
      <div className={styles.filterHeader}><button className={styles.linkButton} onClick={onReset}>{BG.clearAll}</button><strong>{BG.filters}</strong><button className={styles.linkButton} onClick={onClose}>{BG.done}</button></div>
      <div className={styles.filterBody}>
        <Group title={BG.search}><div className={styles.searchWrap}><span className={styles.searchIcon}><Icon.search /></span><input className={`${styles.field} ${styles.search}`} value={filters.q} onChange={(e) => patch({ q: e.target.value })} placeholder={BG.searchPlaceholder} /></div></Group>
        <Group title={BG.type}><div className={styles.chipRow}>{([8, 9, 10] as BallType[]).map((t) => <Chip key={t} active={filters.types.includes(t)} onClick={() => toggleArr("types", t)}><BallPip type={t} size={18} /> {BG.ballType[t]}</Chip>)}</div></Group>
        <Group title={BG.level}><div className={styles.chipRow}>{(["pro", "amateur", "both"] as TournamentLevel[]).map((l) => <Chip key={l} active={filters.levels.includes(l)} onClick={() => toggleArr("levels", l)}>{levelLabel(l)}</Chip>)}</div></Group>
        <Group title="Дни"><div className={styles.chipRow}>{[{ id: "any", label: BG.all }, { id: "workday", label: BG.workdays }, { id: "weekend", label: BG.weekends }].map((x) => <Chip key={x.id} active={filters.dayKind === x.id} onClick={() => patch({ dayKind: x.id as Filters["dayKind"] })}>{x.label}</Chip>)}</div></Group>
        <Group title={BG.handicap}><div className={styles.chipRow}>{choiceChips(filters.handicap, (v) => patch({ handicap: v }))}</div></Group>
        <Group title={BG.dressCode}><div className={styles.chipRow}>{choiceChips(filters.dressCode, (v) => patch({ dressCode: v }))}</div></Group>
        <Group title={BG.city}><div className={styles.chipWrap}>{CITIES.map((c) => <Chip compact key={c} active={filters.cities.includes(c)} onClick={() => toggleArr("cities", c)}>{c}</Chip>)}</div></Group>
        {clubOptions.length > 0 && <Group title={BG.club}><div className={styles.chipWrap}>{clubOptions.map((c) => <Chip compact key={c} active={filters.clubs.includes(c)} onClick={() => toggleArr("clubs", c)}>{c}</Chip>)}</div></Group>}
      </div>
    </Sheet>
  );
}

function choiceChips(value: "any" | "yes" | "no", onPick: (v: "any" | "yes" | "no") => void) {
  return (["any", "yes", "no"] as const).map((id) => <Chip key={id} active={value === id} onClick={() => onPick(id)}>{id === "any" ? BG.any : id === "yes" ? BG.yes : BG.no}</Chip>);
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className={styles.label}>{title}</div>{children}</div>;
}

function Chip({ active, onClick, children, compact }: { active: boolean; onClick: () => void; children: React.ReactNode; compact?: boolean }) {
  return <button className={`${styles.chip} ${active ? styles.chipActive : ""} ${compact ? styles.chipCompact : ""}`} onClick={onClick}>{children}</button>;
}

function LoginScreen({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    try {
      setError("");
      await loginAdmin(email, password);
      onSuccess();
    } catch {
      setError(BG.loginError);
    }
  };
  return <div className={styles.screen}><div className={styles.screenTop}><span /><button className={styles.roundButton} aria-label="Затвори" onClick={onClose}><Icon.close /></button></div><div className={styles.loginBody}><div className={styles.loginLogo}>8/9</div><div className={styles.displayTitle}>{BG.loginTitle}</div><p className={styles.muted}>{BG.loginHint}</p>{error && <p className={styles.dangerText}>{error}</p>}<Field label={BG.username} value={email} onChange={setEmail} /><Field label={BG.password} type="password" value={password} onChange={setPassword} /><button className={styles.primaryButton} onClick={submit}>{BG.login}</button></div></div>;
}

function TournamentForm({ draft, clubOptions, onCancel, onSave, onDelete }: { draft: TournamentInput & { id?: number }; clubOptions: string[]; onCancel: () => void; onSave: (draft: TournamentInput & { id?: number }) => void; onDelete: (draft: TournamentInput & { id?: number }) => void }) {
  const [form, setForm] = useState(draft);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <div className={styles.screen}>
      <div className={styles.formTop}><button className={styles.linkButton} onClick={onCancel}>{BG.cancel}</button><strong>{form.id ? BG.editTournament : BG.newTournament}</strong><button className={styles.linkButton} disabled={!form.name.trim()} onClick={() => onSave(form)}>{BG.save}</button></div>
      <div className={styles.formBody}>
        <Field label={BG.name} value={form.name} onChange={(v) => set("name", v)} />
        <Field label={BG.version} value={form.version} onChange={(v) => set("version", v)} />
        <Group title={BG.type}><div className={styles.chipRow}>{([8, 9, 10] as BallType[]).map((t) => <Chip key={t} active={form.type === t} onClick={() => set("type", t)}><BallPip type={t} size={18} /> {BG.ballType[t]}</Chip>)}</div></Group>
        <Group title={BG.level}><div className={styles.chipRow}>{(["pro", "amateur", "both"] as TournamentLevel[]).map((l) => <Chip key={l} active={form.level === l} onClick={() => set("level", l)}>{levelLabel(l)}</Chip>)}</div></Group>
        <SelectField label={BG.city} value={form.city} options={CITIES} onChange={(v) => set("city", v)} />
        <SuggestField label={BG.club} value={form.club} options={clubOptions} onChange={(v) => set("club", v)} />
        <div className={styles.twoCol}><Field label="Дата" value={form.date} onChange={(v) => set("date", v)} /><Field label={BG.startHour} value={form.startHour} onChange={(v) => set("startHour", v)} /></div>
        <Toggle label={BG.handicap} value={form.handicap} onChange={(v) => set("handicap", v)} />
        <Toggle label={BG.dressCode} value={form.dressCode} onChange={(v) => set("dressCode", v)} />
        {form.id && <button className={styles.outlineDanger} onClick={() => onDelete(form)}><Icon.trash /> {BG.delete}</button>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <label className={styles.fieldBlock}><div className={styles.label}>{label}</div><input className={styles.field} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function SuggestField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const listId = `${label.replace(/\s+/g, "-").toLowerCase()}-suggestions`;
  return (
    <label className={styles.fieldBlock}>
      <div className={styles.label}>{label}</div>
      <input className={styles.field} list={listId} value={value} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <label className={styles.fieldBlock}><div className={styles.label}>{label}</div><select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <div className={styles.toggleItem}><span>{label}</span><span style={{ flex: 1 }} /><button className={`${styles.switch} ${value ? styles.switchOn : ""}`} role="switch" aria-checked={value} onClick={() => onChange(!value)}><span className={styles.thumb} /></button></div>;
}

function ConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className={styles.dialogRoot}><button className={styles.dialogBackdrop} aria-label="Отказ" onClick={onCancel} /><div className={styles.dialog}><h3>{BG.deleteConfirm}</h3><p className={styles.muted}>{BG.deleteConfirmBody}</p><div className={styles.buttonRow}><button className={styles.secondaryButton} onClick={onCancel}>{BG.cancel}</button><button className={styles.outlineDanger} onClick={onConfirm}>{BG.delete}</button></div></div></div>;
}

export default App;

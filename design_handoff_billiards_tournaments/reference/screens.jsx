// Screens + helpers for the Billiards Tournaments app.
// Self-contained: receives `theme` + uses globals BG, TOURNAMENTS, CITIES, CLUBS, TODAY.

const { useState, useMemo, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, "0");
const fmtKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDate = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const sameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function monthMatrix(year, month) {
  // Bulgarian week starts Monday. month is 0-indexed.
  const first = new Date(year, month, 1);
  const jsDow = first.getDay(); // 0=Sun..6=Sat
  const offsetToMon = (jsDow + 6) % 7;
  const start = new Date(year, month, 1 - offsetToMon);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function fmtDateLong(d) {
  return `${BG.daysFull[(d.getDay()+6)%7]}, ${d.getDate()} ${BG.months[d.getMonth()].toLowerCase()}`;
}
function fmtDateShort(d) {
  return `${d.getDate()} ${BG.monthsShort[d.getMonth()]}`;
}

function tournamentMatchesFilters(t, f) {
  if (f.types.length && !f.types.includes(t.type)) return false;
  if (f.levels.length && !f.levels.includes(t.level)) return false;
  if (f.handicap !== "any" && ((f.handicap === "yes") !== !!t.handicap)) return false;
  if (f.dressCode !== "any" && ((f.dressCode === "yes") !== !!t.dressCode)) return false;
  if (f.cities.length && !f.cities.includes(t.city)) return false;
  if (f.clubs.length && !f.clubs.includes(t.club)) return false;
  if (f.dayKind !== "any") {
    const d = parseDate(t.date);
    const dow = (d.getDay()+6)%7; // 0=Mon..6=Sun
    const isWeekend = dow >= 5;
    if (f.dayKind === "weekend" && !isWeekend) return false;
    if (f.dayKind === "workday" && isWeekend) return false;
  }
  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    if (!t.name.toLowerCase().includes(q) && !t.club.toLowerCase().includes(q)) return false;
  }
  return true;
}

function countFilters(f) {
  let n = 0;
  n += f.types.length ? 1 : 0;
  n += f.levels.length ? 1 : 0;
  n += f.handicap !== "any" ? 1 : 0;
  n += f.dressCode !== "any" ? 1 : 0;
  n += f.cities.length ? 1 : 0;
  n += f.clubs.length ? 1 : 0;
  n += f.dayKind !== "any" ? 1 : 0;
  n += (f.q && f.q.trim()) ? 1 : 0;
  return n;
}

const DEFAULT_FILTERS = {
  types: [], levels: [], handicap: "any", dressCode: "any",
  cities: [], clubs: [], dayKind: "any", q: "",
};

// ─────────────────────────────────────────────────────────────
// Tiny icons
// ─────────────────────────────────────────────────────────────
const Icon = {
  chevL: (p={}) => <svg width="11" height="18" viewBox="0 0 11 18" fill="none" {...p}><path d="M9 1L2 9l7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevR: (p={}) => <svg width="11" height="18" viewBox="0 0 11 18" fill="none" {...p}><path d="M2 1l7 8-7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevDown: (p={}) => <svg width="11" height="7" viewBox="0 0 11 7" fill="none" {...p}><path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  filter: (p={}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><path d="M2 4h14M4 9h10M7 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  edit: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  trash: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9.5h5L11 4M7 7v5M9 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: (p={}) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  user: (p={}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 16c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  clock: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  pin: (p={}) => <svg width="14" height="16" viewBox="0 0 14 16" fill="none" {...p}><path d="M7 1.2c3 0 5.5 2.4 5.5 5.4 0 4-5.5 8.4-5.5 8.4S1.5 10.6 1.5 6.6C1.5 3.6 4 1.2 7 1.2z" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  shirt: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M5 2l-3.5 2 1.5 3 2-1v8h6V6l2 1 1.5-3L11 2 9.5 3.5 8 4 6.5 3.5 5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  handicap: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="0.8" fill="currentColor"/></svg>,
  back: (p={}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: (p={}) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  cal: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 6h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  listIcon: (p={}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M5 3h9M5 8h9M5 13h9M2 3h.5M2 8h.5M2 13h.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// Small visual components
// ─────────────────────────────────────────────────────────────
function BallPip({ type, theme, size = 18 }) {
  const color = theme.ball[type];
  // black 8-ball is solid; 9/10 are striped with a white belt
  const isStriped = type === 9 || type === 10;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: isStriped
        ? `linear-gradient(180deg, ${color} 0%, ${color} 28%, #fff 28%, #fff 72%, ${color} 72%, ${color} 100%)`
        : color,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: type === 8 ? "#fff" : "#15171A",
      fontSize: size * 0.45, fontWeight: 700, fontFamily: theme.fontMono,
      boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.08), inset ${size*0.18}px ${size*0.18}px 0 rgba(255,255,255,0.35)`,
      flexShrink: 0,
    }}>
      <span style={{
        background: "#fff", color: "#15171A",
        width: size * 0.55, height: size * 0.55, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, lineHeight: 1,
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.1)",
      }}>{type}</span>
    </div>
  );
}

function TypeChip({ type, theme }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 8px 3px 4px", borderRadius: 999,
      background: theme.surfaceAlt, color: theme.text,
      fontSize: 12, fontWeight: 600, fontFamily: theme.fontBody,
      lineHeight: 1,
    }}>
      <BallPip type={type} theme={theme} size={14} />
      {BG.ballType[type]}
    </span>
  );
}

function MetaChip({ icon, label, theme, tone = "neutral" }) {
  const bg = tone === "accent" ? theme.accentSoft : theme.surfaceAlt;
  const fg = tone === "accent" ? theme.accentText : theme.textMuted;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 9px", borderRadius: 8,
      background: bg, color: fg,
      fontSize: 11.5, fontWeight: 500, fontFamily: theme.fontBody,
      letterSpacing: 0.1,
    }}>{icon}{label}</span>
  );
}

function StatusDot({ tournament, theme }) {
  const d = parseDate(tournament.date);
  const isPast = startOfDay(d) < startOfDay(TODAY);
  const isToday = sameDay(d, TODAY);
  const color = isPast ? theme.textFaint : isToday ? theme.warn : theme.accent;
  return <span style={{ width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />;
}

// ─────────────────────────────────────────────────────────────
// Header (sticky top of app)
// ─────────────────────────────────────────────────────────────
function AppHeader({ theme, isAdmin, onAdminTap, onLogout }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 18px 12px", gap: 12,
      background: theme.bg,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: theme.accent, color: theme.badgeText,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: theme.fontMono, fontWeight: 700, fontSize: 14,
        }}>8/9</div>
        <div>
          <div style={{ fontFamily: theme.fontHead, fontSize: theme.id === "club" ? 17 : 18, fontWeight: theme.id === "club" ? 500 : 600, color: theme.text, lineHeight: 1.1, letterSpacing: theme.id === "club" ? 0 : -0.3, whiteSpace: "nowrap" }}>
            {BG.appName}
          </div>
          {isAdmin && (
            <div style={{ fontSize: 10.5, color: theme.accent, fontFamily: theme.fontMono, fontWeight: 600, letterSpacing: 0.5, marginTop: 1 }}>
              {BG.adminMode.toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <button onClick={isAdmin ? onLogout : onAdminTap} style={{
        border: "none", background: isAdmin ? theme.accent : theme.surface,
        color: isAdmin ? theme.badgeText : theme.text,
        width: 36, height: 36, borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: `0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 1px ${theme.border}`,
      }} title={isAdmin ? BG.logout : BG.login}>
        <Icon.user />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Month + view + filter bar
// ─────────────────────────────────────────────────────────────
function ControlBar({ theme, year, month, onPrev, onNext, onToday, view, onView, filterCount, onFilters, showFilters }) {
  return (
    <div style={{ padding: "0 18px 10px", background: theme.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={onPrev} style={iconBtn(theme)} aria-label="Предишен месец"><Icon.chevL/></button>
          <div style={{
            fontFamily: theme.fontHead,
            fontSize: theme.id === "club" ? 26 : 26, fontWeight: theme.id === "club" ? 500 : 700,
            color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.6, lineHeight: 1.1,
            padding: "0 4px", whiteSpace: "nowrap",
          }}>
            {BG.months[month]} <span style={{ color: theme.textMuted, fontWeight: 400 }}>{year}</span>
          </div>
          <button onClick={onNext} style={iconBtn(theme)} aria-label="Следващ месец"><Icon.chevR/></button>
        </div>
        <button onClick={onToday} style={{
          border: "none", background: theme.surfaceAlt, color: theme.text,
          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          fontFamily: theme.fontBody, cursor: "pointer",
        }}>{BG.today}</button>
      </div>
      {showFilters !== false && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SegToggle theme={theme} value={view} onChange={onView}
            options={[
              { id: "cal",  label: BG.calendar, icon: <Icon.cal/> },
              { id: "list", label: BG.list,     icon: <Icon.listIcon/> },
            ]} />
          <button onClick={onFilters} style={{
            border: "none", background: filterCount ? theme.accent : theme.surface,
            color: filterCount ? theme.badgeText : theme.text,
            height: 36, padding: "0 12px", borderRadius: 10,
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, fontFamily: theme.fontBody, cursor: "pointer",
            boxShadow: filterCount ? "none" : `inset 0 0 0 1px ${theme.border}`,
          }}>
            <Icon.filter/>
            {filterCount > 0 && <span style={{
              fontVariantNumeric: "tabular-nums", fontFamily: theme.fontMono,
              fontSize: 12,
            }}>{filterCount}</span>}
          </button>
        </div>
      )}
    </div>
  );
}

function iconBtn(theme) {
  return {
    border: "none", background: "transparent", color: theme.text,
    width: 32, height: 32, borderRadius: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

function SegToggle({ theme, value, onChange, options }) {
  return (
    <div style={{
      display: "inline-flex", padding: 3, borderRadius: 10,
      background: theme.surface, boxShadow: `inset 0 0 0 1px ${theme.border}`,
      flex: 1,
    }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, border: "none",
            background: active ? theme.accent : "transparent",
            color: active ? theme.badgeText : theme.textMuted,
            padding: "6px 10px", borderRadius: 8,
            fontSize: 13, fontWeight: 600, fontFamily: theme.fontBody,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            cursor: "pointer", transition: "background .15s, color .15s",
          }}>{o.icon}{o.label}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar grid
// ─────────────────────────────────────────────────────────────
function CalendarGrid({ theme, year, month, tournamentsByDate, onDayTap }) {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  return (
    <div style={{ padding: "0 14px 24px" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4,
        padding: "0 4px 8px",
      }}>
        {BG.daysShort.map((d, i) => (
          <div key={d} style={{
            fontFamily: theme.fontMono, fontSize: 11, fontWeight: 500,
            color: i >= 5 ? theme.warn : theme.textFaint,
            textAlign: "center", letterSpacing: 0.5, textTransform: "uppercase",
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          const key = fmtKey(d);
          const dayTourns = tournamentsByDate[key] || [];
          const inMonth = d.getMonth() === month;
          const isToday = sameDay(d, TODAY);
          const isPast = startOfDay(d) < startOfDay(TODAY);
          const isWeekend = (d.getDay()+6)%7 >= 5;
          return <DayCell key={i}
            theme={theme} date={d} count={dayTourns.length}
            inMonth={inMonth} isToday={isToday} isPast={isPast} isWeekend={isWeekend}
            onTap={() => dayTourns.length > 0 && onDayTap(d)}
            hasAny={dayTourns.length > 0} />;
        })}
      </div>
    </div>
  );
}

function DayCell({ theme, date, count, inMonth, isToday, isPast, isWeekend, onTap, hasAny }) {
  const dim = !inMonth;
  return (
    <button onClick={onTap} disabled={!hasAny} style={{
      aspectRatio: "1 / 1.1",
      border: "none",
      background: isToday ? theme.accentSoft : theme.surface,
      borderRadius: theme.radiusSmall,
      display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "space-between",
      padding: "6px 7px",
      cursor: hasAny ? "pointer" : "default",
      opacity: dim ? 0.32 : 1,
      boxShadow: isToday ? `inset 0 0 0 1.5px ${theme.accent}` : `inset 0 0 0 1px ${theme.border}`,
      position: "relative",
      transition: "transform .12s",
    }}>
      <span style={{
        fontFamily: theme.fontMono,
        fontSize: 13, fontWeight: isToday ? 700 : 500,
        color: isPast && !isToday ? theme.textFaint : (isWeekend && inMonth ? theme.warn : theme.text),
        lineHeight: 1,
      }}>{date.getDate()}</span>
      {count > 0 && (
        <span style={{
          alignSelf: "flex-end",
          minWidth: 18, height: 18, padding: "0 5px",
          borderRadius: 9,
          background: isPast ? theme.surfaceAlt : theme.accent,
          color: isPast ? theme.textMuted : theme.badgeText,
          fontFamily: theme.fontMono, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1,
        }}>{count}</span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// List view
// ─────────────────────────────────────────────────────────────
function ListView({ theme, year, month, filteredTournaments, onTap, isAdmin, onEdit, onDelete }) {
  // Group by day within the visible month
  const grouped = useMemo(() => {
    const m = {};
    filteredTournaments.forEach((t) => {
      const d = parseDate(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const k = fmtKey(d);
      (m[k] = m[k] || []).push(t);
    });
    return Object.keys(m).sort().map((k) => ({ key: k, date: parseDate(k), items: m[k].sort((a,b) => a.startHour.localeCompare(b.startHour)) }));
  }, [filteredTournaments, year, month]);

  if (!grouped.length) {
    return <div style={{ padding: "40px 24px", textAlign: "center", color: theme.textMuted, fontFamily: theme.fontBody, fontSize: 14 }}>
      {BG.noTournaments}
    </div>;
  }

  return (
    <div style={{ padding: "0 18px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
      {grouped.map(({ key, date, items }) => {
        const isPast = startOfDay(date) < startOfDay(TODAY);
        const isToday = sameDay(date, TODAY);
        const dow = (date.getDay()+6)%7;
        const isWeekend = dow >= 5;
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "0 4px 8px" }}>
              <span style={{
                fontFamily: theme.fontMono, fontSize: 24, fontWeight: 600,
                color: isPast ? theme.textFaint : theme.text, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>{pad2(date.getDate())}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: theme.fontBody, fontSize: 11, color: isWeekend ? theme.warn : theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  {BG.daysFull[dow]}
                </span>
                <span style={{ fontFamily: theme.fontBody, fontSize: 11, color: theme.textFaint }}>
                  {isToday ? BG.today : isPast ? BG.past : BG.upcoming} · {items.length} {items.length === 1 ? BG.tournament : BG.tournaments}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((t) => <TournamentRow key={t.id} t={t} theme={theme} onTap={() => onTap(t)} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TournamentRow({ t, theme, onTap, isAdmin, onEdit, onDelete, compact }) {
  const d = parseDate(t.date);
  const isPast = startOfDay(d) < startOfDay(TODAY);
  return (
    <div style={{
      background: theme.surface, borderRadius: theme.radius,
      boxShadow: `inset 0 0 0 1px ${theme.border}`,
      display: "flex", alignItems: "stretch", overflow: "hidden",
      opacity: isPast ? 0.72 : 1,
    }}>
      <button onClick={onTap} style={{
        flex: 1, display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        border: "none", background: "transparent", textAlign: "left", cursor: "pointer",
      }}>
        <BallPip type={t.type} theme={theme} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <StatusDot tournament={t} theme={theme} />
            <span style={{
              fontFamily: theme.fontHead, fontSize: 15, fontWeight: 600,
              color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{t.name}</span>
            <span style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.textFaint, flexShrink: 0 }}>
              · {t.version}
            </span>
          </div>
          <div style={{
            fontFamily: theme.fontBody, fontSize: 12, color: theme.textMuted,
            display: "flex", alignItems: "center", gap: 8, lineHeight: 1.2,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: theme.fontMono, fontVariantNumeric: "tabular-nums" }}>{t.startHour}</span>
            <span>·</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.club}</span>
            <span>·</span>
            <span>{t.city}</span>
          </div>
        </div>
      </button>
      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${theme.border}` }}>
          <button onClick={() => onEdit(t)} style={adminInlineBtn(theme)} title={BG.edit}><Icon.edit/></button>
          <button onClick={() => onDelete(t)} style={{ ...adminInlineBtn(theme), color: theme.danger, borderTop: `1px solid ${theme.border}` }} title={BG.delete}><Icon.trash/></button>
        </div>
      )}
    </div>
  );
}

function adminInlineBtn(theme) {
  return {
    border: "none", background: "transparent", color: theme.textMuted,
    width: 40, flex: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

// ─────────────────────────────────────────────────────────────
// Day popup (bottom sheet inside the device)
// ─────────────────────────────────────────────────────────────
function DayPopup({ theme, date, tournaments, onClose, onSelect, isAdmin, onEdit, onDelete, onAdd }) {
  if (!date) return null;
  const isPast = startOfDay(date) < startOfDay(TODAY);
  const isToday = sameDay(date, TODAY);
  const sorted = [...tournaments].sort((a,b) => a.startHour.localeCompare(b.startHour));
  return (
    <Sheet theme={theme} onClose={onClose}>
      <div style={{ padding: "4px 22px 0" }}>
        <div style={{
          fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted,
          textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600,
          marginBottom: 2,
        }}>
          {isToday ? BG.today : isPast ? BG.past : BG.upcoming}
        </div>
        <div style={{
          fontFamily: theme.fontHead,
          fontSize: theme.id === "club" ? 28 : 22, fontWeight: theme.id === "club" ? 500 : 700,
          color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.4, lineHeight: 1.15,
        }}>{fmtDateLong(date)}</div>
        <div style={{
          fontFamily: theme.fontBody, fontSize: 13, color: theme.textMuted, marginTop: 4,
        }}>{sorted.length} {sorted.length === 1 ? BG.tournament : BG.tournaments}</div>
      </div>
      <div style={{
        padding: "16px 18px 18px",
        display: "flex", flexDirection: "column", gap: 8,
        maxHeight: 380, overflowY: "auto",
      }}>
        {sorted.map((t) => <TournamentRow key={t.id} t={t} theme={theme} onTap={() => onSelect(t)} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />)}
        {isAdmin && (
          <button onClick={() => onAdd(date)} style={{
            marginTop: 4, border: `1.5px dashed ${theme.borderStrong}`,
            background: "transparent", color: theme.accent,
            padding: "12px", borderRadius: theme.radius,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}><Icon.plus/> {BG.addTournament}</button>
        )}
      </div>
    </Sheet>
  );
}

function Sheet({ theme, children, onClose, fullHeight }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(2px)" }} />
      <div style={{
        background: theme.bg, borderRadius: `${theme.radiusLg}px ${theme.radiusLg}px 0 0`,
        boxShadow: "0 -8px 30px rgba(0,0,0,0.18)",
        paddingBottom: 42, // home indicator clearance
        maxHeight: fullHeight ? "calc(100% - 40px)" : "75%",
        display: "flex", flexDirection: "column",
        animation: "sheet-rise .25s cubic-bezier(.2,.7,.3,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 6px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.borderStrong }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tournament detail (full-screen pushed)
// ─────────────────────────────────────────────────────────────
function TournamentDetail({ theme, t, onBack, isAdmin, onEdit, onDelete }) {
  const d = parseDate(t.date);
  const isPast = startOfDay(d) < startOfDay(TODAY);
  const isToday = sameDay(d, TODAY);
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.bg, zIndex: 30, display: "flex", flexDirection: "column", animation: "screen-in .22s ease-out" }}>
      {/* Top bar */}
      <div style={{
        paddingTop: 54, padding: "54px 14px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: theme.bg,
      }}>
        <button onClick={onBack} style={{
          border: "none", background: theme.surface, color: theme.text,
          padding: "7px 12px 7px 8px", borderRadius: 999,
          display: "flex", alignItems: "center", gap: 4,
          fontFamily: theme.fontBody, fontSize: 14, fontWeight: 500, cursor: "pointer",
          boxShadow: `inset 0 0 0 1px ${theme.border}`,
        }}><Icon.back/> {BG.back}</button>
        <div style={{
          fontFamily: theme.fontMono, fontSize: 11, fontWeight: 600,
          color: isPast ? theme.textFaint : isToday ? theme.warn : theme.accent,
          padding: "5px 9px", borderRadius: 999,
          background: isPast ? theme.surfaceAlt : isToday ? "rgba(181,117,42,0.12)" : theme.accentSoft,
          letterSpacing: 0.5, textTransform: "uppercase",
        }}>{isToday ? BG.today : isPast ? BG.past : BG.upcoming}</div>
      </div>

      {/* Hero */}
      <div style={{ padding: "10px 22px 22px", flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <BallPip type={t.type} theme={theme} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
              {BG.ballType[t.type]} · {BG.version} {t.version}
            </div>
            <div style={{
              fontFamily: theme.fontHead,
              fontSize: theme.id === "club" ? 30 : 24, fontWeight: theme.id === "club" ? 500 : 700,
              color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.5,
              lineHeight: 1.1, marginTop: 4,
              wordBreak: "break-word",
            }}>{t.name}</div>
          </div>
        </div>

        {/* Date + time card */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          background: theme.surface, borderRadius: theme.radius,
          boxShadow: `inset 0 0 0 1px ${theme.border}`,
          marginBottom: 14,
        }}>
          <DetailKv theme={theme} icon={<Icon.cal/>} label="Дата" value={fmtDateLong(d)} />
          <DetailKv theme={theme} icon={<Icon.clock/>} label={BG.startHour} value={t.startHour} mono separator />
        </div>

        {/* Location card */}
        <div style={{
          background: theme.surface, borderRadius: theme.radius,
          boxShadow: `inset 0 0 0 1px ${theme.border}`,
          padding: "14px 16px", marginBottom: 14,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ color: theme.accent, marginTop: 2 }}><Icon.pin/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: theme.fontHead, fontSize: 17, fontWeight: 600, color: theme.text, lineHeight: 1.2 }}>{t.club}</div>
            <div style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{t.city}</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel theme={theme}>{BG.details}</SectionLabel>
          <div style={{
            background: theme.surface, borderRadius: theme.radius,
            boxShadow: `inset 0 0 0 1px ${theme.border}`, padding: "4px 16px",
          }}>
            <KvRow theme={theme} label={BG.level} value={t.level === "pro" ? BG.pro : t.level === "amateur" ? BG.amateur : BG.both} />
            <KvRow theme={theme} label={BG.handicap} value={t.handicap ? BG.yes : BG.no} accent={t.handicap} icon={<Icon.handicap/>} />
            <KvRow theme={theme} label={BG.dressCode} value={t.dressCode ? BG.yes : BG.no} accent={t.dressCode} icon={<Icon.shirt/>} last/>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button onClick={() => onEdit(t)} style={{
              flex: 1, padding: "12px", border: "none", background: theme.accent, color: theme.badgeText,
              borderRadius: theme.radius, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><Icon.edit/> {BG.edit}</button>
            <button onClick={() => onDelete(t)} style={{
              padding: "12px 16px", border: "none", background: "transparent",
              boxShadow: `inset 0 0 0 1px ${theme.danger}`, color: theme.danger,
              borderRadius: theme.radius, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><Icon.trash/> {BG.delete}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailKv({ theme, icon, label, value, mono, separator }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderLeft: separator ? `1px solid ${theme.border}` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: theme.textMuted, fontFamily: theme.fontBody, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {icon}{label}
      </div>
      <div style={{ fontFamily: mono ? theme.fontMono : theme.fontHead, fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 4, lineHeight: 1.2, fontVariantNumeric: mono ? "tabular-nums" : "normal" }}>
        {value}
      </div>
    </div>
  );
}

function KvRow({ theme, label, value, accent, icon, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: last ? "none" : `1px solid ${theme.border}`,
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: theme.textMuted, fontFamily: theme.fontBody, fontSize: 13 }}>
        {icon && <span style={{ color: accent ? theme.accent : theme.textFaint }}>{icon}</span>}
        {label}
      </span>
      <span style={{
        fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600,
        color: accent ? theme.accent : theme.text,
      }}>{value}</span>
    </div>
  );
}

function SectionLabel({ theme, children }) {
  return <div style={{
    fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600,
    padding: "0 4px 8px",
  }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────
// Filters sheet
// ─────────────────────────────────────────────────────────────
function FiltersSheet({ theme, filters, onChange, onClose, onReset }) {
  const f = filters;
  const set = (patch) => onChange({ ...f, ...patch });
  const toggleArr = (key, val) => set({ [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val] });
  return (
    <Sheet theme={theme} onClose={onClose} fullHeight>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 18px 14px",
      }}>
        <button onClick={onReset} style={{ border: "none", background: "transparent", color: theme.textMuted, fontFamily: theme.fontBody, fontSize: 14, cursor: "pointer", padding: 0 }}>{BG.clearAll}</button>
        <div style={{ fontFamily: theme.fontHead, fontSize: 18, fontWeight: 600, color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.2 }}>{BG.filters}</div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: theme.accent, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}>{BG.done}</button>
      </div>
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "0 18px 18px",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {/* Search */}
        <FilterGroup theme={theme} title={BG.search}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: theme.textFaint }}><Icon.search/></div>
            <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={BG.searchPlaceholder} style={{
              width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 36px",
              borderRadius: theme.radius, border: "none",
              background: theme.surface, color: theme.text,
              fontFamily: theme.fontBody, fontSize: 14,
              boxShadow: `inset 0 0 0 1px ${theme.border}`,
              outline: "none",
            }}/>
          </div>
        </FilterGroup>

        {/* Type */}
        <FilterGroup theme={theme} title={BG.type}>
          <div style={{ display: "flex", gap: 8 }}>
            {[8,9,10].map((t) => {
              const active = f.types.includes(t);
              return (
                <button key={t} onClick={() => toggleArr("types", t)} style={{
                  flex: 1, padding: "10px 6px", borderRadius: theme.radius,
                  border: "none",
                  background: active ? theme.accent : theme.surface,
                  color: active ? theme.badgeText : theme.text,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: active ? "none" : `inset 0 0 0 1px ${theme.border}`,
                }}>
                  <BallPip type={t} theme={theme} size={18}/>
                  {BG.ballType[t]}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        {/* Level */}
        <FilterGroup theme={theme} title={BG.level}>
          <div style={{ display: "flex", gap: 8 }}>
            {[{id:"pro",l:BG.pro},{id:"amateur",l:BG.amateur},{id:"both",l:BG.both}].map((o) => (
              <ChipBtn key={o.id} theme={theme} active={f.levels.includes(o.id)} onClick={() => toggleArr("levels", o.id)}>{o.l}</ChipBtn>
            ))}
          </div>
        </FilterGroup>

        {/* Day kind */}
        <FilterGroup theme={theme} title="Дни">
          <div style={{ display: "flex", gap: 8 }}>
            {[{id:"any",l:BG.all},{id:"workday",l:BG.workdays},{id:"weekend",l:BG.weekends}].map((o) => (
              <ChipBtn key={o.id} theme={theme} active={f.dayKind === o.id} onClick={() => set({ dayKind: o.id })}>{o.l}</ChipBtn>
            ))}
          </div>
        </FilterGroup>

        {/* Handicap */}
        <FilterGroup theme={theme} title={BG.handicap}>
          <div style={{ display: "flex", gap: 8 }}>
            {[{id:"any",l:BG.any},{id:"yes",l:BG.yes},{id:"no",l:BG.no}].map((o) => (
              <ChipBtn key={o.id} theme={theme} active={f.handicap === o.id} onClick={() => set({ handicap: o.id })}>{o.l}</ChipBtn>
            ))}
          </div>
        </FilterGroup>

        {/* Dress code */}
        <FilterGroup theme={theme} title={BG.dressCode}>
          <div style={{ display: "flex", gap: 8 }}>
            {[{id:"any",l:BG.any},{id:"yes",l:BG.yes},{id:"no",l:BG.no}].map((o) => (
              <ChipBtn key={o.id} theme={theme} active={f.dressCode === o.id} onClick={() => set({ dressCode: o.id })}>{o.l}</ChipBtn>
            ))}
          </div>
        </FilterGroup>

        {/* City */}
        <FilterGroup theme={theme} title={BG.city}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CITIES.map((c) => (
              <ChipBtn key={c} theme={theme} active={f.cities.includes(c)} onClick={() => toggleArr("cities", c)} compact>{c}</ChipBtn>
            ))}
          </div>
        </FilterGroup>

        {/* Club */}
        <FilterGroup theme={theme} title={BG.club}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CLUBS.map((c) => (
              <ChipBtn key={c} theme={theme} active={f.clubs.includes(c)} onClick={() => toggleArr("clubs", c)} compact>{c}</ChipBtn>
            ))}
          </div>
        </FilterGroup>
      </div>
    </Sheet>
  );
}

function FilterGroup({ theme, title, children }) {
  return (
    <div>
      <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ChipBtn({ theme, active, onClick, children, compact }) {
  return (
    <button onClick={onClick} style={{
      padding: compact ? "6px 11px" : "9px 12px",
      borderRadius: 999,
      border: "none",
      background: active ? theme.accent : theme.surface,
      color: active ? theme.badgeText : theme.text,
      fontFamily: theme.fontBody, fontSize: compact ? 12 : 13, fontWeight: 600,
      cursor: "pointer",
      boxShadow: active ? "none" : `inset 0 0 0 1px ${theme.border}`,
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin login
// ─────────────────────────────────────────────────────────────
function AdminLogin({ theme, onLogin, onClose }) {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("••••••••");
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.bg, zIndex: 40, display: "flex", flexDirection: "column", animation: "screen-in .22s ease-out" }}>
      <div style={{ paddingTop: 54, padding: "54px 14px 8px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{
          border: "none", background: theme.surface, color: theme.textMuted,
          width: 36, height: 36, borderRadius: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: `inset 0 0 0 1px ${theme.border}`,
        }}><Icon.close/></button>
      </div>
      <div style={{ padding: "20px 24px 32px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: theme.accent, color: theme.badgeText,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 22,
          fontFamily: theme.fontMono, fontWeight: 700, fontSize: 24,
        }}>8/9</div>
        <div style={{
          fontFamily: theme.fontHead,
          fontSize: theme.id === "club" ? 30 : 26, fontWeight: theme.id === "club" ? 500 : 700,
          color: theme.text, letterSpacing: theme.id === "club" ? 0 : -0.5,
          marginBottom: 6, lineHeight: 1.1,
        }}>{BG.loginTitle}</div>
        <div style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.textMuted, marginBottom: 30, lineHeight: 1.5 }}>
          {BG.loginHint}
        </div>
        <Field theme={theme} label={BG.username} value={u} onChange={setU} />
        <Field theme={theme} label={BG.password} value={p} onChange={setP} type="password" />
        <button onClick={onLogin} style={{
          marginTop: 18, padding: "13px",
          background: theme.accent, color: theme.badgeText, border: "none",
          borderRadius: theme.radius,
          fontFamily: theme.fontBody, fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>{BG.login}</button>
      </div>
    </div>
  );
}

function Field({ theme, label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} style={{
        width: "100%", boxSizing: "border-box", padding: "12px 14px",
        background: theme.surface, color: theme.text,
        border: "none", borderRadius: theme.radius,
        fontFamily: theme.fontBody, fontSize: 15,
        boxShadow: `inset 0 0 0 1px ${theme.border}`,
        outline: "none",
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin tournament form (add/edit)
// ─────────────────────────────────────────────────────────────
function TournamentForm({ theme, t, onSave, onCancel, onDelete }) {
  const isNew = !t || !t.id;
  const [draft, setDraft] = useState(() => t ? {...t} : {
    id: null, name: "", version: "1", type: 9, level: "pro",
    handicap: false, city: "София", club: "Pool Pro Sofia",
    date: fmtKey(TODAY), startHour: "18:00", dressCode: false,
  });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.bg, zIndex: 40, display: "flex", flexDirection: "column", animation: "screen-in .22s ease-out" }}>
      <div style={{ paddingTop: 54, padding: "54px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onCancel} style={{ border: "none", background: "transparent", color: theme.textMuted, fontFamily: theme.fontBody, fontSize: 15, cursor: "pointer", padding: "6px 4px" }}>{BG.cancel}</button>
        <div style={{ fontFamily: theme.fontHead, fontSize: 16, fontWeight: 600, color: theme.text }}>{isNew ? BG.newTournament : BG.editTournament}</div>
        <button onClick={() => onSave(draft)} disabled={!draft.name.trim()} style={{
          border: "none", background: "transparent",
          color: draft.name.trim() ? theme.accent : theme.textFaint,
          fontFamily: theme.fontBody, fontSize: 15, fontWeight: 700,
          cursor: draft.name.trim() ? "pointer" : "default", padding: "6px 4px",
        }}>{BG.save}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 24px" }}>
        <Field theme={theme} label={BG.name} value={draft.name} onChange={(v) => set("name", v)} placeholder="Напр. Sofia Spring Open" />
        <Field theme={theme} label={BG.version} value={draft.version} onChange={(v) => set("version", v)} placeholder="1, 2, Q1…" />

        <FormLabel theme={theme} title={BG.type}>
          <div style={{ display: "flex", gap: 8 }}>
            {[8,9,10].map((tt) => (
              <button key={tt} onClick={() => set("type", tt)} style={pillBtn(theme, draft.type === tt)}>
                <BallPip type={tt} theme={theme} size={18}/>{BG.ballType[tt]}
              </button>
            ))}
          </div>
        </FormLabel>

        <FormLabel theme={theme} title={BG.level}>
          <div style={{ display: "flex", gap: 8 }}>
            {[{id:"pro",l:BG.pro},{id:"amateur",l:BG.amateur},{id:"both",l:BG.both}].map((o) => (
              <button key={o.id} onClick={() => set("level", o.id)} style={pillBtn(theme, draft.level === o.id)}>{o.l}</button>
            ))}
          </div>
        </FormLabel>

        <FormLabel theme={theme} title={BG.city}>
          <Select theme={theme} value={draft.city} onChange={(v) => set("city", v)} options={CITIES}/>
        </FormLabel>

        <FormLabel theme={theme} title={BG.club}>
          <Select theme={theme} value={draft.club} onChange={(v) => set("club", v)} options={CLUBS}/>
        </FormLabel>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginTop: 14 }}>
          <Field theme={theme} label="Дата" value={draft.date} onChange={(v) => set("date", v)} placeholder="2026-05-20" />
          <Field theme={theme} label={BG.startHour} value={draft.startHour} onChange={(v) => set("startHour", v)} placeholder="18:00" />
        </div>

        <ToggleRow theme={theme} icon={<Icon.handicap/>} label={BG.handicap} value={draft.handicap} onChange={(v) => set("handicap", v)} />
        <ToggleRow theme={theme} icon={<Icon.shirt/>} label={BG.dressCode} value={draft.dressCode} onChange={(v) => set("dressCode", v)} />

        {!isNew && (
          <button onClick={() => onDelete(draft)} style={{
            marginTop: 24, padding: "13px",
            border: "none", background: "transparent", color: theme.danger,
            boxShadow: `inset 0 0 0 1px ${theme.danger}`,
            borderRadius: theme.radius, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600,
            cursor: "pointer", width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}><Icon.trash/> {BG.delete}</button>
        )}
      </div>
    </div>
  );
}

function pillBtn(theme, active) {
  return {
    flex: 1, padding: "9px 8px", borderRadius: theme.radius,
    border: "none",
    background: active ? theme.accent : theme.surface,
    color: active ? theme.badgeText : theme.text,
    fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: active ? "none" : `inset 0 0 0 1px ${theme.border}`,
  };
}

function FormLabel({ theme, title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function Select({ theme, value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        appearance: "none", WebkitAppearance: "none",
        width: "100%", boxSizing: "border-box", padding: "12px 36px 12px 14px",
        background: theme.surface, color: theme.text,
        border: "none", borderRadius: theme.radius,
        fontFamily: theme.fontBody, fontSize: 15,
        boxShadow: `inset 0 0 0 1px ${theme.border}`,
        outline: "none", cursor: "pointer",
      }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: theme.textMuted, pointerEvents: "none" }}>
        <Icon.chevDown/>
      </div>
    </div>
  );
}

function ToggleRow({ theme, icon, label, value, onChange }) {
  return (
    <div style={{
      marginTop: 14, padding: "12px 14px",
      background: theme.surface, borderRadius: theme.radius,
      boxShadow: `inset 0 0 0 1px ${theme.border}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ color: value ? theme.accent : theme.textMuted }}>{icon}</div>
      <div style={{ flex: 1, fontFamily: theme.fontBody, fontSize: 15, fontWeight: 500, color: theme.text }}>{label}</div>
      <button onClick={() => onChange(!value)} style={{
        position: "relative", width: 44, height: 26, border: "none",
        borderRadius: 13, padding: 0,
        background: value ? theme.accent : theme.surfaceAlt, cursor: "pointer",
        transition: "background .15s",
      }}>
        <div style={{
          position: "absolute", top: 2, left: value ? 20 : 2,
          width: 22, height: 22, borderRadius: 11, background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          transition: "left .15s",
        }}/>
      </button>
    </div>
  );
}

// Confirm dialog
function ConfirmDialog({ theme, title, body, onConfirm, onCancel, danger }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}/>
      <div style={{
        position: "relative", background: theme.bg, borderRadius: theme.radiusLg,
        padding: "20px 22px 16px", width: "100%", maxWidth: 320,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontFamily: theme.fontHead, fontSize: 17, fontWeight: 600, color: theme.text, marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.textMuted, marginBottom: 18, lineHeight: 1.5 }}>{body}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px", border: "none", background: theme.surface, color: theme.text,
            borderRadius: theme.radius, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
            boxShadow: `inset 0 0 0 1px ${theme.border}`,
          }}>{BG.cancel}</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px", border: "none",
            background: danger ? theme.danger : theme.accent,
            color: "#fff",
            borderRadius: theme.radius, fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{danger ? BG.delete : BG.done}</button>
        </div>
      </div>
    </div>
  );
}

// Floating add button (admin only on main view)
function FAB({ theme, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "absolute", bottom: 50, right: 20, zIndex: 8,
      width: 56, height: 56, borderRadius: 28,
      background: theme.accent, color: theme.badgeText, border: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
      cursor: "pointer",
    }}><Icon.plus width="22" height="22"/></button>
  );
}

Object.assign(window, {
  monthMatrix, fmtKey, parseDate, sameDay, startOfDay, fmtDateLong, fmtDateShort,
  tournamentMatchesFilters, countFilters, DEFAULT_FILTERS,
  BallPip, TypeChip, MetaChip, StatusDot, Icon,
  AppHeader, ControlBar, CalendarGrid, ListView, TournamentRow,
  DayPopup, TournamentDetail, FiltersSheet, AdminLogin, TournamentForm,
  ConfirmDialog, FAB,
});

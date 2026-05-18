// App wrapper for the Billiards Tournaments prototype.
// Manages navigation state and renders inside an IOSDevice frame.

const { useState: _useState, useMemo: _useMemo, useEffect: _useEffect } = React;

function BilliardsApp({ theme, startMonth, startView = "cal", initialAdmin = false, showFilters = true }) {
  // Each artboard has its own independent state.
  const [view, setView] = _useState(startView); // 'cal' | 'list'
  const [cursor, setCursor] = _useState(() => startMonth || { y: TODAY.getFullYear(), m: TODAY.getMonth() });
  const [tournaments, setTournaments] = _useState(() => TOURNAMENTS.map((x) => ({...x})));
  const [filters, setFilters] = _useState(DEFAULT_FILTERS);
  const [stack, setStack] = _useState([]);     // overlay stack: 'filters' | 'login' | 'form' | 'detail'
  const [selectedDate, setSelectedDate] = _useState(null);
  const [selectedTournament, setSelectedTournament] = _useState(null);
  const [editingDraft, setEditingDraft] = _useState(null);
  const [pendingDelete, setPendingDelete] = _useState(null);
  const [isAdmin, setIsAdmin] = _useState(initialAdmin);

  const filtered = _useMemo(() => tournaments.filter((t) => tournamentMatchesFilters(t, filters)), [tournaments, filters]);
  const tournamentsByDate = _useMemo(() => {
    const m = {};
    filtered.forEach((t) => { (m[t.date] = m[t.date] || []).push(t); });
    return m;
  }, [filtered]);

  const fCount = countFilters(filters);

  const goPrev = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const goNext = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  const goToday = () => { setCursor({ y: TODAY.getFullYear(), m: TODAY.getMonth() }); };

  const openDay = (d) => setSelectedDate(d);
  const closeDay = () => setSelectedDate(null);
  const openDetail = (t) => { setSelectedTournament(t); setStack((s) => [...s, "detail"]); };
  const closeDetail = () => { setStack((s) => s.slice(0, -1)); setTimeout(() => setSelectedTournament(null), 200); };
  const openFilters = () => setStack((s) => [...s, "filters"]);
  const closeFilters = () => setStack((s) => s.filter((x) => x !== "filters"));
  const openLogin = () => setStack((s) => [...s, "login"]);
  const closeLogin = () => setStack((s) => s.filter((x) => x !== "login"));
  const openForm = (t) => { setEditingDraft(t); setStack((s) => [...s, "form"]); };
  const closeForm = () => { setStack((s) => s.filter((x) => x !== "form")); setEditingDraft(null); };

  const saveTournament = (draft) => {
    if (draft.id) {
      setTournaments((arr) => arr.map((t) => t.id === draft.id ? draft : t));
    } else {
      const id = Math.max(0, ...tournaments.map((t) => t.id)) + 1;
      setTournaments((arr) => [...arr, { ...draft, id }]);
    }
    closeForm();
  };
  const askDelete = (t) => setPendingDelete(t);
  const confirmDelete = () => {
    setTournaments((arr) => arr.filter((t) => t.id !== pendingDelete.id));
    setPendingDelete(null);
    if (stack[stack.length - 1] === "form") closeForm();
    if (stack[stack.length - 1] === "detail") closeDetail();
  };

  const hasDetail = stack.includes("detail") && selectedTournament;
  const hasFilters = stack.includes("filters");
  const hasLogin = stack.includes("login");
  const hasForm = stack.includes("form");

  return (
    <IOSDevice width={402} height={874} dark={theme.iosDark}>
      <div style={{ position: "relative", height: "100%", background: theme.bg, color: theme.text, fontFamily: theme.fontBody }}>
        {/* Sticky top: status bar zone + header + control bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 5, background: theme.bg, paddingTop: 54 }}>
          <AppHeader theme={theme} isAdmin={isAdmin} onAdminTap={openLogin} onLogout={() => setIsAdmin(false)} />
          <ControlBar
            theme={theme}
            year={cursor.y} month={cursor.m}
            onPrev={goPrev} onNext={goNext} onToday={goToday}
            view={view} onView={setView}
            filterCount={fCount} onFilters={openFilters}
            showFilters={showFilters}
          />
        </div>

        <div style={{ paddingBottom: 56 }}>
          {view === "cal"
            ? <CalendarGrid theme={theme} year={cursor.y} month={cursor.m} tournamentsByDate={tournamentsByDate} onDayTap={openDay} />
            : <ListView theme={theme} year={cursor.y} month={cursor.m} filteredTournaments={filtered} onTap={openDetail} isAdmin={isAdmin} onEdit={openForm} onDelete={askDelete} />
          }
        </div>

        {/* Day popup (bottom sheet) */}
        {selectedDate && (
          <DayPopup
            theme={theme}
            date={selectedDate}
            tournaments={tournamentsByDate[fmtKey(selectedDate)] || []}
            onClose={closeDay}
            onSelect={openDetail}
            isAdmin={isAdmin}
            onEdit={openForm}
            onDelete={askDelete}
            onAdd={(d) => openForm({ id: null, name: "", version: "1", type: 9, level: "pro", handicap: false, city: "София", club: "Pool Pro Sofia", date: fmtKey(d), startHour: "18:00", dressCode: false })}
          />
        )}

        {/* Admin FAB on main view */}
        {isAdmin && !hasDetail && !hasForm && !hasLogin && !hasFilters && !selectedDate && (
          <FAB theme={theme} onClick={() => openForm({ id: null, name: "", version: "1", type: 9, level: "pro", handicap: false, city: "София", club: "Pool Pro Sofia", date: fmtKey(TODAY), startHour: "18:00", dressCode: false })} />
        )}

        {/* Detail screen */}
        {hasDetail && (
          <TournamentDetail
            theme={theme}
            t={selectedTournament}
            onBack={closeDetail}
            isAdmin={isAdmin}
            onEdit={openForm}
            onDelete={askDelete}
          />
        )}

        {/* Filters sheet */}
        {hasFilters && (
          <FiltersSheet
            theme={theme}
            filters={filters}
            onChange={setFilters}
            onClose={closeFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        )}

        {/* Admin login */}
        {hasLogin && (
          <AdminLogin theme={theme} onLogin={() => { setIsAdmin(true); closeLogin(); }} onClose={closeLogin} />
        )}

        {/* Tournament form (add/edit) */}
        {hasForm && (
          <TournamentForm theme={theme} t={editingDraft} onSave={saveTournament} onCancel={closeForm} onDelete={askDelete} />
        )}

        {/* Delete confirm */}
        {pendingDelete && (
          <ConfirmDialog theme={theme}
            title={BG.deleteConfirm} body={BG.deleteConfirmBody}
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
            danger
          />
        )}
      </div>
    </IOSDevice>
  );
}

window.BilliardsApp = BilliardsApp;

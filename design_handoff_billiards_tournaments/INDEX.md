# Handoff package — file index

```
design_handoff_billiards_tournaments/
├── README.md              ← Start here. Overview + how to use this folder.
├── CURSOR_PROMPT.md       ← Copy-paste agent prompt for Cursor.
├── DESIGN_TOKENS.md       ← Colors, type, spacing, radii — all 3 themes.
├── SCREENS.md             ← Per-screen spec: layout, components, copy, states.
├── INTERACTIONS.md        ← Navigation graph, state machine, animations, a11y.
├── DATA_MODEL.md          ← Types, seed data, service shape, validation.
├── INDEX.md               ← This file.
└── reference/             ← Interactive design prototype (open in a browser).
    ├── Billiards Tournaments.html   ← Entry point — open this.
    ├── app.jsx                      ← Top-level state + screen stack
    ├── screens.jsx                  ← All screens, components, helpers, icons
    ├── data.js                      ← Bulgarian strings + 30 seed tournaments
    ├── themes.js                    ← clean / dark / club theme objects
    ├── ios-frame.jsx                ← iOS device bezel (presentation only)
    ├── design-canvas.jsx            ← Side-by-side canvas (presentation only)
    └── tweaks-panel.jsx             ← In-design toggles (presentation only)
```

## How to view the prototype

1. Open a terminal in `reference/`.
2. `python3 -m http.server 8000` (or any static file server).
3. Visit `http://localhost:8000/Billiards Tournaments.html`.

You'll see three iPhone frames side by side, each running a full interactive copy of the app — try every flow before implementing.

## How to use this with Cursor

1. Paste `CURSOR_PROMPT.md` into Cursor's agent chat as the first message.
2. Add the `design_handoff_billiards_tournaments/` folder to the workspace so the agent can read every file.
3. Tell the agent your target framework (or accept the default: React + Vite + TypeScript).
4. Implement screens in the order listed in `CURSOR_PROMPT.md → Build order`.

# Namigatchi

A long-arc incremental/idle game with cosmic horror flavor. You wake in a poisoned post-apocalyptic wasteland. You find a rock that talks to you. You progress through eight eras (Scavenger → Cosmic) while the rock evolves alongside you, your hidden alignment crystallizes, and the world transforms around you.

Built in React + Vite. Browser-only for now, eventually Steam-bound.

## Quick start

```bash
git clone https://github.com/Ayeager2/namigatchi.git
cd namigatchi
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Documentation

- **[`docs/HANDOFF.md`](docs/HANDOFF.md)** — start here. Onboarding, current state, how to resume work on another machine or in a new conversation.
- **[`docs/roadmap.md`](docs/roadmap.md)** — vision, era ladder, design decisions.
- **[`docs/architecture.md`](docs/architecture.md)** — structural design (v1 audit + v2 addendum).
- **[`docs/systems.md`](docs/systems.md)** — every gameplay system's current state, with status legend.
- **[`tools/README.md`](tools/README.md)** — dev tools (audio import wizard, etc.).

## Scripts

```bash
npm run dev          # dev server with hot reload
npm run build        # production build
npm run preview      # preview production build
npm run lint         # ESLint
npm run add-audio    # CLI wizard to import a music track or SFX
```

## Project structure

```
src/
  content/       game content as pure data (resources, buildings, research, audio, ...)
  state/         persistent + run state, save/load, reducer, store hook, settings
  systems/       gameplay logic (gathering, research, building, threats, events, audio, ...)
  ui/            React components (Shell, panels, modals, settings)
  util/          pure helpers (RNG, etc.)
public/audio/    music + sfx files
tools/           dev scripts (e.g. add-audio.js)
docs/            project documentation
```

## Commit conventions

Solo project, no strict rules. Prefer descriptive messages that summarize the feature added or change made.

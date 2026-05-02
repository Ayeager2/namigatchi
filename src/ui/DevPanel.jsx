// Dev / debug panel. Skip-the-grind testing interface.
//
// Toggles via Ctrl+Shift+D. Only renders when import.meta.env.DEV is true,
// or when settings.devUnlocked is set (escape hatch for testing in a
// production build). All actions go through devPatch() which applies a
// pure mutator from systems/dev.js.

import { useEffect, useState } from "react";
import * as dev from "../systems/dev.js";
import { getAllResources } from "../content/resources.js";
import { getAllBuildings } from "../content/buildings.js";
import { getAllResearch } from "../content/research.js";
import { getAllTools } from "../content/tools.js";
import { getActiveSkills } from "../content/skills.js";
import { getAllEvents } from "../content/events.js";
import { computeEra } from "../systems/era.js";

// Whether the dev panel is allowed to be shown at all.
export function isDevAvailable(settings) {
  // Vite injects this; in production it's false.
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  // Escape hatch — settings can flip this on for prod testing.
  return !!settings?.devUnlocked;
}

function Section({ title, children }) {
  return (
    <div className="dev-section">
      <h3>{title}</h3>
      <div className="dev-section-body">{children}</div>
    </div>
  );
}

function Btn({ label, onClick, danger = false }) {
  return (
    <button
      className={`dev-btn ${danger ? "dev-btn--danger" : ""}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export default function DevPanel({ state, actions, onClose }) {
  const apply = (patch) => actions.devPatch(patch);

  const era = computeEra(state);
  const inv = state.run.inventory || {};

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--dev"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Dev panel"
      >
        <header className="modal-header dev-header">
          <div>
            <h2>🛠️ Dev Panel</h2>
            <p className="muted modal-subtitle">
              Era {era} · {Object.keys(state.run.built || {}).length} built ·{" "}
              {Object.keys(state.run.researched || {}).length} researched · Echoes{" "}
              {state.persistent.echoes}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="modal-body dev-body">
          <Section title="One-shots">
            <Btn label="🚀 Unlock everything (Era 1)" onClick={() => apply(dev.devUnlockAll(state))} />
            <Btn label="Jump to Era 1" onClick={() => apply(dev.devJumpToEra1(state))} />
            <Btn label="Find rock" onClick={() => apply(dev.devFindRock(state))} />
            <Btn label="Force awakening" onClick={() => apply(dev.devForceAwaken(state))} />
            <Btn label="Give 10 fragments" onClick={() => apply(dev.devGiveFragments(state, 10))} />
          </Section>

          <Section title="Resources">
            <Btn label="+999 of every resource" onClick={() => apply(dev.devGiveAll(state, 999))} />
            <Btn label="+99 of every resource" onClick={() => apply(dev.devGiveAll(state, 99))} />
            <Btn
              label="Clear inventory"
              danger
              onClick={() =>
                apply(
                  dev.devSetInventory(state, Object.fromEntries(getAllResources().map((r) => [r.id, 0])))
                )
              }
            />
            <div className="dev-row-stats muted">
              {Object.entries(inv)
                .filter(([, q]) => q > 0)
                .map(([k, q]) => `${k}:${q}`)
                .join(" · ") || "empty"}
            </div>
          </Section>

          <Section title="Buildings">
            <Btn label="Build all" onClick={() => apply(dev.devBuildAll(state))} />
            {getAllBuildings().map((b) => (
              <Btn
                key={b.id}
                label={`${b.icon} ${b.name}${state.run.built?.[b.id] ? " ✓" : ""}`}
                onClick={() =>
                  apply({
                    run: {
                      ...state.run,
                      built: { ...state.run.built, [b.id]: { at: Date.now() } },
                    },
                    msg: `🛠️ Built ${b.name}.`,
                  })
                }
              />
            ))}
          </Section>

          <Section title="Research">
            <Btn label="Learn all" onClick={() => apply(dev.devLearnAllResearch(state))} />
            {getAllResearch().map((r) => (
              <Btn
                key={r.id}
                label={`${r.icon} ${r.name}${state.run.researched?.[r.id] ? " ✓" : ""}`}
                onClick={() =>
                  apply({
                    run: {
                      ...state.run,
                      researched: {
                        ...state.run.researched,
                        [r.id]: { at: Date.now() },
                      },
                    },
                    msg: `🛠️ Learned ${r.name}.`,
                  })
                }
              />
            ))}
          </Section>

          <Section title="Tools">
            <Btn label="Craft all (full durability)" onClick={() => apply(dev.devCraftAll(state))} />
            {getAllTools().map((t) => (
              <Btn
                key={t.id}
                label={`${t.icon} ${t.name}${(state.run.inventory?.[t.id] || 0) > 0 ? " ✓" : ""}`}
                onClick={() =>
                  apply({
                    run: {
                      ...state.run,
                      inventory: { ...state.run.inventory, [t.id]: 1 },
                      toolDurability: {
                        ...state.run.toolDurability,
                        [t.id]: t.durability?.max || 1,
                      },
                    },
                    msg: `🛠️ Crafted ${t.name}.`,
                  })
                }
              />
            ))}
          </Section>

          <Section title="Skills">
            <Btn label="All skills lvl 5" onClick={() => apply(dev.devLevelAllSkills(state, 5))} />
            <Btn label="All skills lvl 10" onClick={() => apply(dev.devLevelAllSkills(state, 10))} />
            <Btn label="All skills lvl 20 (max)" onClick={() => apply(dev.devLevelAllSkills(state, 20))} />
            <Btn label="Reset skills" danger onClick={() => apply(dev.devResetSkills(state))} />
            <div className="dev-row-stats muted">
              {getActiveSkills().map((s) => `${s.icon}${state.run.skills?.[s.id]?.level || 0}`).join(" · ")}
            </div>
          </Section>

          <Section title="Survival">
            <Btn label="Max all stats" onClick={() => apply(dev.devMaxStats(state))} />
            <Btn label="Hurt to red zones" danger onClick={() => apply(dev.devHurtStats(state))} />
          </Section>

          <Section title="Time">
            <Btn label="Skip 1 minute" onClick={() => apply(dev.devSkipTime(state, 1))} />
            <Btn label="Skip 10 minutes" onClick={() => apply(dev.devSkipTime(state, 10))} />
            <Btn label="Skip 1 hour" onClick={() => apply(dev.devSkipTime(state, 60))} />
            <Btn label="Skip 8 hours" onClick={() => apply(dev.devSkipTime(state, 480))} />
          </Section>

          <Section title="Pests + Events">
            <Btn label="Trigger bird flock (5 min)" onClick={() => apply(dev.devTriggerPest(state, "birdFlock", 5))} />
            <Btn label="Clear all pests" onClick={() => apply(dev.devClearPests(state))} />
            <div className="dev-row-stats muted">
              Active pests:{" "}
              {Object.keys(state.run.activePests || {}).length === 0
                ? "none"
                : Object.keys(state.run.activePests).join(", ")}
            </div>
            <div className="dev-row-stats muted">
              {getAllEvents().length} events defined ·{" "}
              {Object.keys(state.run.events?.cooldowns || {}).length} on cooldown
            </div>
          </Section>

          <Section title="Reset">
            <Btn label="Wipe run" danger onClick={() => actions.resetRun()} />
            <Btn label="💥 Nuke save (reload)" danger onClick={() => dev.devNuke()} />
          </Section>
        </div>
      </div>
    </div>
  );
}

// Hook: keyboard shortcut Ctrl+Shift+D opens the dev panel.
// Returns [open, setOpen] so the caller renders the panel conditionally.
export function useDevPanelToggle(settings) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDevAvailable(settings)) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settings]);

  return [open, setOpen];
}

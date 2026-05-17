// Dev / debug panel. Skip-the-grind testing interface.
//
// Toggles via Ctrl+Shift+D. Organized into tabs: Quick / Content / State /
// Encounters / System. All actions go through devPatch() which applies a
// pure mutator from systems/dev.js.

import { useEffect, useState } from "react";
import * as dev from "../systems/dev.js";
import { getAllResources } from "../content/resources.js";
import { getAllBuildings } from "../content/buildings.js";
import { getAllResearch } from "../content/research.js";
import { getAllTools } from "../content/tools.js";
import { getActiveSkills } from "../content/skills.js";
import { getAllEvents } from "../content/events.js";
import { getAllThreats } from "../content/threats.js";
import { getAllSpells } from "../content/spells.js";
import { computeEra, getNextEraRequirements } from "../systems/era.js";

const TABS = [
  { id: "quick", label: "🚀 Quick" },
  { id: "content", label: "🌍 Content" },
  { id: "state", label: "🧠 State" },
  { id: "encounters", label: "⚔️ Encounters" },
  { id: "system", label: "⏱️ System" },
];

export function isDevAvailable(settings) {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
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

function Btn({ label, onClick, danger = false, small = false }) {
  const cls = `dev-btn ${danger ? "dev-btn--danger" : ""} ${small ? "dev-btn--small" : ""}`;
  return (
    <button className={cls} onClick={onClick} type="button">{label}</button>
  );
}

function giveTool(state, t) {
  const haveQty = state.run.inventory?.[t.id] || 0;
  return {
    run: {
      ...state.run,
      inventory: { ...state.run.inventory, [t.id]: haveQty + 1 },
      toolDurability: {
        ...state.run.toolDurability,
        [t.id]: t.durability?.max || (state.run.toolDurability?.[t.id] ?? 1),
      },
      toolsCrafted: {
        ...(state.run.toolsCrafted || {}),
        [t.id]: {
          craftedAt: Date.now(),
          count: (state.run.toolsCrafted?.[t.id]?.count || 0) + 1,
        },
      },
    },
    msg: `🛠️ +1 ${t.name}.`,
  };
}

export default function DevPanel({ state, actions, onClose }) {
  const apply = (patch) => actions.devPatch(patch);
  const [tab, setTab] = useState("quick");

  const era = computeEra(state);
  const stats = state.run.stats || {};
  const alignment = state.run.alignment || { good: 0, evil: 0 };
  const statuses = state.run.statuses || {};
  const nextEraReqs = getNextEraRequirements(state);

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
              {Object.keys(state.run.researched || {}).length} researched ·{" "}
              good {alignment.good || 0} · evil {alignment.evil || 0} · Echoes{" "}
              {state.persistent.echoes}
              {nextEraReqs.length > 0 && (
                <><br />Next era needs: {nextEraReqs.join(", ")}</>
              )}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <nav className="dev-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dev-tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="modal-body dev-body">
          {tab === "quick" && <QuickTab state={state} apply={apply} />}
          {tab === "content" && <ContentTab state={state} apply={apply} />}
          {tab === "state" && (
            <StateTab state={state} apply={apply} stats={stats} alignment={alignment} statuses={statuses} />
          )}
          {tab === "encounters" && <EncountersTab state={state} apply={apply} />}
          {tab === "system" && <SystemTab state={state} actions={actions} apply={apply} />}
        </div>
      </div>
    </div>
  );
}

function QuickTab({ state, apply }) {
  return (
    <>
      <Section title="Era jumps (minimum entry conditions)">
        <Btn label="Jump to Era 1" onClick={() => apply(dev.devJumpToEra1(state))} />
        <Btn label="Jump to Era 2" onClick={() => apply(dev.devJumpToEra2(state))} />
        <Btn label="Jump to Era 3" onClick={() => apply(dev.devJumpToEra3(state))} />
      </Section>
      <Section title="Full unlock (everything in that era + earlier)">
        <Btn label="🚀 Unlock all Era 1" onClick={() => apply(dev.devUnlockAll(state))} />
        <Btn label="🚀 Unlock all Era 2" onClick={() => apply(dev.devUnlockAllEra2(state))} />
        <Btn label="🚀 Unlock all Era 3" onClick={() => apply(dev.devUnlockAllEra3(state))} />
      </Section>
      <Section title="Rock + fragments">
        <Btn label="Find rock" onClick={() => apply(dev.devFindRock(state))} />
        <Btn label="Force awakening" onClick={() => apply(dev.devForceAwaken(state))} />
        <Btn label="+10 fragments" onClick={() => apply(dev.devGiveFragments(state, 10))} />
        <Btn label="+50 fragments" onClick={() => apply(dev.devGiveFragments(state, 50))} />
      </Section>
      <Section title="Resources">
        <Btn label="+999 of every resource" onClick={() => apply(dev.devGiveAll(state, 999))} />
        <Btn label="+99 of every resource" onClick={() => apply(dev.devGiveAll(state, 99))} />
        <Btn label="Clear inventory" danger onClick={() =>
          apply(dev.devSetInventory(state, Object.fromEntries(getAllResources().map((r) => [r.id, 0]))))
        } />
      </Section>
    </>
  );
}

function ContentTab({ state, apply }) {
  return (
    <>
      <Section title="Buildings">
        <Btn label="Build all" onClick={() => apply(dev.devBuildAll(state))} />
        {getAllBuildings().map((b) => (
          <Btn key={b.id} small
            label={`${b.icon} ${b.name}${state.run.built?.[b.id] ? " ✓" : ""}`}
            onClick={() => apply({
              run: { ...state.run, built: { ...state.run.built, [b.id]: { at: Date.now() } } },
              msg: `🛠️ Built ${b.name}.`,
            })} />
        ))}
      </Section>
      <Section title="Research">
        <Btn label="Learn all" onClick={() => apply(dev.devLearnAllResearch(state))} />
        {getAllResearch().map((r) => (
          <Btn key={r.id} small
            label={`${r.icon} ${r.name}${state.run.researched?.[r.id] ? " ✓" : ""}`}
            onClick={() => apply({
              run: { ...state.run, researched: { ...state.run.researched, [r.id]: { at: Date.now() } } },
              msg: `🛠️ Learned ${r.name}.`,
            })} />
        ))}
      </Section>
      <Section title="Tools / Potions">
        <Btn label="Craft all (full durability)" onClick={() => apply(dev.devCraftAll(state))} />
        {getAllTools().map((t) => {
          const qty = state.run.inventory?.[t.id] || 0;
          const stack = t.isStackable ? `×${qty}` : qty > 0 ? "✓" : "";
          return (
            <Btn key={t.id} small label={`${t.icon} ${t.name} ${stack}`}
              onClick={() => apply(giveTool(state, t))} />
          );
        })}
      </Section>
    </>
  );
}

function StateTab({ state, apply, stats, alignment, statuses }) {
  const spells = getAllSpells();
  const spellCooldowns = state.run.spellCooldowns || {};
  const cooling = Object.values(spellCooldowns).filter((u) => u > Date.now()).length;

  const setStat = (key, value) => ({
    run: { ...state.run, stats: { ...state.run.stats, [key]: Math.max(0, Math.min(100, value)) } },
    msg: `🛠️ ${key} → ${value}.`,
  });

  const statKeys = [
    ["HP", "hp"], ["Energy", "energy"], ["Hunger", "hunger"], ["Thirst", "thirst"],
    ["Resolve", "happiness"], ["Sanity", "sanity"], ["Spirit", "spirit"],
  ];

  return (
    <>
      <Section title="Survival stats">
        <Btn label="Max all stats" onClick={() => apply(dev.devMaxStats(state))} />
        <Btn label="Hurt to red zones" danger onClick={() => apply(dev.devHurtStats(state))} />
        <div className="dev-stat-grid">
          {statKeys.map(([label, key]) => (
            <div key={key} className="dev-stat-row">
              <span className="dev-stat-label">{label}</span>
              <span className="dev-stat-value">{Math.round(stats[key] ?? 0)}</span>
              <button type="button" className="dev-btn dev-btn--small" onClick={() => apply(setStat(key, 0))}>0</button>
              <button type="button" className="dev-btn dev-btn--small" onClick={() => apply(setStat(key, 50))}>50</button>
              <button type="button" className="dev-btn dev-btn--small" onClick={() => apply(setStat(key, 100))}>max</button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Skills">
        <Btn label="Lvl 5" onClick={() => apply(dev.devLevelAllSkills(state, 5))} />
        <Btn label="Lvl 10" onClick={() => apply(dev.devLevelAllSkills(state, 10))} />
        <Btn label="Lvl 20 (max)" onClick={() => apply(dev.devLevelAllSkills(state, 20))} />
        <Btn label="Reset" danger onClick={() => apply(dev.devResetSkills(state))} />
        <div className="dev-row-stats muted">
          {getActiveSkills().map((s) => `${s.icon}${state.run.skills?.[s.id]?.level || 0}`).join(" · ")}
        </div>
      </Section>
      <Section title="Alignment">
        <Btn label="Good 5" onClick={() => apply(dev.devSetAlignment(state, "good", 5))} />
        <Btn label="Good 10" onClick={() => apply(dev.devSetAlignment(state, "good", 10))} />
        <Btn label="Evil 5" onClick={() => apply(dev.devSetAlignment(state, "evil", 5))} />
        <Btn label="Evil 10" onClick={() => apply(dev.devSetAlignment(state, "evil", 10))} />
        <Btn label="Reset to neutral" onClick={() => apply(dev.devSetAlignment(state, "neutral", 0))} />
        <div className="dev-row-stats muted">good {alignment.good || 0} · evil {alignment.evil || 0}</div>
      </Section>
      <Section title="Spells">
        <Btn label={`Clear cooldowns${cooling ? ` (${cooling})` : ""}`}
          onClick={() => apply(dev.devClearSpellCooldowns(state))} />
        <div className="dev-row-stats muted">
          {spells.map((s) => {
            const known = !!state.run.researched?.[s.requires?.researched];
            const cd = spellCooldowns[s.id] || 0;
            return `${s.icon}${known ? "" : "—"}${cd > Date.now() ? "⏳" : ""}`;
          }).join(" · ")}
        </div>
      </Section>
      <Section title="Statuses">
        <Btn label="Apply Warded (5 min)" onClick={() => apply(dev.devApplyStatus(state, "warded", 300))} />
        <Btn label="Clear Warded" onClick={() => apply(dev.devApplyStatus(state, "warded", 0))} />
        <div className="dev-row-stats muted">
          Active:{" "}
          {Object.entries(statuses).filter(([, s]) => s?.until > Date.now()).length === 0
            ? "none"
            : Object.entries(statuses).filter(([, s]) => s?.until > Date.now())
                .map(([id, s]) => `${id} (${Math.ceil((s.until - Date.now()) / 1000)}s)`)
                .join(", ")}
        </div>
      </Section>
    </>
  );
}

function EncountersTab({ state, apply }) {
  return (
    <>
      <Section title="Force-fire threats">
        {getAllThreats().map((t) => (
          <Btn key={t.id} small
            label={`${t.icon} ${t.name}${t.kind === "demon" ? " (demon)" : ""}`}
            onClick={() => apply(dev.devForceThreat(state, t.id))} />
        ))}
        <div className="dev-row-stats muted">Bypasses encounter chance and warded gates.</div>
      </Section>
      <Section title="Pests">
        <Btn label="Trigger bird flock (5 min)" onClick={() => apply(dev.devTriggerPest(state, "birdFlock", 5))} />
        <Btn label="Clear all pests" onClick={() => apply(dev.devClearPests(state))} />
        <div className="dev-row-stats muted">
          Active pests:{" "}
          {Object.keys(state.run.activePests || {}).length === 0
            ? "none" : Object.keys(state.run.activePests).join(", ")}
        </div>
      </Section>
      <Section title="Events">
        <div className="dev-row-stats muted">
          {getAllEvents().length} events defined ·{" "}
          {Object.keys(state.run.events?.cooldowns || {}).length} on cooldown
        </div>
        <Btn label="Clear event cooldowns"
          onClick={() => apply({
            run: { ...state.run, events: { ...(state.run.events || {}), cooldowns: {} } },
            msg: `🛠️ Event cooldowns cleared.`,
          })} />
        <Btn label="Clear active event modal"
          onClick={() => apply({
            run: { ...state.run, activeEvent: null },
            msg: `🛠️ Active event cleared.`,
          })} />
      </Section>
    </>
  );
}

function SystemTab({ state, actions, apply }) {
  const inv = state.run.inventory || {};
  return (
    <>
      <Section title="Time skip">
        <Btn label="Skip 1 minute" onClick={() => apply(dev.devSkipTime(state, 1))} />
        <Btn label="Skip 10 minutes" onClick={() => apply(dev.devSkipTime(state, 10))} />
        <Btn label="Skip 1 hour" onClick={() => apply(dev.devSkipTime(state, 60))} />
        <Btn label="Skip 8 hours" onClick={() => apply(dev.devSkipTime(state, 480))} />
      </Section>
      <Section title="Inventory (debug)">
        <div className="dev-row-stats muted">
          {Object.entries(inv).filter(([, q]) => q > 0).map(([k, q]) => `${k}:${q}`).join(" · ") || "empty"}
        </div>
      </Section>
      <Section title="Reset">
        <Btn label="Wipe run" danger onClick={() => actions.resetRun()} />
        <Btn label="💥 Nuke save (reload)" danger onClick={() => dev.devNuke()} />
      </Section>
    </>
  );
}

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

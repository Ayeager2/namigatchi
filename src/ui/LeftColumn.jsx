// Left column with a vertical icon-rail along the LEFT edge and a content
// pane to its right. Rail tabs (top to bottom):
//
//   🫀 Body & Mind — primary, default. Wraps SurvivalBars.
//   📊 Skills      — migrated here from RightColumn.
//   🎒 Inventory   — full inventory listing.
//   🔨 Tools       — summary + opens ToolsModal.
//   ✨ Arcane      — summary + opens SpellsModal.
//   🏛️ Buildings   — summary + opens BuildingsTreeModal.
//
// Each tab is icon-only when collapsed (32px rail). Hovering or focusing the
// rail expands it outward to reveal labels. Pattern borrowed from VS Code's
// activity bar / Discord's server rail.
//
// Visibility: a tab is hidden when its content has nothing to show yet
// (e.g. Skills hidden until any skill has XP, Tools hidden until at least
// one tool-craft is researched). Default active tab is the first visible
// in declared order.

import { useEffect, useState } from "react";
import BodyMindTab from "./BodyMindTab.jsx";
import InventoryPanel from "./InventoryPanel.jsx";
import SkillsPanel from "./SkillsPanel.jsx";
import { getActiveSkills } from "../content/skills.js";
import {
  canBuild,
  getKnownBuildings,
  getAvailableBuildings,
} from "../systems/building.js";
import { canCraft, getVisibleTools } from "../systems/crafting.js";
import { getKnownSpells, canCastSpell } from "../systems/spells.js";
import { survivalActive } from "../systems/survival.js";

function skillsHasXp(state) {
  const skills = state.run.skills || {};
  for (const def of getActiveSkills()) {
    if ((skills[def.id]?.xp || 0) > 0) return true;
  }
  return false;
}

// Generic trigger summary panel used by Tools / Arcane / Buildings tabs.
// Shows two big counts and an open-modal button.
//
// `actionableCount` (BUGS.md #007) — when > 0, paint a small red bubble on
// the open-modal button so the player sees "there's something to do in
// here." Same number that drives the rail-icon badge.
function TriggerSummary({
  title,
  lead,
  stats,
  buttonLabel,
  onOpen,
  hint,
  actionableCount,
}) {
  return (
    <div className="lc-trigger">
      <h3 className="lc-trigger-title">{title}</h3>
      {lead && <p className="muted lc-trigger-lead">{lead}</p>}
      <div className="lc-trigger-stats">
        {stats.map((s, i) => (
          <div key={i} className="lc-trigger-stat">
            <div className="lc-trigger-stat-num">{s.value}</div>
            <div className="lc-trigger-stat-label muted">{s.label}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary lc-trigger-open lc-trigger-open--with-badge"
        onClick={onOpen}
      >
        {buttonLabel}
        {actionableCount > 0 && (
          <span
            className="lc-trigger-badge"
            aria-label={`${actionableCount} actionable`}
          >
            {actionableCount}
          </span>
        )}
      </button>
      {hint && <p className="muted lc-trigger-hint">{hint}</p>}
    </div>
  );
}

export default function LeftColumn({
  state,
  settingsHook,
  onOpenTools,
  onOpenSpells,
  onOpenBuildings,
}) {
  // Visibility of each tab.
  const bodyMindVisible = true; // always show — placeholder when survival inactive
  const skillsVisible = skillsHasXp(state);
  const inventoryVisible = true; // always
  const tools = getVisibleTools(state);
  const toolsVisible = tools.length > 0;
  const knownSpells = getKnownSpells(state);
  const arcaneVisible = knownSpells.length > 0;
  const buildings = getKnownBuildings(state);
  const buildingsVisible = buildings.length > 0;

  // ─── Actionable counts (BUGS.md #007) ────────────────────────────────────
  //
  // For the Tools tab: number of recipes the player can craft right now AND
  // hasn't already produced one of (own count == 0). Excludes already-owned
  // tools so the badge calms down once you've crafted the thing.
  const toolsActionable = tools.filter(
    (t) => (state.run.inventory?.[t.id] || 0) === 0 && canCraft(state, t.id).ok
  ).length;
  // For the Buildings tab: anything affordable AND not yet built.
  const buildingsActionable = getAvailableBuildings(state).length;
  // Arcane: deliberately no badge. Spells are repeatable casts, not
  // progression — pinging them constantly would be noise.

  // Ordered tab descriptors. Hidden tabs are filtered out below.
  const allTabs = [
    {
      id: "bodymind",
      icon: "🫀",
      label: "Body & Mind",
      visible: bodyMindVisible,
      actionable: 0,
    },
    { id: "skills", icon: "📊", label: "Skills", visible: skillsVisible, actionable: 0 },
    { id: "inv", icon: "🎒", label: "Inventory", visible: inventoryVisible, actionable: 0 },
    {
      id: "tools",
      icon: "🔨",
      label: "Tools",
      visible: toolsVisible,
      actionable: toolsActionable,
    },
    { id: "arcane", icon: "✨", label: "Arcane", visible: arcaneVisible, actionable: 0 },
    {
      id: "buildings",
      icon: "🏛️",
      label: "Buildings",
      visible: buildingsVisible,
      actionable: buildingsActionable,
    },
  ];
  const tabs = allTabs.filter((t) => t.visible);

  // Persist last active tab in component state. Default to first visible.
  // If the active tab becomes hidden (rare — would only happen mid-prestige
  // for some tabs), snap back to the first visible.
  const [tab, setTab] = useState(tabs[0]?.id || "bodymind");
  useEffect(() => {
    if (!tabs.find((t) => t.id === tab)) {
      setTab(tabs[0]?.id || "bodymind");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.map((t) => t.id).join("|")]);

  // Body & Mind tab is the rail's identity even when others exist. If the
  // player just hit a milestone that made it appear, surface it once.
  if (tabs.length === 0) return null;

  // Compute trigger stats for each summary tab.
  const toolStats = (() => {
    const owned = tools.filter((t) => (state.run.inventory?.[t.id] || 0) > 0)
      .length;
    const available = tools.filter(
      (t) =>
        (state.run.inventory?.[t.id] || 0) === 0 && canCraft(state, t.id).ok
    ).length;
    return [
      { value: owned, label: "crafted" },
      { value: available, label: "available" },
      { value: tools.length, label: "known" },
    ];
  })();

  const spellStats = (() => {
    const ready = knownSpells.filter((s) => canCastSpell(state, s.id).ok)
      .length;
    return [
      { value: ready, label: "ready" },
      { value: knownSpells.length, label: "known" },
    ];
  })();

  const buildingStats = (() => {
    const built = buildings.filter((b) => state.run.built?.[b.id]).length;
    const available = buildings.filter(
      (b) => !state.run.built?.[b.id] && canBuild(state, b.id).ok
    ).length;
    return [
      { value: built, label: "built" },
      { value: available, label: "available" },
      { value: buildings.length, label: "total" },
    ];
  })();

  return (
    <div className="left-col">
      <div className="lc-rail" role="tablist" aria-label="Left column tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`lc-rail-btn ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
            title={
              t.actionable > 0
                ? `${t.label} — ${t.actionable} available`
                : t.label
            }
          >
            <span className="lc-rail-icon" aria-hidden="true">
              {t.icon}
            </span>
            <span className="lc-rail-label">{t.label}</span>
            {/* Notification badge — small red dot with count when the tab
                has actionable items the player hasn't done yet.
                See BUGS.md #007. */}
            {t.actionable > 0 && (
              <span
                className="lc-rail-badge"
                aria-label={`${t.actionable} actionable`}
              >
                {t.actionable}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="lc-content" role="tabpanel">
        {tab === "bodymind" && <BodyMindTab state={state} />}
        {tab === "skills" && <SkillsPanel state={state} />}
        {tab === "inv" && (
          <InventoryPanel state={state} settingsHook={settingsHook} />
        )}
        {tab === "tools" && (
          <TriggerSummary
            title="Tools"
            lead="Things shaped by hand."
            stats={toolStats}
            buttonLabel="Open Crafts"
            onOpen={onOpenTools}
            actionableCount={toolsActionable}
            hint={
              survivalActive(state)
                ? "Recipes and durability live in the Crafts panel."
                : null
            }
          />
        )}
        {tab === "arcane" && (
          <TriggerSummary
            title="Arcane"
            lead="What the Stone teaches when you listen long enough."
            stats={spellStats}
            buttonLabel="Open Spells"
            onOpen={onOpenSpells}
            hint="Cast costs Fragments and Spirit."
          />
        )}
        {tab === "buildings" && (
          <TriggerSummary
            title="Buildings"
            lead="What you raise from the dust."
            stats={buildingStats}
            buttonLabel="Open Buildings"
            onOpen={onOpenBuildings}
            actionableCount={buildingsActionable}
            hint="Pan and zoom inside — drag the tree, scroll to zoom."
          />
        )}
      </div>
    </div>
  );
}

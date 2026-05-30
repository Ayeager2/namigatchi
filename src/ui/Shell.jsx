import { useState } from "react";
import DevPanel, { useDevPanelToggle, isDevAvailable } from "./DevPanel.jsx";
import Scene from "./Scene.jsx";
import ActionPanel from "./ActionPanel.jsx";
import LeftColumn from "./LeftColumn.jsx";
import StonePanel from "./StonePanel.jsx";
import RightColumn from "./RightColumn.jsx";
import ActionStrip from "./ActionStrip.jsx";
import TeachingsTreeModal from "./TeachingsTreeModal.jsx";
import BuildingsTreeModal from "./BuildingsTreeModal.jsx";
import StudyTreeModal from "./StudyTreeModal.jsx";
import ToolsModal from "./ToolsModal.jsx";
import SpellsModal from "./SpellsModal.jsx";
import BossFightModal from "./BossFightModal.jsx";
import EventModal from "./EventModal.jsx";
import SettingsModal from "./SettingsModal.jsx";
import SettingsTrigger from "./SettingsTrigger.jsx";
import PrestigeModal from "./PrestigeModal.jsx";
import PrestigeShop from "./PrestigeShop.jsx";
import { getPrestigeReward } from "../systems/prestige.js";
import { computeEra, getEra } from "../systems/era.js";
import { getBossesAvailable } from "../content/bosses.js";

export default function Shell({ state, actions, settingsHook }) {
  const [teachingsOpen, setTeachingsOpen] = useState(false);
  const [buildingsOpen, setBuildingsOpen] = useState(false);
  const [studyTreeOpen, setStudyTreeOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(false);
  const [bossFight, setBossFight] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [devOpen, setDevOpen] = useDevPanelToggle(settingsHook.settings);
  const devAvailable = isDevAvailable(settingsHook.settings);

  const era = computeEra(state);
  const eraInfo = getEra(state);
  const prestigeUnlocked = era >= 2;
  const reward = getPrestigeReward(state);
  const showEchoes = prestigeUnlocked || state.persistent.echoes > 0;
  const eligibleForPrestige = prestigeUnlocked && reward.eligible;
  const bossesAvailable = getBossesAvailable(state);
  const showChallenges = bossesAvailable.length > 0;

  const handleResetClick = () => setPrestigeOpen(true);
  const handleConfirmReset = () => {
    if (eligibleForPrestige) actions.prestige();
    else actions.resetRun();
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <h1>Lithos</h1>
        <div className="shell-meta">
          {era > 0 && <span className="meta-item meta-era">{eraInfo.name}</span>}
          {showChallenges && (
            <button
              className="meta-item meta-item--challenges"
              onClick={() => setBossFight({ initialBossId: null })}
              title="Challenge a boss"
              type="button"
            >
              ⚔️ Challenges
              <span className="meta-item-suffix">{bossesAvailable.length}</span>
            </button>
          )}
          {showEchoes && (
            <button
              className="meta-item meta-item--echoes"
              onClick={() => setShopOpen(true)}
              title="Open the Echo Shop"
              type="button"
            >
              🌀 Echoes: {state.persistent.echoes}
            </button>
          )}
        </div>
      </header>

      <Scene state={state} />

      <div className="shell-grid">
        <aside className="shell-area shell-area--left">
          <LeftColumn
            state={state}
            actions={actions}
            settingsHook={settingsHook}
            onOpenTools={() => setToolsOpen(true)}
            onOpenSpells={() => setSpellsOpen(true)}
            onOpenBuildings={() => setBuildingsOpen(true)}
            onOpenStudyTree={() => setStudyTreeOpen(true)}
          />
        </aside>

        <main className="shell-area shell-area--center">
          <ActionPanel state={state} />
        </main>

        <aside className="shell-area shell-area--right">
          <RightColumn state={state} />
        </aside>
      </div>

      <StonePanel
        state={state}
        onListen={() => setTeachingsOpen(true)}
        channelEligible={eligibleForPrestige}
        channelReward={reward}
        onChannel={handleResetClick}
      />

      <ActionStrip
        state={state}
        actions={actions}
        settings={settingsHook.settings}
        settingsHook={settingsHook}
        prestigeEligible={eligibleForPrestige}
        showResetButton={true}
        onReset={handleResetClick}
      />

      {teachingsOpen && (
        <TeachingsTreeModal
          state={state}
          actions={actions}
          onClose={() => setTeachingsOpen(false)}
        />
      )}

      {buildingsOpen && (
        <BuildingsTreeModal
          state={state}
          actions={actions}
          onClose={() => setBuildingsOpen(false)}
        />
      )}

      {studyTreeOpen && (
        <StudyTreeModal
          state={state}
          actions={actions}
          onClose={() => setStudyTreeOpen(false)}
        />
      )}

      {toolsOpen && (
        <ToolsModal
          state={state}
          actions={actions}
          onClose={() => setToolsOpen(false)}
        />
      )}

      {spellsOpen && (
        <SpellsModal
          state={state}
          actions={actions}
          onClose={() => setSpellsOpen(false)}
        />
      )}

      {bossFight && (
        <BossFightModal
          state={state}
          actions={actions}
          initialBossId={bossFight.initialBossId}
          onClose={() => setBossFight(null)}
        />
      )}

      <EventModal state={state} actions={actions} />

      <SettingsTrigger onOpen={() => setSettingsOpen(true)} />

      {devAvailable && (
        <button
          className="dev-floating-btn"
          onClick={() => setDevOpen(true)}
          title="Open dev panel (Ctrl+Shift+D)"
          type="button"
        >
          🛠️
        </button>
      )}

      {devOpen && (
        <DevPanel
          state={state}
          actions={actions}
          onClose={() => setDevOpen(false)}
        />
      )}

      {prestigeOpen && (
        <PrestigeModal
          mode={eligibleForPrestige ? "prestige" : "reset"}
          reward={reward}
          echoes={state.persistent.echoes}
          onConfirm={handleConfirmReset}
          onOpenShop={() => {
            setPrestigeOpen(false);
            setShopOpen(true);
          }}
          onClose={() => setPrestigeOpen(false)}
        />
      )}

      {shopOpen && (
        <PrestigeShop
          state={state}
          actions={actions}
          onClose={() => setShopOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settingsHook.settings}
          update={settingsHook.update}
          state={state}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

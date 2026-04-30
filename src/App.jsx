import { useEffect } from "react";
import { useGameStore } from "./state/store.js";
import Shell from "./ui/Shell.jsx";
import SplashScreen from "./ui/SplashScreen.jsx";
import { useSettings } from "./ui/useSettings.js";
import { computeEra } from "./systems/era.js";
import { syncMusicToState } from "./systems/audio.js";
import "./index.css";

export default function App() {
  const { state, actions } = useGameStore();
  const settingsHook = useSettings();
  const era = computeEra(state);

  // When era changes (or on initial mount), sync the music unlock list:
  // every track whose era tag has been reached gets added to persistent
  // unlockedMusic. New unlocks emit log entries in the Unlocks tab.
  useEffect(() => {
    actions.syncMusicUnlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era]);

  // Sync the actually-playing music to:
  //   - the pinned track if set, else
  //   - the unlocked track for the current era, else
  //   - silence.
  // Crossfades smoothly between tracks.
  useEffect(() => {
    syncMusicToState(state, settingsHook.settings, era);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    era,
    settingsHook.settings.pinnedMusicId,
    settingsHook.settings.muted,
    state.persistent.unlockedMusic,
  ]);

  // Splash plays on every fresh run. Once seen (or skipped), it doesn't replay
  // until run state resets (manual reset or prestige).
  if (!state.run.splashSeen) {
    return <SplashScreen onComplete={actions.markSplashSeen} />;
  }

  return <Shell state={state} actions={actions} settingsHook={settingsHook} />;
}

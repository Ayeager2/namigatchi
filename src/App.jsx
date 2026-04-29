import { useGameStore } from "./state/store.js";
import Shell from "./ui/Shell.jsx";
import SplashScreen from "./ui/SplashScreen.jsx";
import "./index.css";

export default function App() {
  const { state, actions } = useGameStore();

  // Splash plays on every fresh run. Once seen (or skipped), it doesn't replay
  // until run state resets (manual reset or prestige).
  if (!state.run.splashSeen) {
    return <SplashScreen onComplete={actions.markSplashSeen} />;
  }

  return <Shell state={state} actions={actions} />;
}

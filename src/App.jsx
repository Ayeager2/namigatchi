import { useGameStore } from "./state/store.js";
import Shell from "./ui/Shell.jsx";
import "./index.css";

export default function App() {
  const { state, actions } = useGameStore();
  return <Shell state={state} actions={actions} />;
}

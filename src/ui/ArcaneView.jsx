// Arcane view (#65) — Spells list rendered in the center column.
// Reuses the SpellsBody export from SpellsModal so casts work the same.

import { SpellsBody } from "./SpellsModal.jsx";

export default function ArcaneView({ state, actions }) {
  return <SpellsBody state={state} actions={actions} />;
}

// The header / master scene component.
// Pure rendering of layers; all decisions about what to show live in
// systems/scene.js. Eventually we'll swap text placeholders for real visuals
// (SVG layers, sprite stacks, etc.) without changing this component much.

import { composeScene } from "../systems/scene.js";

export default function Scene({ state }) {
  const scene = composeScene(state);
  return (
    <section className="scene">
      {scene.layers.map((layer) => (
        <div key={layer.id} className={`scene-layer scene-layer--${layer.id}`}>
          {layer.text}
        </div>
      ))}
    </section>
  );
}

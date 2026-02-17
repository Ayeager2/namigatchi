import { useCallback, useRef, useState } from "react";

let nextId = 1;

export function useFloatingText() {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());

  const addFloat = useCallback((text, opts = {}) => {
    const id = nextId++;
    const entry = {
      id,
      text,
      x: opts.x ?? 0.5, // 0..1 relative
      y: opts.y ?? 0.25,
      type: opts.type ?? "good", // good | bad | neutral
      ms: opts.ms ?? 900,
    };

    setItems((prev) => [...prev, entry]);

    const t = setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, entry.ms);

    timers.current.set(id, t);
  }, []);

  const clearAll = useCallback(() => {
    for (const [, t] of timers.current) clearTimeout(t);
    timers.current.clear();
    setItems([]);
  }, []);

  return { floats: items, addFloat, clearAll };
}

export function isTierAllowedForStage(tier, stage) {
  const t = String(tier || "").toUpperCase();

  if (stage === "egg" || stage === "baby") return false;

  // child can only do "no-money-back" tiers
  if (stage === "child") return t === "A" || t === "B";

  // teen+ can do money-back games
  if (stage === "teen" || stage === "adult") return ["A","B","C","D","E"].includes(t);

  return false;
}

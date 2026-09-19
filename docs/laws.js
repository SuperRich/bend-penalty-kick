export const Lane = Object.freeze({
  WideLeft: "WideLeft",
  Left: "Left",
  Center: "Center",
  Right: "Right",
  WideRight: "WideRight",
});

export const Height = Object.freeze({
  Over: "Over",
  Under: "Under",
});

export const KickOutcome = Object.freeze({
  OutGoal: "OutGoal",
  OutSaved: "OutSaved",
  OutMiss: "OutMiss",
});

export const Phase = Object.freeze({
  PhaseAiming: "PhaseAiming",
  PhaseFlight: "PhaseFlight",
  PhaseGoal: "PhaseGoal",
  PhaseSaved: "PhaseSaved",
  PhaseMiss: "PhaseMiss",
  PhaseOver: "PhaseOver",
});

export function onTargetUnder(lane) {
  return lane === Lane.Left || lane === Lane.Center || lane === Lane.Right;
}

export function onTarget(lane, height) {
  return height === Height.Under && onTargetUnder(lane);
}

export function resolveGo(on, saved) {
  if (!on) return KickOutcome.OutMiss;
  return saved ? KickOutcome.OutSaved : KickOutcome.OutGoal;
}

export function resolve(lane, height, saved) {
  return resolveGo(onTarget(lane, height), saved);
}

export function isGoal(o) {
  return o === KickOutcome.OutGoal;
}

export function isSaved(o) {
  return o === KickOutcome.OutSaved;
}

export function goalsInc(g) {
  return g >= 5 ? 5 : g + 1;
}

export function goalsApply(g, o) {
  return o === KickOutcome.OutGoal ? goalsInc(g) : g;
}

export function kicksLeft(taken) {
  return taken >= 5 ? 0 : 5 - taken;
}

export function matchOver(you, them, youTaken, themTaken) {
  if (youTaken >= 5 && themTaken >= 5) return true;
  if (you > them + kicksLeft(themTaken)) return true;
  if (them > you + kicksLeft(youTaken)) return true;
  return false;
}

export function classifyAim(nx, ny) {
  let lane;
  if (nx < 0.16) lane = Lane.WideLeft;
  else if (nx < 0.38) lane = Lane.Left;
  else if (nx < 0.62) lane = Lane.Center;
  else if (nx < 0.84) lane = Lane.Right;
  else lane = Lane.WideRight;
  const height = ny < 0.16 ? Height.Over : Height.Under;
  return { lane, height };
}

export function outcomeToPhase(o) {
  if (o === KickOutcome.OutGoal) return Phase.PhaseGoal;
  if (o === KickOutcome.OutSaved) return Phase.PhaseSaved;
  return Phase.PhaseMiss;
}

export function phaseOk(p) {
  return Object.values(Phase).includes(p);
}

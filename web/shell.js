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

export function kicksLeft(taken) {
  return taken >= 5 ? 0 : 5 - taken;
}

export function matchOver(you, them, youTaken, themTaken) {
  if (youTaken >= 5 && themTaken >= 5) return true;
  if (you > them + kicksLeft(themTaken)) return true;
  if (them > you + kicksLeft(youTaken)) return true;
  return false;
}

export function classifyLane(nx) {
  if (nx < 0.16) return Lane.WideLeft;
  if (nx < 0.38) return Lane.Left;
  if (nx < 0.62) return Lane.Center;
  if (nx < 0.84) return Lane.Right;
  return Lane.WideRight;
}

export function outcomeToPhase(o) {
  if (o === KickOutcome.OutGoal) return Phase.PhaseGoal;
  if (o === KickOutcome.OutSaved) return Phase.PhaseSaved;
  return Phase.PhaseMiss;
}

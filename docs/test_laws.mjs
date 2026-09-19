import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Lane,
  Height,
  KickOutcome,
  Phase,
  resolve,
  isGoal,
  isSaved,
  goalsInc,
  matchOver,
  classifyAim,
  phaseOk,
} from "./laws.js";

const bend = readFileSync(new URL("../game.bend", import.meta.url), "utf8");
for (const name of [
  ...Object.values(Lane),
  ...Object.values(Height),
  ...Object.values(KickOutcome),
  ...Object.values(Phase),
]) {
  assert.equal(bend.includes(`${name}{}`), true, name);
}

for (const lane of Object.values(Lane)) {
  for (const height of Object.values(Height)) {
    const on = height === Height.Under && [Lane.Left, Lane.Center, Lane.Right].includes(lane);
    assert.equal(resolve(lane, height, false), on ? KickOutcome.OutGoal : KickOutcome.OutMiss);
    assert.equal(resolve(lane, height, true), on ? KickOutcome.OutSaved : KickOutcome.OutMiss);
  }
}

for (const o of Object.values(KickOutcome)) {
  assert.equal(isGoal(o) && isSaved(o), false);
}

for (let g = 0; g <= 5; g++) assert.ok(goalsInc(g) <= 5);
assert.equal(goalsInc(5), 5);

for (const p of Object.values(Phase)) assert.equal(phaseOk(p), true);

assert.equal(matchOver(0, 0, 5, 5), true);
assert.equal(matchOver(3, 0, 3, 3), true);
assert.equal(matchOver(0, 0, 1, 1), false);
assert.equal(matchOver(2, 2, 4, 4), false);

assert.equal(classifyAim(0.5, 0.4).lane, Lane.Center);
assert.equal(classifyAim(0.5, 0.4).height, Height.Under);
assert.equal(classifyAim(0.5, 0.05).height, Height.Over);
assert.equal(classifyAim(0.05, 0.4).lane, Lane.WideLeft);

console.log("laws ok");

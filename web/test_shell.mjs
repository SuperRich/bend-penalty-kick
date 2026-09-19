import assert from "node:assert/strict";
import { Lane, Height, Phase, classifyLane, matchOver } from "./shell.js";

assert.equal(classifyLane(0.5), Lane.Center);
assert.equal(classifyLane(0.05), Lane.WideLeft);
assert.equal(matchOver(0, 0, 5, 5), true);
assert.equal(matchOver(3, 0, 3, 3), true);
assert.equal(matchOver(0, 0, 1, 1), false);
assert.equal(matchOver(2, 2, 4, 4), false);
assert.equal(Object.values(Phase).includes(Phase.PhaseAiming), true);
assert.equal(Height.Under, "Under");
console.log("shell ok");

import assert from "node:assert/strict";
import { Lane, Height, Phase, classifyLane, matchOver } from "./shell.js";
import { GOAL, BAR_Y, GOAL_HALF_W, worldToNorm, normToWorld } from "./pitch.js";

assert.equal(classifyLane(0.5), Lane.Center);
assert.equal(classifyLane(0.05), Lane.WideLeft);
assert.equal(matchOver(0, 0, 5, 5), true);
assert.equal(matchOver(3, 0, 3, 3), true);
assert.equal(matchOver(0, 0, 1, 1), false);
assert.equal(matchOver(2, 2, 4, 4), false);
assert.equal(Object.values(Phase).includes(Phase.PhaseAiming), true);
assert.equal(Height.Under, "Under");

const leftPost = worldToNorm(-GOAL_HALF_W, BAR_Y);
const rightPost = worldToNorm(GOAL_HALF_W, BAR_Y);
assert.ok(Math.abs(leftPost.x - GOAL.x) < 1e-9);
assert.ok(Math.abs(rightPost.x - (GOAL.x + GOAL.w)) < 1e-9);
assert.ok(Math.abs(leftPost.y - GOAL.y) < 1e-9);
const mid = normToWorld(0.5, GOAL.y);
assert.ok(Math.abs(mid.x) < 1e-9);
assert.ok(Math.abs(mid.y - BAR_Y) < 1e-9);
assert.equal(classifyLane(leftPost.x + 0.01), Lane.Left);
assert.equal(classifyLane(0.5), Lane.Center);
console.log("shell ok");

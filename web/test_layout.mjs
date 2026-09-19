import assert from "node:assert/strict";
import { SPOT_Z } from "./pitch.js";
import {
  TAKER,
  KEEPER_Z,
  CAMERA,
  KITS,
  CROWD_ROWS,
  CROWD_SHIRTS,
  crowdSeat,
  crowdHeadcount,
  shirtAt,
} from "./layout.js";

assert.ok(KEEPER_Z > 0 && KEEPER_Z < 1);
assert.ok(TAKER.z > SPOT_Z);
assert.ok(TAKER.z < SPOT_Z + 1.5);
assert.ok(TAKER.x > 0.4);

assert.ok(CAMERA.z > TAKER.z);
assert.ok(CAMERA.targetZ < 6);
assert.ok(CAMERA.targetZ > 0);

assert.notEqual(KITS.taker.shirt, KITS.keeper.shirt);

const counted = CROWD_ROWS.reduce((n, row) => n + row.count, 0);
assert.equal(crowdHeadcount(), counted);
assert.ok(crowdHeadcount() >= 80);

const front = crowdSeat(CROWD_ROWS[0], 0);
assert.ok(front.z < 0);
assert.equal(front.x, -CROWD_ROWS[0].halfW);
const mid = crowdSeat(CROWD_ROWS[2], 9);
assert.ok(mid.z < -4);
assert.ok(Math.abs(mid.x) < 0.3);
const back = crowdSeat(CROWD_ROWS[4], CROWD_ROWS[4].count - 1);
assert.ok(back.z < -6);
assert.equal(back.x, CROWD_ROWS[4].halfW);

for (const row of CROWD_ROWS) {
  assert.ok(row.z < 0);
  assert.ok(row.y >= 0.8);
  assert.ok(row.count >= 17);
}

assert.equal(shirtAt(CROWD_SHIRTS.length), CROWD_SHIRTS[0]);
assert.equal(shirtAt(1), CROWD_SHIRTS[1]);

console.log("layout ok");

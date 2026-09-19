import { SPOT_Z } from "./pitch.js";

export const TAKER = Object.freeze({
  x: 0.95,
  z: SPOT_Z + 0.68,
});

export const KEEPER_Z = 0.42;

export const CAMERA = Object.freeze({
  x: 1.85,
  y: 2.28,
  z: 17.8,
  targetX: 0.05,
  targetY: 1.35,
  targetZ: 1.15,
  fov: 0.78,
});

export const KITS = Object.freeze({
  taker: Object.freeze({
    shirt: "#d0172a",
    shorts: "#f3efe4",
    socks: "#d0172a",
    skin: "#e6b48a",
    hair: "#2b1a12",
    boots: "#141414",
    gloves: "#e6b48a",
  }),
  keeper: Object.freeze({
    shirt: "#f3d000",
    shorts: "#1a1d24",
    socks: "#f3d000",
    skin: "#c68642",
    hair: "#1a120c",
    boots: "#141414",
    gloves: "#f6f1e4",
  }),
});

export const CROWD_SHIRTS = Object.freeze([
  "#c81e1e",
  "#1d4ed8",
  "#f4f1e8",
  "#111827",
  "#15803d",
  "#ea580c",
  "#6d28d9",
  "#eab308",
]);

export const CROWD_ROWS = Object.freeze([
  Object.freeze({ z: -2.55, y: 0.9, count: 17, halfW: 8.1, stand: false }),
  Object.freeze({ z: -3.65, y: 1.4, count: 18, halfW: 8.7, stand: true }),
  Object.freeze({ z: -4.75, y: 1.9, count: 19, halfW: 9.3, stand: true }),
  Object.freeze({ z: -5.85, y: 2.45, count: 20, halfW: 9.9, stand: true }),
  Object.freeze({ z: -6.95, y: 3.05, count: 21, halfW: 10.5, stand: true }),
]);

export function crowdSeat(row, i) {
  const span = row.count === 1 ? 0 : i / (row.count - 1);
  return {
    x: -row.halfW + span * row.halfW * 2,
    y: row.y,
    z: row.z,
  };
}

export function crowdHeadcount() {
  let n = 0;
  for (const row of CROWD_ROWS) n += row.count;
  return n;
}

export function shirtAt(i) {
  return CROWD_SHIRTS[i % CROWD_SHIRTS.length];
}

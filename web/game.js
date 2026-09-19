import Game from "../game.bend";
import {
  Lane,
  Height,
  KickOutcome,
  Phase,
  classifyLane,
  matchOver,
  outcomeToPhase,
} from "./shell.js";
import {
  GOAL,
  SPOT,
  REST_AIM,
  SPOT_Z,
  BALL_R,
  clamp01,
  worldToNorm,
  normToWorld,
  keeperWorldX,
} from "./pitch.js";
import { unlockSound, playKick, playGoal, playSave, playMiss } from "./sound.js";
import { buildStage } from "./look.js";
import { KEEPER_Z } from "./layout.js";

function tag(name) {
  return { $: name };
}

function resolve(lane, height, saved) {
  return Game.resolve(tag(lane), tag(height), saved).$;
}

function goalsApply(g, o) {
  return Number(Game["Goals.to_nat"](Game["Goals.apply"](tag("G" + g), tag(o))));
}

const canvas = document.getElementById("pitch");
const scoreEl = document.getElementById("score");
const kicksEl = document.getElementById("kicks");
const statusEl = document.getElementById("status");
const againBtn = document.getElementById("again");
const flashEl = document.getElementById("flash");

const FRAME = [Lane.Left, Lane.Center, Lane.Right];
const LANES = [Lane.WideLeft, Lane.Left, Lane.Center, Lane.Right, Lane.WideRight];

function fresh() {
  return {
    phase: Phase.PhaseAiming,
    you: 0,
    them: 0,
    youTaken: 0,
    themTaken: 0,
    side: "you",
    aimX: REST_AIM.x,
    aimY: REST_AIM.y,
    t: 0,
    dest: { x: SPOT.x, y: SPOT.y },
    keeperX: 0.5,
    keeperTarget: 0.5,
    outcome: null,
  };
}

let S = fresh();
let soundReady = false;

function unlock() {
  unlockSound().then(() => {
    soundReady = true;
    hud();
  });
}

function statusText() {
  if (!soundReady && S.phase === Phase.PhaseAiming && S.side === "you") {
    return "Click the pitch to start sound. Then aim and shoot.";
  }
  switch (S.phase) {
    case Phase.PhaseAiming:
      return S.side === "you"
        ? "Aim with mouse, touch, or arrows. Shoot with click, tap, or Space."
        : "AI steps up.";
    case Phase.PhaseFlight:
      return "Ball in flight.";
    case Phase.PhaseGoal:
      return "Goal. Click or Space for the next kick.";
    case Phase.PhaseSaved:
      return "Saved. Click or Space for the next kick.";
    case Phase.PhaseMiss:
      return "Miss. Click or Space for the next kick.";
    case Phase.PhaseOver:
      if (S.you > S.them) return "You win.";
      if (S.them > S.you) return "AI wins.";
      return "Draw.";
    default:
      return "";
  }
}

function flashLabel() {
  if (!S.outcome || S.phase === Phase.PhaseFlight || S.phase === Phase.PhaseAiming) {
    flashEl.hidden = true;
    flashEl.textContent = "";
    return;
  }
  flashEl.hidden = false;
  flashEl.textContent = S.outcome === KickOutcome.OutGoal
    ? "GOAL"
    : S.outcome === KickOutcome.OutSaved
      ? "SAVED"
      : "MISS";
}

function hud() {
  scoreEl.textContent = `YOU ${S.you} - ${S.them} AI`;
  kicksEl.textContent = S.phase === Phase.PhaseOver
    ? "Match over"
    : `Best of 5 · ${S.side === "you" ? "you shoot" : "AI shoots"}`;
  statusEl.textContent = statusText();
  againBtn.hidden = S.phase !== Phase.PhaseOver;
  statusEl.dataset.sound = soundReady ? "on" : "off";
  flashLabel();
}

function laneCenter(lane) {
  switch (lane) {
    case Lane.WideLeft: return -0.12;
    case Lane.Left: return 0.22;
    case Lane.Center: return 0.5;
    case Lane.Right: return 0.78;
    case Lane.WideRight: return 1.12;
    default: return 0.5;
  }
}

function aimOf(lane, height) {
  const x = GOAL.x + laneCenter(lane) * GOAL.w;
  const y = height === Height.Over ? GOAL.y - 0.04 : REST_AIM.y;
  return { x: clamp01(x), y: clamp01(y) };
}

function classifyPitch(nx, ny) {
  return { lane: classifyLane(nx), height: ny < GOAL.y ? Height.Over : Height.Under };
}

function pickDive(lane) {
  const cover = S.side === "you" ? 0.36 : 0.55;
  if (Math.random() < cover && FRAME.includes(lane)) return lane;
  return FRAME[(Math.random() * 3) | 0];
}

function playOutcome(o) {
  if (o === KickOutcome.OutGoal) playGoal();
  else if (o === KickOutcome.OutSaved) playSave();
  else playMiss();
}

function shoot(lane, height) {
  if (S.phase !== Phase.PhaseAiming) return;
  const dive = pickDive(lane);
  const saved = dive === lane;
  S.outcome = resolve(lane, height, saved);
  S.phase = Phase.PhaseFlight;
  S.t = 0;
  S.dest = { x: S.aimX, y: S.aimY };
  S.keeperTarget = clamp01(saved
    ? (S.aimX - GOAL.x) / GOAL.w
    : laneCenter(dive));
  playKick();
}

function finishKick() {
  const o = S.outcome;
  if (S.side === "you") {
    S.you = goalsApply(S.you, o);
    S.youTaken += 1;
  } else {
    S.them = goalsApply(S.them, o);
    S.themTaken += 1;
  }
  S.phase = matchOver(S.you, S.them, S.youTaken, S.themTaken)
    ? Phase.PhaseOver
    : outcomeToPhase(o);
  playOutcome(o);
}

function nextKick() {
  if (S.phase === Phase.PhaseOver) return;
  S.side = S.side === "you" ? "them" : "you";
  S.phase = Phase.PhaseAiming;
  S.outcome = null;
  S.t = 0;
  S.dest = { x: SPOT.x, y: SPOT.y };
  S.keeperX = 0.5;
  S.keeperTarget = 0.5;
  S.aimX = REST_AIM.x;
  S.aimY = REST_AIM.y;
  if (S.side === "them") window.setTimeout(aiTake, 420);
}

function aiTake() {
  if (S.phase !== Phase.PhaseAiming || S.side !== "them") return;
  const lane = LANES[(Math.random() * 5) | 0];
  const height = Math.random() < 0.12 ? Height.Over : Height.Under;
  const aim = aimOf(lane, height);
  S.aimX = aim.x;
  S.aimY = aim.y;
  shoot(lane, height);
}

function advanceFromClick() {
  if (S.phase === Phase.PhaseGoal || S.phase === Phase.PhaseSaved || S.phase === Phase.PhaseMiss) {
    nextKick();
    return true;
  }
  return false;
}

if (!window.BABYLON) {
  statusEl.textContent = "Babylon.js failed to load. Check the network.";
  throw new Error("BABYLON missing");
}

const B = window.BABYLON;
const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
const scene = new B.Scene(engine);
const { ball, keeperRoot, aimDot, aimPlane } = buildStage(B, scene);

let aimLine = null;

function ballWorld(u) {
  const end = normToWorld(S.dest.x, S.dest.y);
  const lift = Math.sin(u * Math.PI) * 1.05;
  return new B.Vector3(
    end.x * u,
    BALL_R + (end.y - BALL_R) * u + lift,
    SPOT_Z + (0.14 - SPOT_Z) * u,
  );
}

function aimPoint() {
  const p = normToWorld(S.aimX, S.aimY);
  return new B.Vector3(p.x, p.y, 0.14);
}

function syncView() {
  S.keeperX += (S.keeperTarget - S.keeperX) * 0.12;
  keeperRoot.position.x = keeperWorldX(S.keeperX);
  keeperRoot.position.z = KEEPER_Z;
  keeperRoot.rotation.z = (0.5 - S.keeperX) * 0.45;

  if (S.phase === Phase.PhaseFlight) {
    S.t = Math.min(1, S.t + 0.028);
    ball.position.copyFrom(ballWorld(S.t));
    if (S.t >= 1) finishKick();
  } else if (S.phase === Phase.PhaseAiming) {
    ball.position.copyFrom(ballWorld(0));
  } else {
    ball.position.copyFrom(ballWorld(1));
  }

  const aiming = S.phase === Phase.PhaseAiming && S.side === "you";
  aimDot.setEnabled(aiming);
  if (aiming) aimDot.position.copyFrom(aimPoint());
  if (aimLine) {
    aimLine.dispose();
    aimLine = null;
  }
  if (aiming) {
    aimLine = B.MeshBuilder.CreateDashedLines("aimLine", {
      points: [new B.Vector3(0, BALL_R, SPOT_Z), aimPoint()],
      dashSize: 0.22,
      gapSize: 0.16,
    }, scene);
    aimLine.color = new B.Color3(1, 0.88, 0.51);
  }
}

function pickNorm(ev) {
  const r = canvas.getBoundingClientRect();
  const src = "clientX" in ev ? ev : ev.touches[0];
  const sx = src.clientX - r.left;
  const sy = src.clientY - r.top;
  const px = (sx / r.width) * engine.getRenderWidth();
  const py = (sy / r.height) * engine.getRenderHeight();
  const hit = scene.pick(px, py, (m) => m === aimPlane);
  if (hit.hit && hit.pickedPoint) return worldToNorm(hit.pickedPoint.x, hit.pickedPoint.y);
  return { x: clamp01(sx / r.width), y: clamp01(sy / r.height) };
}

function aimFromPointer(ev) {
  if (S.phase !== Phase.PhaseAiming || S.side !== "you") return;
  const p = pickNorm(ev);
  S.aimX = p.x;
  S.aimY = p.y;
}

function tryShootFromPointer(ev) {
  unlock();
  if (advanceFromClick()) return;
  if (S.phase !== Phase.PhaseAiming || S.side !== "you") return;
  aimFromPointer(ev);
  const { lane, height } = classifyPitch(S.aimX, S.aimY);
  shoot(lane, height);
}

canvas.addEventListener("pointermove", aimFromPointer);
canvas.addEventListener("pointerdown", tryShootFromPointer);

window.addEventListener("keydown", (ev) => {
  unlock();
  if (ev.key === "ArrowLeft") S.aimX = Math.max(0, S.aimX - 0.04);
  if (ev.key === "ArrowRight") S.aimX = Math.min(1, S.aimX + 0.04);
  if (ev.key === "ArrowUp") S.aimY = Math.max(0, S.aimY - 0.04);
  if (ev.key === "ArrowDown") S.aimY = Math.min(1, S.aimY + 0.04);
  if (ev.key === " " || ev.key === "Enter") {
    ev.preventDefault();
    if (advanceFromClick()) return;
    if (S.phase === Phase.PhaseAiming && S.side === "you") {
      const { lane, height } = classifyPitch(S.aimX, S.aimY);
      shoot(lane, height);
    }
  }
  if ((ev.key === "r" || ev.key === "R") && S.phase === Phase.PhaseOver) S = fresh();
});

againBtn.addEventListener("click", () => {
  unlock();
  S = fresh();
});

window.addEventListener("resize", () => engine.resize());

engine.runRenderLoop(() => {
  syncView();
  hud();
  scene.render();
});

hud();

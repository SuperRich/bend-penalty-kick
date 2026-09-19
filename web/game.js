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
  BAR_Y,
  GOAL_HALF_W,
  XMIN,
  XWIDTH,
  YMAX,
  SPOT_Z,
  BALL_R,
  clamp01,
  worldToNorm,
  normToWorld,
  keeperWorldX,
} from "./pitch.js";
import { unlockSound, playKick, playGoal, playSave, playMiss } from "./sound.js";

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
scene.clearColor = new B.Color4(0.42, 0.7, 0.94, 1);
scene.fogMode = B.Scene.FOGMODE_LINEAR;
scene.fogStart = 22;
scene.fogEnd = 48;
scene.fogColor = new B.Color3(0.55, 0.75, 0.92);

const camera = new B.FreeCamera("cam", new B.Vector3(0, 2.15, 15.4), scene);
camera.minZ = 0.1;
camera.setTarget(new B.Vector3(0, 1.35, 0));

const hemi = new B.HemisphericLight("hemi", new B.Vector3(0.15, 1, 0.25), scene);
hemi.intensity = 0.85;
const sun = new B.DirectionalLight("sun", new B.Vector3(0.35, -1, 0.45), scene);
sun.position = new B.Vector3(-6, 14, 8);
sun.intensity = 0.7;

const pitchMat = new B.StandardMaterial("pitchMat", scene);
pitchMat.diffuseColor = new B.Color3(0.11, 0.46, 0.22);
pitchMat.specularColor = new B.Color3(0.04, 0.04, 0.04);
const pitch = B.MeshBuilder.CreateGround("pitch", { width: 22, height: 30 }, scene);
pitch.position.z = 8;
pitch.material = pitchMat;

const stripeMat = new B.StandardMaterial("stripeMat", scene);
stripeMat.diffuseColor = new B.Color3(0.09, 0.4, 0.19);
stripeMat.specularColor = new B.Color3(0, 0, 0);
for (let i = 0; i < 8; i++) {
  const strip = B.MeshBuilder.CreateGround("s" + i, { width: 22, height: 1.6 }, scene);
  strip.position.z = i * 3.2 + 0.4;
  strip.position.y = 0.005;
  strip.material = stripeMat;
}

const lineMat = new B.StandardMaterial("lineMat", scene);
lineMat.diffuseColor = new B.Color3(0.95, 0.95, 0.92);
lineMat.emissiveColor = new B.Color3(0.15, 0.15, 0.14);
const boxLine = (name, w, d, x, z) => {
  const m = B.MeshBuilder.CreateBox(name, { width: w, height: 0.03, depth: d }, scene);
  m.position = new B.Vector3(x, 0.02, z);
  m.material = lineMat;
  return m;
};
boxLine("boxL", 0.08, 16.5, -5.5, 8.25);
boxLine("boxR", 0.08, 16.5, 5.5, 8.25);
boxLine("boxB", 11.08, 0.08, 0, 16.5);
boxLine("six", 10, 0.08, 0, 5.5);
boxLine("spotRing", 0.55, 0.55, 0, SPOT_Z);

const postMat = new B.StandardMaterial("postMat", scene);
postMat.diffuseColor = new B.Color3(0.96, 0.95, 0.9);
postMat.specularColor = new B.Color3(0.3, 0.3, 0.3);
function post(name, x) {
  const p = B.MeshBuilder.CreateCylinder(name, { height: BAR_Y, diameter: 0.12 }, scene);
  p.position = new B.Vector3(x, BAR_Y / 2, 0);
  p.material = postMat;
  return p;
}
post("postL", -GOAL_HALF_W);
post("postR", GOAL_HALF_W);
const bar = B.MeshBuilder.CreateCylinder("bar", { height: GOAL_HALF_W * 2 + 0.12, diameter: 0.12 }, scene);
bar.rotation.z = Math.PI / 2;
bar.position = new B.Vector3(0, BAR_Y, 0);
bar.material = postMat;

const netTex = new B.DynamicTexture("netTex", { width: 256, height: 128 }, scene, true);
const nctx = netTex.getContext();
nctx.clearRect(0, 0, 256, 128);
nctx.strokeStyle = "rgba(244,241,232,0.62)";
nctx.lineWidth = 2;
for (let i = 0; i <= 18; i++) {
  nctx.beginPath();
  nctx.moveTo((i / 18) * 256, 0);
  nctx.lineTo((i / 18) * 256, 128);
  nctx.stroke();
}
for (let j = 0; j <= 8; j++) {
  nctx.beginPath();
  nctx.moveTo(0, (j / 8) * 128);
  nctx.lineTo(256, (j / 8) * 128);
  nctx.stroke();
}
netTex.update();
const netMat = new B.StandardMaterial("netMat", scene);
netMat.diffuseTexture = netTex;
netMat.diffuseTexture.hasAlpha = true;
netMat.useAlphaFromDiffuseTexture = true;
netMat.backFaceCulling = false;
netMat.specularColor = new B.Color3(0, 0, 0);
const net = B.MeshBuilder.CreatePlane("net", { width: GOAL_HALF_W * 2 + 0.2, height: BAR_Y }, scene);
net.position = new B.Vector3(0, BAR_Y / 2, -0.85);
net.material = netMat;
const netL = B.MeshBuilder.CreatePlane("netL", { width: 0.9, height: BAR_Y }, scene);
netL.position = new B.Vector3(-GOAL_HALF_W, BAR_Y / 2, -0.42);
netL.rotation.y = Math.PI / 2;
netL.material = netMat;
const netR = netL.clone("netR");
netR.position.x = GOAL_HALF_W;

const ballMat = new B.StandardMaterial("ballMat", scene);
ballMat.diffuseColor = new B.Color3(0.96, 0.96, 0.94);
ballMat.specularColor = new B.Color3(0.25, 0.25, 0.25);
const ball = B.MeshBuilder.CreateSphere("ball", { diameter: BALL_R * 2, segments: 14 }, scene);
ball.material = ballMat;

const bodyMat = new B.StandardMaterial("bodyMat", scene);
bodyMat.diffuseColor = new B.Color3(0.12, 0.22, 0.55);
const skinMat = new B.StandardMaterial("skinMat", scene);
skinMat.diffuseColor = new B.Color3(0.94, 0.8, 0.64);
const keeperRoot = new B.TransformNode("keeper", scene);
const body = B.MeshBuilder.CreateBox("body", { width: 0.52, height: 1.05, depth: 0.28 }, scene);
body.position.y = 0.85;
body.material = bodyMat;
body.parent = keeperRoot;
const head = B.MeshBuilder.CreateSphere("head", { diameter: 0.28, segments: 10 }, scene);
head.position.y = 1.52;
head.material = skinMat;
head.parent = keeperRoot;
const gloveL = B.MeshBuilder.CreateBox("gloveL", { width: 0.16, height: 0.16, depth: 0.1 }, scene);
gloveL.position = new B.Vector3(-0.4, 1.05, 0.12);
gloveL.material = skinMat;
gloveL.parent = keeperRoot;
const gloveR = gloveL.clone("gloveR");
gloveR.position.x = 0.4;

const aimMat = new B.StandardMaterial("aimMat", scene);
aimMat.diffuseColor = new B.Color3(1, 0.88, 0.35);
aimMat.emissiveColor = new B.Color3(0.35, 0.28, 0.05);
const aimDot = B.MeshBuilder.CreateSphere("aimDot", { diameter: 0.16, segments: 8 }, scene);
aimDot.material = aimMat;

const aimPlane = B.MeshBuilder.CreatePlane("aimPlane", { width: XWIDTH, height: YMAX }, scene);
aimPlane.position = new B.Vector3(0, YMAX / 2, 0.04);
aimPlane.isVisible = false;
aimPlane.isPickable = true;
pitch.isPickable = false;

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
  keeperRoot.position.z = 0.42;
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

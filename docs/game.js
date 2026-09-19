import {
  Lane,
  Height,
  KickOutcome,
  Phase,
  classifyLane,
  resolve,
  goalsApply,
  matchOver,
  outcomeToPhase,
} from "./laws.js";

const canvas = document.getElementById("pitch");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const kicksEl = document.getElementById("kicks");
const statusEl = document.getElementById("status");
const againBtn = document.getElementById("again");

const FRAME = [Lane.Left, Lane.Center, Lane.Right];
const LANES = [Lane.WideLeft, Lane.Left, Lane.Center, Lane.Right, Lane.WideRight];

const GOAL = { x: 0.18, y: 0.05, w: 0.64, h: 0.28 };
const SPOT = { x: 0.5, y: 0.86 };
const REST_AIM = { x: 0.5, y: GOAL.y + GOAL.h * 0.55 };

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
    ball: { x: SPOT.x, y: SPOT.y },
    dest: { x: SPOT.x, y: SPOT.y },
    keeperX: 0.5,
    keeperTarget: 0.5,
    outcome: null,
  };
}

let S = fresh();

function statusText() {
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

function hud() {
  scoreEl.textContent = `YOU ${S.you} - ${S.them} AI`;
  kicksEl.textContent = S.phase === Phase.PhaseOver
    ? "Match over"
    : `Best of 5 · ${S.side === "you" ? "you shoot" : "AI shoots"}`;
  statusEl.textContent = statusText();
  againBtn.hidden = S.phase !== Phase.PhaseOver;
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
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

function classifyPitch(nx, ny) {
  return { lane: classifyLane(nx), height: ny < GOAL.y ? Height.Over : Height.Under };
}

function pickDive(lane) {
  const cover = S.side === "you" ? 0.36 : 0.55;
  if (Math.random() < cover && FRAME.includes(lane)) return lane;
  return FRAME[(Math.random() * 3) | 0];
}

function shoot(lane, height) {
  if (S.phase !== Phase.PhaseAiming) return;
  const dive = pickDive(lane);
  const saved = dive === lane;
  S.outcome = resolve(lane, height, saved);
  S.phase = Phase.PhaseFlight;
  S.t = 0;
  S.dest = { x: S.aimX, y: S.aimY };
  S.keeperTarget = Math.min(1, Math.max(0, saved
    ? (S.aimX - GOAL.x) / GOAL.w
    : laneCenter(dive)));
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
}

function nextKick() {
  if (S.phase === Phase.PhaseOver) return;
  S.side = S.side === "you" ? "them" : "you";
  S.phase = Phase.PhaseAiming;
  S.outcome = null;
  S.t = 0;
  S.ball = { x: SPOT.x, y: SPOT.y };
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

function pointInCanvas(ev) {
  const r = canvas.getBoundingClientRect();
  const src = "clientX" in ev ? ev : ev.touches[0];
  return {
    x: Math.min(1, Math.max(0, (src.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (src.clientY - r.top) / r.height)),
  };
}

function aimFromPointer(ev) {
  if (S.phase !== Phase.PhaseAiming || S.side !== "you") return;
  const p = pointInCanvas(ev);
  S.aimX = p.x;
  S.aimY = p.y;
}

function advanceFromClick() {
  if (S.phase === Phase.PhaseGoal || S.phase === Phase.PhaseSaved || S.phase === Phase.PhaseMiss) {
    nextKick();
    return true;
  }
  return false;
}

function tryShootFromPointer(ev) {
  if (advanceFromClick()) return;
  if (S.phase !== Phase.PhaseAiming || S.side !== "you") return;
  aimFromPointer(ev);
  const { lane, height } = classifyPitch(S.aimX, S.aimY);
  shoot(lane, height);
}

canvas.addEventListener("pointermove", aimFromPointer);
canvas.addEventListener("pointerdown", tryShootFromPointer);

window.addEventListener("keydown", (ev) => {
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
  S = fresh();
});

function drawPitch(w, h) {
  ctx.fillStyle = "#1b7a3a";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#176b33";
  for (let i = 0; i < 9; i++) ctx.fillRect((i / 9) * w, 0, w / 18, h);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.18, h * 0.12, w * 0.64, h * 0.78);
  ctx.beginPath();
  ctx.arc(w * SPOT.x, h * SPOT.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  const gx = w * GOAL.x;
  const gy = h * GOAL.y;
  const gw = w * GOAL.w;
  const gh = h * GOAL.h;
  ctx.fillStyle = "rgba(10, 40, 20, 0.35)";
  ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle = "rgba(244,241,232,0.28)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(gx + (i / 10) * gw, gy);
    ctx.lineTo(gx + (i / 10) * gw, gy + gh);
    ctx.stroke();
  }
  for (let j = 1; j < 5; j++) {
    ctx.beginPath();
    ctx.moveTo(gx, gy + (j / 5) * gh);
    ctx.lineTo(gx + gw, gy + (j / 5) * gh);
    ctx.stroke();
  }
  ctx.strokeStyle = "#f4f1e8";
  ctx.lineWidth = 10;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(gx, gy + gh + 8);
  ctx.lineTo(gx, gy);
  ctx.lineTo(gx + gw, gy);
  ctx.lineTo(gx + gw, gy + gh + 8);
  ctx.stroke();
  ctx.fillStyle = "#f4f1e8";
  ctx.fillRect(gx - 5, gy + gh, 10, 10);
  ctx.fillRect(gx + gw - 5, gy + gh, 10, 10);
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  drawPitch(w, h);

  S.keeperX += (S.keeperTarget - S.keeperX) * 0.12;
  const kx = w * (GOAL.x + S.keeperX * GOAL.w);
  const ky = h * (GOAL.y + GOAL.h * 0.78);
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(kx - 16, ky - 28, 32, 40);
  ctx.fillStyle = "#f1d5b0";
  ctx.beginPath();
  ctx.arc(kx, ky - 36, 10, 0, Math.PI * 2);
  ctx.fill();

  if (S.phase === Phase.PhaseAiming && S.side === "you") {
    const ax = w * S.aimX;
    const ay = h * S.aimY;
    ctx.strokeStyle = "rgba(244,241,232,0.7)";
    ctx.lineWidth = 2;
    ctx.lineCap = "butt";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w * SPOT.x, h * SPOT.y);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffe082";
    ctx.beginPath();
    ctx.arc(ax, ay, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  if (S.phase === Phase.PhaseFlight) {
    S.t = Math.min(1, S.t + 0.028);
    const u = S.t;
    const lift = Math.sin(u * Math.PI) * 0.16;
    S.ball.x = SPOT.x + (S.dest.x - SPOT.x) * u;
    S.ball.y = SPOT.y + (S.dest.y - SPOT.y) * u - lift;
    if (u >= 1) finishKick();
  }

  ctx.fillStyle = "#f4f1e8";
  ctx.beginPath();
  ctx.arc(w * S.ball.x, h * S.ball.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (S.outcome && S.phase !== Phase.PhaseFlight && S.phase !== Phase.PhaseAiming) {
    ctx.fillStyle = "rgba(11, 31, 18, 0.55)";
    ctx.fillRect(w * 0.28, h * 0.42, w * 0.44, h * 0.14);
    ctx.fillStyle = "#f4f1e8";
    ctx.font = "28px ui-sans-serif, sans-serif";
    ctx.textAlign = "center";
    const label = S.outcome === KickOutcome.OutGoal ? "GOAL" : S.outcome === KickOutcome.OutSaved ? "SAVED" : "MISS";
    ctx.fillText(label, w * 0.5, h * 0.51);
  }

  hud();
  requestAnimationFrame(draw);
}

hud();
requestAnimationFrame(draw);

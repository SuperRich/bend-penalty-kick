export const GOAL = { x: 0.18, y: 0.05, w: 0.64, h: 0.28 };
export const SPOT = { x: 0.5, y: 0.86 };
export const REST_AIM = { x: 0.5, y: GOAL.y + GOAL.h * 0.55 };

export const BAR_Y = 2.44;
export const GOAL_HALF_W = 3.66;
export const XWIDTH = (GOAL_HALF_W * 2) / GOAL.w;
export const XMIN = -GOAL_HALF_W - GOAL.x * XWIDTH;
export const YMAX = BAR_Y / (1 - GOAL.y);
export const SPOT_Z = 11;
export const BALL_R = 0.11;

export function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

export function worldToNorm(x, y) {
  return { x: clamp01((x - XMIN) / XWIDTH), y: clamp01(1 - y / YMAX) };
}

export function normToWorld(nx, ny) {
  return { x: XMIN + nx * XWIDTH, y: (1 - ny) * YMAX };
}

export function keeperWorldX(keeperX) {
  return -GOAL_HALF_W + clamp01(keeperX) * (GOAL_HALF_W * 2);
}

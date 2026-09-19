let ctx = null;

export function unlockSound() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve();
    ctx = new AC();
  }
  if (ctx.state === "suspended") return ctx.resume();
  return Promise.resolve();
}

function envGain(duration, peak) {
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  g.connect(ctx.destination);
  return { g, t };
}

function tone(freq, dur, type, peak, slide) {
  if (!ctx) return;
  const { g, t } = envGain(dur, peak);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, peak, filterFreq, type) {
  if (!ctx) return;
  const n = Math.max(1, (dur * ctx.sampleRate) | 0);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const { g } = envGain(dur, peak);
  src.connect(f);
  f.connect(g);
  src.start();
}

export function playKick() {
  noise(0.12, 0.28, 180, "lowpass");
  tone(90, 0.16, "sine", 0.2, 45);
}

export function playGoal() {
  noise(0.55, 0.12, 1200, "bandpass");
  tone(523, 0.18, "triangle", 0.1);
  window.setTimeout(() => tone(659, 0.18, "triangle", 0.1), 90);
  window.setTimeout(() => tone(784, 0.28, "triangle", 0.12), 180);
}

export function playSave() {
  noise(0.18, 0.3, 140, "lowpass");
  tone(70, 0.2, "square", 0.08, 40);
}

export function playMiss() {
  tone(1800, 0.35, "sine", 0.07, 1400);
  tone(1900, 0.28, "sine", 0.04);
}

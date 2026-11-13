import type { AssetItem } from "../types/arcade";

let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtor();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function playSynthPreset(preset: AssetItem["synthPreset"] = "crystal", volume = 0.35) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(Math.max(0.01, Math.min(0.8, volume)), now);
  master.connect(ctx.destination);

  if (preset === "laser") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (preset === "boost") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.32);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (preset === "collision") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.32);
  } else if (preset === "bassline") {
    const notes = [110, 110, 146.83, 164.81, 130.81, 110];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = now + idx * 0.11;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.105);
    });
  } else {
    // crystal chime
    [523.25, 659.25, 987.77].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = now + idx * 0.055;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }
}

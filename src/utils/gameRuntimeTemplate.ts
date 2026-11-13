function wrapGameHtml(title: string, scriptBody: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
<title>${title} — PromptArcade Runtime</title>
<style>
  * { box-sizing: border-box; user-select: none; -webkit-user-select: none; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #04060d; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #e2e2e8; }
  canvas { display: block; width: 100%; height: 100%; }
  #touch-controls { position: fixed; inset: 0; pointer-events: none; display: none; justify-content: space-between; align-items: flex-end; padding: 16px; z-index: 10; }
  .touch-group { display: flex; gap: 10px; pointer-events: auto; }
  .touch-btn { width: 52px; height: 52px; border-radius: 12px; border: 1px solid rgba(76,215,246,0.45); background: rgba(12,14,18,0.75); color: #4cd7f6; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
  .touch-btn:active { background: rgba(76,215,246,0.28); transform: scale(0.95); }
  .touch-action { width: 88px; border-color: rgba(255,121,180,0.55); color: #ffb0cd; font-size: 12px; letter-spacing: 0.06em; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<div id="touch-controls">
  <div class="touch-group">
    <button class="touch-btn" data-key="ArrowLeft">◀</button>
    <button class="touch-btn" data-key="ArrowUp">▲</button>
    <button class="touch-btn" data-key="ArrowDown">▼</button>
    <button class="touch-btn" data-key="ArrowRight">▶</button>
  </div>
  <div class="touch-group">
    <button class="touch-btn touch-action" data-key="Space">ACTION</button>
  </div>
</div>
<script>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const touchEl = document.getElementById('touch-controls');

  let width = 960;
  let height = 540;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth || 960;
    height = window.innerHeight || 540;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const keys = {};
  let paused = false;
  let isMuted = false;
  let params = {
    speedMultiplier: 1.0,
    hazardDensity: 1.0,
    bloomIntensity: 1.0,
    synthBpm: 128,
    paletteMode: 'synthwave',
    mobileControls: false,
    masterVolume: 0.5
  };

  function syncTouchVisibility() {
    touchEl.style.display = params.mobileControls ? 'flex' : 'none';
  }

  // Audio synthesizer
  let audioCtx = null;
  function ensureAudio() {
    if (isMuted) return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playTone(freq, endFreq, dur, type = 'sine', gainVal = 0.22) {
    if (isMuted) return;
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), now + dur);
    }
    const vol = Math.max(0.005, gainVal * (params.masterVolume ?? 0.5));
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function logHost(level, message) {
    try {
      window.parent.postMessage({ type: 'PA_LOG', level, message }, '*');
    } catch {}
  }

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    keys[e.key.toLowerCase()] = true;
    ensureAudio();
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keys[e.key.toLowerCase()] = false;
  });

  document.querySelectorAll('.touch-btn').forEach((btn) => {
    const code = btn.getAttribute('data-key');
    const setDown = (val) => { keys[code] = val; ensureAudio(); };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setDown(true); });
    btn.addEventListener('pointerup', () => setDown(false));
    btn.addEventListener('pointercancel', () => setDown(false));
    btn.addEventListener('pointerleave', () => setDown(false));
  });

  function getPalette() {
    if (params.paletteMode === 'cyber-cyan') {
      return { skyTop: '#061523', skyMid: '#071a2f', ground: '#030812', primary: '#4cd7f6', secondary: '#81e6d9', tertiary: '#f59e0b', sunTop: '#4cd7f6', sunBot: '#06b6d4' };
    }
    if (params.paletteMode === 'crimson-void') {
      return { skyTop: '#240615', skyMid: '#150612', ground: '#090308', primary: '#ff79b4', secondary: '#f43f5e', tertiary: '#4cd7f6', sunTop: '#ff79b4', sunBot: '#93000a' };
    }
    return { skyTop: '#130722', skyMid: '#070b19', ground: '#04060d', primary: '#4cd7f6', secondary: '#c0c1ff', tertiary: '#ff79b4', sunTop: '#ffb0cd', sunBot: '#ff79b4' };
  }

  ${scriptBody}

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'PA_PAUSE') { paused = true; logHost('info', 'Runtime paused'); }
    if (d.type === 'PA_RESUME') { paused = false; logHost('info', 'Runtime resumed'); }
    if (d.type === 'PA_RESET') { paused = false; if (typeof resetGame === 'function') resetGame(); logHost('info', 'Session reset'); }
    if (d.type === 'PA_MUTE') { isMuted = Boolean(d.muted); }
    if (d.type === 'PA_PARAMS' && d.params) {
      params = { ...params, ...d.params };
      syncTouchVisibility();
    }
  });

  let lastTime = performance.now();
  let fpsTimer = 0;
  let frameCount = 0;
  let currentFps = 60;
  let lastFrameMs = 16.6;

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastFrameMs = (now - lastTime) || 16.6;
    lastTime = now;

    if (!paused) {
      update(dt, now);
    }
    render(now);

    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.25) {
      currentFps = Math.min(60, Math.max(24, Math.round(frameCount / fpsTimer)));
      frameCount = 0;
      fpsTimer = 0;
      const stats = typeof getTelemetry === 'function' ? getTelemetry() : { entityCount: 40, score: 0, highScore: 0, speed: 0, shield: 100 };
      try {
        window.parent.postMessage({
          type: 'PA_TELEMETRY',
          fps: paused ? 0 : currentFps,
          frameTimeMs: Number(Math.min(33.3, Math.max(8.2, lastFrameMs)).toFixed(1)),
          memoryMb: Number((38.4 + (stats.entityCount || 20) * 0.04).toFixed(1)),
          entityCount: stats.entityCount || 0,
          score: Math.floor(stats.score || 0),
          highScore: Math.floor(stats.highScore || 0),
          speed: Math.floor(stats.speed || 0),
          shield: Math.max(0, Math.min(100, Math.round(stats.shield ?? 100))),
          status: paused ? 'PAUSED' : 'LIVE'
        }, '*');
      } catch {}
    }
    requestAnimationFrame(loop);
  }
  logHost('build', 'Mounted RetroGL Canvas2D runtime');
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
}

export const CYBER_RACER_HTML = wrapGameHtml(
  "Cyber-Racer 2084",
  `
  let score = 48290;
  let highScore = 120500;
  let multiplier = 4;
  let shield = 88;
  let playerX = 0; // -1 to 1 lane space
  let playerVX = 0;
  let boostTimer = 0;
  let hitFlash = 0;
  let gridScroll = 0;
  let gameOver = false;
  let roadObjects = [];
  let particles = [];
  let spawnTimer = 0;

  function resetGame() {
    score = 0;
    multiplier = 1;
    shield = 100;
    playerX = 0;
    playerVX = 0;
    boostTimer = 0;
    hitFlash = 0;
    gameOver = false;
    roadObjects = [
      { z: 0.25, lane: -0.45, type: 'hazard' },
      { z: 0.45, lane: 0.35, type: 'crystal' },
      { z: 0.72, lane: 0.1, type: 'hazard' },
      { z: 0.88, lane: -0.25, type: 'crystal' }
    ];
    particles = [];
  }

  // Seed visual objects matching reference scene
  roadObjects = [
    { z: 0.18, lane: -0.15, type: 'hazard' },
    { z: 0.34, lane: 0.32, type: 'crystal' },
    { z: 0.56, lane: -0.52, type: 'hazard' },
    { z: 0.78, lane: 0.15, type: 'crystal' }
  ];

  function update(dt) {
    if (gameOver) {
      if (keys['Space'] || keys['Enter']) {
        resetGame();
        playTone(320, 640, 0.2, 'triangle', 0.3);
      }
      return;
    }

    const left = keys['ArrowLeft'] || keys['KeyA'] || keys['a'];
    const right = keys['ArrowRight'] || keys['KeyD'] || keys['d'];
    const up = keys['ArrowUp'] || keys['KeyW'] || keys['w'];
    const nitro = keys['Space'];

    if (nitro && boostTimer <= 0) {
      boostTimer = 1.6;
      playTone(180, 620, 0.26, 'sawtooth', 0.22);
      logHost('info', 'Nitro boost engaged (+25% velocity)');
    }
    if (boostTimer > 0) boostTimer = Math.max(0, boostTimer - dt);
    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt);

    const steerAccel = 4.8;
    if (left) playerVX -= steerAccel * dt;
    if (right) playerVX += steerAccel * dt;
    playerVX *= Math.pow(0.06, dt);
    playerX = Math.max(-0.82, Math.min(0.82, playerX + playerVX * dt));

    const baseSpeed = (0.58 + (up ? 0.2 : 0) + (boostTimer > 0 ? 0.28 : 0)) * (params.speedMultiplier || 1);
    gridScroll = (gridScroll + baseSpeed * dt * 2.2) % 1;
    score += baseSpeed * 120 * multiplier * dt;
    if (score > highScore) highScore = score;

    // Emit dual thruster particles
    if (Math.random() < 0.85) {
      particles.push({
        xOffset: -18 + (Math.random() - 0.5) * 4,
        yOffset: 0,
        vx: (Math.random() - 0.5) * 20,
        vy: 140 + Math.random() * 80,
        life: 0.42,
        maxLife: 0.42
      });
      particles.push({
        xOffset: 18 + (Math.random() - 0.5) * 4,
        yOffset: 0,
        vx: (Math.random() - 0.5) * 20,
        vy: 140 + Math.random() * 80,
        life: 0.42,
        maxLife: 0.42
      });
    }

    particles.forEach(p => {
      p.xOffset += p.vx * dt;
      p.yOffset += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    spawnTimer += dt * (params.hazardDensity || 1);
    if (spawnTimer > 0.72) {
      spawnTimer = 0;
      const isCrystal = Math.random() < 0.42;
      roadObjects.push({
        z: 0.02,
        lane: (Math.random() - 0.5) * 1.45,
        type: isCrystal ? 'crystal' : 'hazard'
      });
    }

    for (let i = roadObjects.length - 1; i >= 0; i--) {
      const obj = roadObjects[i];
      obj.z += baseSpeed * dt * (0.45 + obj.z * 1.15);
      if (obj.z >= 0.82 && obj.z <= 0.94 && Math.abs(obj.lane - playerX) < 0.22) {
        if (obj.type === 'crystal') {
          score += 500 * multiplier;
          multiplier = Math.min(8, multiplier + 1);
          shield = Math.min(100, shield + 6);
          playTone(580, 1180, 0.16, 'sine', 0.25);
          logHost('info', 'Crystal collected · Multiplier x' + multiplier);
        } else {
          shield -= 22;
          multiplier = 1;
          hitFlash = 0.35;
          playTone(130, 48, 0.24, 'square', 0.3);
          logHost('warn', 'Hazard collision! Shield at ' + Math.max(0, shield) + '%');
          if (shield <= 0) {
            shield = 0;
            gameOver = true;
            logHost('warn', 'Run ended — Final score ' + Math.floor(score));
          }
        }
        roadObjects.splice(i, 1);
        continue;
      }
      if (obj.z > 1.12) {
        roadObjects.splice(i, 1);
      }
    }
  }

  function render(now) {
    const pal = getPalette();
    const horizonY = height * 0.46;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(0.48, pal.skyMid);
    sky.addColorStop(1, pal.ground);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Synthwave sun
    const sunR = Math.min(width, height) * 0.19;
    const sunX = width * 0.5;
    const sunY = horizonY - sunR * 0.25;
    ctx.save();
    ctx.shadowBlur = 45 * (params.bloomIntensity || 1);
    ctx.shadowColor = pal.tertiary;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, pal.sunTop);
    sunGrad.addColorStop(1, pal.sunBot);
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sun horizontal slices
    ctx.fillStyle = pal.skyMid;
    for (let i = 0; i < 5; i++) {
      const sy = sunY + sunR * 0.1 + i * (sunR * 0.17);
      ctx.fillRect(sunX - sunR - 4, sy, sunR * 2 + 8, 3 + i * 1.8);
    }

    // Skyline silhouettes
    ctx.fillStyle = '#090b12';
    const bWidths = [28, 44, 22, 54, 38, 62, 26, 48, 34, 52, 30, 42];
    const stepX = width / bWidths.length;
    bWidths.forEach((bw, idx) => {
      const bh = 22 + ((idx * 37) % 48);
      ctx.fillRect(idx * stepX + 6, horizonY - bh, Math.min(bw, stepX - 8), bh + 2);
    });

    // Perspective grid road
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY, width, height - horizonY);
    ctx.clip();

    // Horizontal grid lines
    for (let i = 0; i < 12; i++) {
      const t = ((i / 12) + gridScroll * (1 / 12)) % 1;
      const y = horizonY + Math.pow(t, 2.2) * (height - horizonY);
      ctx.strokeStyle = pal.primary;
      ctx.globalAlpha = 0.15 + t * 0.7;
      ctx.lineWidth = 1 + t * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Converging perspective rays
    const laneBottomOffsets = [-0.95, -0.58, -0.26, 0, 0.26, 0.58, 0.95];
    laneBottomOffsets.forEach((offset, idx) => {
      ctx.strokeStyle = (idx >= 2 && idx <= 4) ? pal.tertiary : pal.primary;
      ctx.globalAlpha = idx === 3 ? 0.75 : 0.65;
      ctx.lineWidth = idx === 3 ? 2.5 : 2;
      if (idx === 3) ctx.setLineDash([18, 14]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, horizonY);
      ctx.lineTo(width * 0.5 + offset * width * 0.62, height);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // Draw road objects (sorted back-to-front)
    roadObjects.sort((a, b) => a.z - b.z).forEach((obj) => {
      const p = Math.pow(obj.z, 1.85);
      const y = horizonY + p * (height - horizonY);
      const roadHalf = (width * 0.42) * (0.08 + p * 0.92);
      const x = width * 0.5 + obj.lane * roadHalf;
      const scale = 0.25 + p * 1.1;

      ctx.save();
      ctx.translate(x, y);
      if (obj.type === 'crystal') {
        const s = 18 * scale;
        ctx.rotate(Math.PI / 4 + now * 0.002);
        ctx.shadowBlur = 20 * (params.bloomIntensity || 1);
        ctx.shadowColor = pal.primary;
        const g = ctx.createLinearGradient(-s, -s, s, s);
        g.addColorStop(0, pal.primary);
        g.addColorStop(1, pal.secondary);
        ctx.fillStyle = g;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const w = 86 * scale;
        const h = 32 * scale;
        const pulse = 0.8 + Math.sin(now * 0.01) * 0.2;
        ctx.shadowBlur = 24 * pulse * (params.bloomIntensity || 1);
        ctx.shadowColor = pal.tertiary;
        ctx.fillStyle = pal.tertiary;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 5 * scale);
        ctx.fill();
        if (scale > 0.5) {
          ctx.fillStyle = '#0c0e12';
          ctx.font = '700 ' + Math.max(8, Math.round(10 * scale)) + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('DANGER', 0, 1);
        }
      }
      ctx.restore();
    });

    // Player hovercar
    const carX = width * 0.5 + playerX * (width * 0.36);
    const carY = height * 0.82;

    // Particle streams
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = pal.primary;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(carX + p.xOffset, carY + 24 + p.yOffset * 0.4, 4.5 * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(playerVX * 0.06);
    ctx.shadowBlur = 32 * (params.bloomIntensity || 1);
    ctx.shadowColor = hitFlash > 0 ? '#ff3b5c' : pal.primary;
    ctx.fillStyle = '#141d2b';
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-52, -26, 104, 52, 14);
    ctx.fill();
    ctx.stroke();

    // Cockpit
    const cockGrad = ctx.createLinearGradient(0, -16, 0, 8);
    cockGrad.addColorStop(0, pal.primary);
    cockGrad.addColorStop(1, pal.secondary);
    ctx.fillStyle = cockGrad;
    ctx.beginPath();
    ctx.roundRect(-24, -15, 48, 20, 8);
    ctx.fill();

    // Dual thrusters
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.roundRect(-34, 14, 16, 6, 3);
    ctx.roundRect(18, 14, 16, 6, 3);
    ctx.fill();
    ctx.restore();

    // Hit flash
    if (hitFlash > 0) {
      ctx.fillStyle = 'rgba(255, 59, 92, ' + (hitFlash * 0.4) + ')';
      ctx.fillRect(0, 0, width, height);
    }

    // Sleek Top HUD
    const pad = 14;
    ctx.fillStyle = 'rgba(12, 14, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(pad, pad, 198, 56, 10);
    ctx.roundRect(width - 212, pad, 198, 56, 10);
    ctx.fill();

    ctx.fillStyle = '#869397';
    ctx.font = '700 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', pad + 12, pad + 18);
    ctx.fillStyle = pal.primary;
    ctx.font = '700 20px sans-serif';
    ctx.fillText(Math.floor(score).toLocaleString().padStart(7, '0'), pad + 60, pad + 21);

    ctx.fillStyle = '#869397';
    ctx.font = '600 10px monospace';
    ctx.fillText('HI: ' + Math.floor(highScore).toLocaleString() + '  •  x' + multiplier, pad + 12, pad + 42);

    if (boostTimer > 0) {
      ctx.fillStyle = 'rgba(255, 121, 180, 0.25)';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 110, pad + 4, 220, 26, 13);
      ctx.fill();
      ctx.fillStyle = pal.tertiary;
      ctx.font = '700 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPEED BOOST ACTIVE // +25%', width / 2, pad + 21);
    }

    const vel = Math.round((240 + (boostTimer > 0 ? 60 : 0)) * (params.speedMultiplier || 1));
    ctx.textAlign = 'right';
    ctx.fillStyle = '#869397';
    ctx.font = '700 10px monospace';
    ctx.fillText('VELOCITY', width - 134, pad + 18);
    ctx.fillStyle = pal.secondary;
    ctx.font = '700 18px sans-serif';
    ctx.fillText(vel + ' KM/H', width - 26, pad + 21);

    // Shield bar
    ctx.textAlign = 'left';
    ctx.fillStyle = '#869397';
    ctx.font = '700 10px monospace';
    ctx.fillText('SHIELD', width - 200, pad + 42);
    ctx.fillStyle = '#282a2e';
    ctx.beginPath();
    ctx.roundRect(width - 148, pad + 34, 86, 8, 4);
    ctx.fill();
    ctx.fillStyle = shield > 30 ? pal.primary : '#ffb4ab';
    ctx.beginPath();
    ctx.roundRect(width - 148, pad + 34, Math.max(0, 86 * (shield / 100)), 8, 4);
    ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(shield) + '%', width - 26, pad + 42);

    // Bottom hint
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(12, 14, 18, 0.78)';
    ctx.beginPath();
    ctx.roundRect(pad, height - 38, 285, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#bcc9cd';
    ctx.font = '600 10px monospace';
    ctx.fillText('WASD / ARROWS TO STEER  •  SPACE NITRO', pad + 10, height - 22);

    if (gameOver) {
      ctx.fillStyle = 'rgba(12, 14, 18, 0.85)';
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.fillStyle = pal.tertiary;
      ctx.font = '700 32px sans-serif';
      ctx.fillText('SHIELD DEPLETED', width / 2, height / 2 - 20);
      ctx.fillStyle = '#e2e2e8';
      ctx.font = '600 14px monospace';
      ctx.fillText('FINAL SCORE: ' + Math.floor(score).toLocaleString() + '  •  PRESS SPACE TO REBOOT', width / 2, height / 2 + 18);
    }
  }

  function getTelemetry() {
    return {
      entityCount: 112 + roadObjects.length + particles.length,
      score,
      highScore,
      speed: Math.round(240 * (params.speedMultiplier || 1)),
      shield
    };
  }
`
);

export const PIXEL_DUNGEON_HTML = wrapGameHtml(
  "Pixel Dungeon AI",
  `
  let score = 1420;
  let highScore = 8900;
  let hp = 100;
  let floor = 1;
  let px = 0.5, py = 0.5;
  let dashCd = 0;
  let gems = [];
  let drones = [];
  let pulses = [];
  let gameOver = false;

  function spawnFloor() {
    gems = Array.from({ length: 7 }, () => ({ x: 0.12 + Math.random() * 0.76, y: 0.16 + Math.random() * 0.72 }));
    const count = Math.max(2, Math.round((3 + floor) * (params.hazardDensity || 1)));
    drones = Array.from({ length: count }, () => ({
      x: Math.random() < 0.5 ? 0.12 : 0.88,
      y: 0.18 + Math.random() * 0.68,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35
    }));
  }

  function resetGame() {
    score = 0; hp = 100; floor = 1; px = 0.5; py = 0.5; gameOver = false; pulses = [];
    spawnFloor();
  }
  spawnFloor();

  function update(dt) {
    if (gameOver) {
      if (keys['Space']) resetGame();
      return;
    }
    const spd = 0.42 * (params.speedMultiplier || 1);
    if (keys['ArrowLeft'] || keys['KeyA'] || keys['a']) px -= spd * dt;
    if (keys['ArrowRight'] || keys['KeyD'] || keys['d']) px += spd * dt;
    if (keys['ArrowUp'] || keys['KeyW'] || keys['w']) py -= spd * dt;
    if (keys['ArrowDown'] || keys['KeyS'] || keys['s']) py += spd * dt;
    px = Math.max(0.06, Math.min(0.94, px));
    py = Math.max(0.12, Math.min(0.92, py));

    dashCd = Math.max(0, dashCd - dt);
    if (keys['Space'] && dashCd <= 0) {
      dashCd = 0.65;
      pulses.push({ x: px, y: py, r: 0.02, maxR: 0.22 });
      playTone(440, 880, 0.15, 'triangle', 0.25);
      drones = drones.filter((d) => {
        const dist = Math.hypot(d.x - px, d.y - py);
        if (dist < 0.2) { score += 250; return false; }
        return true;
      });
    }

    pulses.forEach(p => p.r += dt * 0.55);
    pulses = pulses.filter(p => p.r < p.maxR);

    for (let i = gems.length - 1; i >= 0; i--) {
      if (Math.hypot(gems[i].x - px, gems[i].y - py) < 0.045) {
        gems.splice(i, 1);
        score += 180;
        if (score > highScore) highScore = score;
        playTone(620, 1240, 0.12, 'sine', 0.22);
      }
    }
    if (gems.length === 0) {
      floor++;
      hp = Math.min(100, hp + 15);
      spawnFloor();
      playTone(330, 660, 0.25, 'sine', 0.28);
      logHost('info', 'Entered Dungeon Floor ' + floor);
    }

    drones.forEach(d => {
      d.x += d.vx * dt * (params.speedMultiplier || 1);
      d.y += d.vy * dt * (params.speedMultiplier || 1);
      if (d.x < 0.06 || d.x > 0.94) d.vx *= -1;
      if (d.y < 0.12 || d.y > 0.92) d.vy *= -1;
      if (Math.hypot(d.x - px, d.y - py) < 0.04) {
        hp -= 28 * dt;
        if (hp <= 0) { hp = 0; gameOver = true; playTone(120, 40, 0.3, 'sawtooth', 0.3); }
      }
    });
  }

  function render() {
    const pal = getPalette();
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(76, 215, 246, 0.08)';
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = 0; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    pulses.forEach(p => {
      ctx.strokeStyle = pal.primary;
      ctx.globalAlpha = 1 - p.r / p.maxR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.r * Math.min(width, height), 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    gems.forEach(g => {
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.arc(g.x * width, g.y * height, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    drones.forEach(d => {
      ctx.fillStyle = pal.tertiary;
      ctx.beginPath();
      ctx.roundRect(d.x * width - 11, d.y * height - 11, 22, 22, 5);
      ctx.fill();
    });

    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.arc(px * width, py * height, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(12,14,18,0.82)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 280, 38, 8);
    ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.font = '700 12px monospace';
    ctx.fillText('FLOOR ' + floor + '  •  SCORE ' + Math.floor(score) + '  •  HP ' + Math.round(hp) + '%', 26, 37);

    if (gameOver) {
      ctx.fillStyle = 'rgba(12,14,18,0.85)';
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.fillStyle = pal.tertiary;
      ctx.font = '700 28px sans-serif';
      ctx.fillText('DUNGEON RUN ENDED — PRESS SPACE', width / 2, height / 2);
      ctx.textAlign = 'left';
    }
  }

  function getTelemetry() {
    return { entityCount: 24 + gems.length + drones.length, score, highScore, speed: 120, shield: hp };
  }
`
);

export const GALAXY_DEFENDER_HTML = wrapGameHtml(
  "Neon Galaxy Defender",
  `
  let score = 6200;
  let highScore = 34000;
  let shield = 100;
  let shipX = 0.5;
  let fireCd = 0;
  let bullets = [];
  let enemies = [];
  let stars = Array.from({ length: 65 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.5 }));
  let spawnCd = 0;
  let gameOver = false;

  function resetGame() {
    score = 0; shield = 100; shipX = 0.5; bullets = []; enemies = []; gameOver = false;
  }

  function update(dt) {
    if (gameOver) {
      if (keys['Space']) resetGame();
      return;
    }
    stars.forEach(st => { st.y += dt * 0.22 * st.s; if (st.y > 1) { st.y = 0; st.x = Math.random(); } });

    const move = 0.68 * (params.speedMultiplier || 1);
    if (keys['ArrowLeft'] || keys['KeyA'] || keys['a']) shipX -= move * dt;
    if (keys['ArrowRight'] || keys['KeyD'] || keys['d']) shipX += move * dt;
    shipX = Math.max(0.06, Math.min(0.94, shipX));

    fireCd = Math.max(0, fireCd - dt);
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && fireCd <= 0) {
      fireCd = 0.16;
      bullets.push({ x: shipX, y: 0.84 });
      playTone(880, 220, 0.08, 'sawtooth', 0.14);
    }

    bullets.forEach(b => b.y -= dt * 1.25);
    bullets = bullets.filter(b => b.y > -0.05);

    spawnCd -= dt * (params.hazardDensity || 1);
    if (spawnCd <= 0) {
      spawnCd = 0.55;
      enemies.push({ x: 0.08 + Math.random() * 0.84, y: -0.04, hp: 1 });
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += dt * 0.34 * (params.speedMultiplier || 1);
      if (Math.hypot(e.x - shipX, e.y - 0.87) < 0.05) {
        shield -= 25;
        enemies.splice(i, 1);
        playTone(150, 50, 0.2, 'square', 0.26);
        if (shield <= 0) { shield = 0; gameOver = true; }
        continue;
      }
      if (e.y > 1.05) { enemies.splice(i, 1); continue; }
      for (let j = bullets.length - 1; j >= 0; j--) {
        if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < 0.04) {
          bullets.splice(j, 1);
          enemies.splice(i, 1);
          score += 150;
          if (score > highScore) highScore = score;
          playTone(460, 920, 0.07, 'sine', 0.15);
          break;
        }
      }
    }
  }

  function render() {
    const pal = getPalette();
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e2e2e8';
    stars.forEach(st => {
      ctx.globalAlpha = 0.35 + st.s * 0.35;
      ctx.fillRect(st.x * width, st.y * height, st.s * 1.6, st.s * 1.6);
    });
    ctx.globalAlpha = 1;

    bullets.forEach(b => {
      ctx.fillStyle = pal.primary;
      ctx.fillRect(b.x * width - 2, b.y * height - 10, 4, 16);
    });

    enemies.forEach(e => {
      ctx.fillStyle = pal.tertiary;
      ctx.beginPath();
      ctx.moveTo(e.x * width, e.y * height + 14);
      ctx.lineTo(e.x * width - 14, e.y * height - 10);
      ctx.lineTo(e.x * width + 14, e.y * height - 10);
      ctx.closePath();
      ctx.fill();
    });

    const sx = shipX * width;
    const sy = height * 0.87;
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 18);
    ctx.lineTo(sx - 18, sy + 14);
    ctx.lineTo(sx + 18, sy + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(12,14,18,0.8)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 240, 36, 8);
    ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.font = '700 12px monospace';
    ctx.fillText('SCORE ' + score + '  •  SHIELD ' + shield + '%', 24, 36);

    if (gameOver) {
      ctx.fillStyle = 'rgba(12,14,18,0.85)';
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.fillStyle = pal.tertiary;
      ctx.font = '700 28px sans-serif';
      ctx.fillText('STARFIGHTER DESTROYED — PRESS SPACE', width / 2, height / 2);
      ctx.textAlign = 'left';
    }
  }

  function getTelemetry() {
    return { entityCount: 65 + bullets.length + enemies.length, score, highScore, speed: 310, shield };
  }
`
);

export const SYNTHWAVE_PINBALL_HTML = wrapGameHtml(
  "Synthwave Pinball",
  `
  let score = 12800;
  let highScore = 75000;
  let balls = 3;
  let bx = 0.5, by = 0.25, bvx = 0.22, bvy = 0.05;
  let leftFlip = 0, rightFlip = 0;
  const bumpers = [
    { x: 0.36, y: 0.3, r: 0.055, flash: 0 },
    { x: 0.64, y: 0.3, r: 0.055, flash: 0 },
    { x: 0.5, y: 0.44, r: 0.06, flash: 0 }
  ];

  function resetGame() {
    score = 0; balls = 3; bx = 0.5; by = 0.22; bvx = 0.25; bvy = 0.05;
  }

  function update(dt) {
    const lDown = keys['ArrowLeft'] || keys['KeyA'] || keys['a'];
    const rDown = keys['ArrowRight'] || keys['KeyD'] || keys['d'];
    leftFlip += ((lDown ? 1 : 0) - leftFlip) * Math.min(1, dt * 18);
    rightFlip += ((rDown ? 1 : 0) - rightFlip) * Math.min(1, dt * 18);

    bvy += 0.62 * dt * (params.speedMultiplier || 1);
    bx += bvx * dt;
    by += bvy * dt;

    if (bx < 0.14) { bx = 0.14; bvx = Math.abs(bvx) * 0.92; }
    if (bx > 0.86) { bx = 0.86; bvx = -Math.abs(bvx) * 0.92; }
    if (by < 0.08) { by = 0.08; bvy = Math.abs(bvy) * 0.9; }

    bumpers.forEach(bp => {
      bp.flash = Math.max(0, bp.flash - dt * 4);
      const dx = bx - bp.x;
      const dy = by - bp.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bp.r + 0.025) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        bvx = nx * 0.65;
        bvy = ny * 0.65;
        bp.flash = 1;
        score += 350;
        if (score > highScore) highScore = score;
        playTone(540, 880, 0.09, 'sine', 0.22);
      }
    });

    // Flipper zone bounce
    if (by > 0.78 && by < 0.86 && bx > 0.24 && bx < 0.76 && bvy > 0) {
      const hitLeft = bx < 0.5 && lDown;
      const hitRight = bx >= 0.5 && rDown;
      if (hitLeft || hitRight || keys['Space']) {
        bvy = -0.82;
        bvx += (bx - 0.5) * 1.4;
        score += 100;
        playTone(320, 620, 0.1, 'triangle', 0.25);
      }
    }

    if (by > 1.02) {
      balls--;
      if (balls <= 0) { balls = 3; score = 0; }
      bx = 0.5; by = 0.18; bvx = (Math.random() - 0.5) * 0.4; bvy = 0.05;
      playTone(150, 70, 0.22, 'sawtooth', 0.22);
    }
  }

  function render() {
    const pal = getPalette();
    ctx.fillStyle = '#0b0818';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = pal.secondary;
    ctx.lineWidth = 4;
    ctx.strokeRect(width * 0.12, height * 0.06, width * 0.76, height * 0.88);

    bumpers.forEach(bp => {
      ctx.fillStyle = bp.flash > 0 ? '#ffffff' : pal.tertiary;
      ctx.beginPath();
      ctx.arc(bp.x * width, bp.y * height, bp.r * Math.min(width, height), 0, Math.PI * 2);
      ctx.fill();
    });

    // Flippers
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(width * 0.28, height * 0.82);
    ctx.lineTo(width * 0.45, height * (0.85 - leftFlip * 0.09));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.72, height * 0.82);
    ctx.lineTo(width * 0.55, height * (0.85 - rightFlip * 0.09));
    ctx.stroke();

    // Ball
    ctx.fillStyle = '#acedff';
    ctx.beginPath();
    ctx.arc(bx * width, by * height, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(12,14,18,0.82)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 240, 36, 8);
    ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.font = '700 12px monospace';
    ctx.fillText('SCORE ' + score + '  •  BALLS ' + balls, 24, 36);
  }

  function getTelemetry() {
    return { entityCount: 18, score, highScore, speed: Math.round(Math.hypot(bvx, bvy) * 200), shield: balls * 33 };
  }
`
);

export const VAPOR_SLASH_HTML = wrapGameHtml(
  "Vapor Slash 2D",
  `
  let score = 4500;
  let highScore = 22000;
  let shield = 100;
  let px = 0.5, py = 0.55;
  let slashTimer = 0;
  let orbs = Array.from({ length: 6 }, () => ({ x: Math.random(), y: Math.random() * 0.4, vx: (Math.random() - 0.5) * 0.3, vy: 0.16 }));

  function resetGame() { score = 0; shield = 100; px = 0.5; py = 0.55; }

  function update(dt) {
    const spd = 0.52 * (params.speedMultiplier || 1);
    if (keys['ArrowLeft'] || keys['KeyA']) px -= spd * dt;
    if (keys['ArrowRight'] || keys['KeyD']) px += spd * dt;
    if (keys['ArrowUp'] || keys['KeyW']) py -= spd * dt;
    if (keys['ArrowDown'] || keys['KeyS']) py += spd * dt;
    px = Math.max(0.06, Math.min(0.94, px));
    py = Math.max(0.12, Math.min(0.9, py));

    if (keys['Space'] && slashTimer <= 0) {
      slashTimer = 0.22;
      playTone(680, 190, 0.12, 'sawtooth', 0.22);
      orbs.forEach(o => {
        if (Math.hypot(o.x - px, o.y - py) < 0.18) {
          score += 300;
          if (score > highScore) highScore = score;
          o.y = -0.05;
          o.x = 0.1 + Math.random() * 0.8;
        }
      });
    }
    slashTimer = Math.max(0, slashTimer - dt);

    orbs.forEach(o => {
      o.x += o.vx * dt;
      o.y += o.vy * dt * (params.speedMultiplier || 1);
      if (o.x < 0.05 || o.x > 0.95) o.vx *= -1;
      if (o.y > 1.02) { o.y = -0.04; o.x = 0.1 + Math.random() * 0.8; }
      if (Math.hypot(o.x - px, o.y - py) < 0.045) {
        shield = Math.max(0, shield - 25 * dt);
      }
    });
  }

  function render() {
    const pal = getPalette();
    ctx.fillStyle = '#0e071a';
    ctx.fillRect(0, 0, width, height);

    if (slashTimer > 0) {
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(px * width, py * height, 75, 0, Math.PI * 2);
      ctx.stroke();
    }

    orbs.forEach(o => {
      ctx.fillStyle = pal.tertiary;
      ctx.beginPath();
      ctx.arc(o.x * width, o.y * height, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.roundRect(px * width - 14, py * height - 14, 28, 28, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(12,14,18,0.82)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 240, 36, 8);
    ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.font = '700 12px monospace';
    ctx.fillText('SCORE ' + score + '  •  SHIELD ' + Math.round(shield) + '%', 24, 36);
  }

  function getTelemetry() {
    return { entityCount: 16 + orbs.length, score, highScore, speed: 185, shield };
  }
`
);

export const PLATFORMER_TEMPLATE_HTML = wrapGameHtml(
  "Platformer 2D Engine",
  `
  let score = 0, highScore = 5000, px = 0.15, py = 0.7, vy = 0, grounded = false;
  const plats = [
    { x: 0.05, y: 0.82, w: 0.9, h: 0.05 },
    { x: 0.22, y: 0.64, w: 0.22, h: 0.04 },
    { x: 0.54, y: 0.52, w: 0.26, h: 0.04 },
    { x: 0.18, y: 0.36, w: 0.22, h: 0.04 }
  ];
  let coin = { x: 0.66, y: 0.44 };
  function resetGame() { score = 0; px = 0.15; py = 0.7; vy = 0; }
  function update(dt) {
    if (keys['ArrowLeft'] || keys['KeyA']) px -= 0.45 * dt;
    if (keys['ArrowRight'] || keys['KeyD']) px += 0.45 * dt;
    px = Math.max(0.05, Math.min(0.95, px));
    vy += 1.45 * dt;
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && grounded) {
      vy = -0.72; grounded = false; playTone(320, 620, 0.12, 'triangle', 0.22);
    }
    py += vy * dt;
    grounded = false;
    plats.forEach(p => {
      if (px > p.x && px < p.x + p.w && py >= p.y - 0.03 && py <= p.y + 0.03 && vy >= 0) {
        py = p.y - 0.03; vy = 0; grounded = true;
      }
    });
    if (Math.hypot(px - coin.x, py - coin.y) < 0.05) {
      score += 200; if (score > highScore) highScore = score;
      coin = { x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.45 };
      playTone(640, 1280, 0.12, 'sine', 0.22);
    }
  }
  function render() {
    const pal = getPalette();
    ctx.fillStyle = '#070a14'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = pal.secondary;
    plats.forEach(p => ctx.fillRect(p.x * width, p.y * height, p.w * width, p.h * height));
    ctx.fillStyle = pal.tertiary;
    ctx.beginPath(); ctx.arc(coin.x * width, coin.y * height, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.fillRect(px * width - 12, py * height - 24, 24, 24);
    ctx.fillStyle = pal.primary; ctx.font = '700 12px monospace';
    ctx.fillText('SCORE ' + score + '  •  WASD + SPACE JUMP', 20, 32);
  }
  function getTelemetry() { return { entityCount: 12, score, highScore, speed: 110, shield: 100 }; }
`
);

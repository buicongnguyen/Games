/* Sky Drill 2 — core.js
 * Engine layer: math utils, deterministic physics integrator, synth audio,
 * particle/FX primitives, juice (screen shake + hit-stop), float text pool.
 * No gameplay rules live here.
 */
(function () {
  "use strict";

  const SD = window.SD;
  const PHYS = SD.PHYS;
  const PALETTE = SD.PALETTE;

  /* ============================== utils ============================== */

  const U = (SD.U = {
    clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    },
    lerp(a, b, t) {
      return a + (b - a) * t;
    },
    approach(current, target, amount) {
      return current + (target - current) * U.clamp(amount, 0, 1);
    },
    // Pure-JS color lerp (no Phaser dependency).
    blend(fromHex, toHex, amount) {
      const t = U.clamp(amount, 0, 1);
      const ar = (fromHex >> 16) & 255, ag = (fromHex >> 8) & 255, ab = fromHex & 255;
      const br = (toHex >> 16) & 255, bg = (toHex >> 8) & 255, bb = toHex & 255;
      const r = Math.round(ar + (br - ar) * t);
      const g = Math.round(ag + (bg - ag) * t);
      const b = Math.round(ab + (bb - ab) * t);
      return (r << 16) | (g << 8) | b;
    },
    dist(ax, ay, bx, by) {
      return Math.hypot(bx - ax, by - ay);
    },
    pointSegDist(px, py, ax, ay, bx, by) {
      const vx = bx - ax, vy = by - ay;
      const lenSq = vx * vx + vy * vy || 1;
      const t = U.clamp(((px - ax) * vx + (py - ay) * vy) / lenSq, 0, 1);
      return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
    },
    circleRect(cx, cy, r, rect) {
      const nx = U.clamp(cx, rect.x, rect.x + rect.width);
      const ny = U.clamp(cy, rect.y, rect.y + rect.height);
      const dx = cx - nx, dy = cy - ny;
      return dx * dx + dy * dy <= r * r;
    },
    // Point-in-ellipse with an additive margin (treats margin as extra radius on both axes).
    ellipseHit(px, py, cx, cy, rx, ry, margin) {
      const m = margin || 0;
      const dx = (px - cx) / (rx + m);
      const dy = (py - cy) / (ry + m);
      return dx * dx + dy * dy <= 1;
    },
    // Closest approach of a segment to an ellipse center, in ellipse-normalized space.
    segEllipseHit(ax, ay, bx, by, cx, cy, rx, ry, margin) {
      const m = margin || 0;
      const nax = (ax - cx) / (rx + m), nay = (ay - cy) / (ry + m);
      const nbx = (bx - cx) / (rx + m), nby = (by - cy) / (ry + m);
      return U.pointSegDist(0, 0, nax, nay, nbx, nby) <= 1;
    },
    turnToward(current, target, maxTurn) {
      let delta = target - current;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      return current + U.clamp(delta, -maxTurn, maxTurn);
    },
    randRange(a, b) {
      return a + Math.random() * (b - a);
    },
    randInt(a, b) {
      return Math.floor(a + Math.random() * (b - a + 1));
    },
    pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
  });

  /* ============================ physics ============================== *
   * Semi-implicit (symplectic) Euler with a fixed 120 Hz substep:
   *   v += a(x, v) * h;  x += v * h        (velocity first, then position)
   * The same advanceBody() drives live pods, the aim preview, debris and
   * parachute crates, so predicted and actual trajectories are identical.
   * ================================================================== */

  SD.Physics = {
    /**
     * body: {x, y, vx, vy, prevX, prevY}
     * env:  {
     *   gravity, gravityScale,        constant field
     *   dragK,                        quadratic drag coefficient
     *   windX, windCouple,            horizontal air coupling (linear)
     *   accel(body, h) -> {x, y}      extra acceleration (thrust/guidance)
     * }
     * onSub(body, h) -> false to stop integrating (body died/detonated).
     */
    advanceBody(body, env, dt, onSub) {
      let remaining = dt;
      while (remaining > 1e-6) {
        const h = Math.min(PHYS.DT, remaining);
        remaining -= h;
        let ax = 0;
        let ay = (env.gravity || 0) * (env.gravityScale == null ? 1 : env.gravityScale);
        if (env.accel) {
          const extra = env.accel(body, h);
          if (extra) {
            ax += extra.x || 0;
            ay += extra.y || 0;
          }
        }
        const windX = env.windX || 0;
        if (env.dragK) {
          const rvx = body.vx - windX;
          const rvy = body.vy;
          const speed = Math.hypot(rvx, rvy);
          if (speed > 0.0001) {
            ax -= env.dragK * speed * rvx;
            ay -= env.dragK * speed * rvy;
          }
        }
        if (env.windCouple) {
          ax += env.windCouple * (windX - body.vx);
        }
        body.vx += ax * h;
        body.vy += ay * h;
        body.prevX = body.x;
        body.prevY = body.y;
        body.x += body.vx * h;
        body.y += body.vy * h;
        if (onSub && onSub(body, h) === false) {
          return false;
        }
      }
      return true;
    },

    /**
     * Reflect a body off a horizontal surface at surfaceY (normal pointing up).
     * restitution e in [0,1) — each bounce keeps e of vertical speed,
     * friction in [0,1] — fraction of horizontal speed kept.
     */
    bounceOffGround(body, surfaceY, restitution, friction) {
      body.y = surfaceY;
      body.vy = -Math.abs(body.vy) * restitution;
      body.vx *= friction;
    },
  };

  /* ============================== audio ============================== *
   * Tiny WebAudio synthesizer — no sound assets needed.
   * ================================================================== */

  SD.Audio = (function () {
    let ctx = null;
    let master = null;
    let muted = false;
    const lastPlayed = {};
    const THROTTLE = {
      shoot: 0.05, heliShoot: 0.05, boom: 0.07, bigBoom: 0.12, thud: 0.06,
      drillBreak: 0.05, bounce: 0.08, hit: 0.06, launch: 0.1,
    };

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }

    function tone(type, f0, f1, dur, gain, delay) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = ctx.currentTime + (delay || 0);
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, f0), t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      osc.connect(g).connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function noise(dur, gain, fStart, fEnd, delay) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      const t0 = ctx.currentTime + (delay || 0);
      filter.frequency.setValueAtTime(fStart, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      src.connect(filter).connect(g).connect(master);
      src.start(t0);
    }

    const recipes = {
      uiClick() { tone("sine", 940, 720, 0.05, 0.05); },
      shoot() { tone("square", 760, 170, 0.07, 0.08); },
      heliShoot() { tone("square", 540, 150, 0.06, 0.07); },
      launch() { noise(0.28, 0.12, 300, 1600); tone("sawtooth", 130, 300, 0.24, 0.05); },
      drillBreak() { noise(0.09, 0.1, 2400, 500); tone("square", 210, 90, 0.07, 0.05); },
      thud() { tone("sine", 120, 42, 0.13, 0.2); },
      bounce() { tone("sine", 250, 120, 0.09, 0.12); },
      hit() { noise(0.08, 0.12, 1800, 400); },
      boom() { noise(0.42, 0.32, 950, 110); tone("sine", 140, 32, 0.36, 0.26); },
      bigBoom() { noise(0.7, 0.4, 1200, 70); tone("sine", 170, 26, 0.6, 0.32); tone("sine", 90, 24, 0.65, 0.2, 0.04); },
      pickup() { tone("triangle", 520, 530, 0.08, 0.1); tone("triangle", 660, 670, 0.08, 0.1, 0.07); tone("triangle", 880, 900, 0.12, 0.1, 0.14); },
      shieldDown() { tone("sawtooth", 330, 70, 0.32, 0.16); noise(0.24, 0.1, 900, 200, 0.02); },
      alarm() { tone("square", 880, 870, 0.13, 0.06); tone("square", 620, 610, 0.13, 0.06, 0.15); },
      clear() { [392, 523, 659, 784].forEach((f, i) => tone("triangle", f, f * 1.01, 0.17, 0.1, i * 0.09)); },
      fanfare() { [392, 494, 587, 784, 988].forEach((f, i) => tone("triangle", f, f, 0.24, 0.11, i * 0.11)); },
      fail() { tone("sawtooth", 230, 56, 0.7, 0.16); noise(0.5, 0.1, 500, 90, 0.05); },
    };

    return {
      get muted() { return muted; },
      unlock() { ensure(); },
      setMuted(value) {
        muted = !!value;
        if (master) master.gain.value = muted ? 0 : 0.5;
      },
      play(name, nowSec) {
        if (muted || !recipes[name]) return;
        if (!ensure()) return;
        const now = ctx.currentTime;
        const throttle = THROTTLE[name] || 0;
        if (throttle && lastPlayed[name] != null && now - lastPlayed[name] < throttle) return;
        lastPlayed[name] = now;
        try { recipes[name](); } catch (err) { /* audio is non-critical */ }
      },
    };
  })();

  /* ============================== juice ============================== *
   * Screen shake (decaying noise) + hit-stop (time dilation, 50–100 ms).
   * ================================================================== */

  SD.Juice = class Juice {
    constructor(scene) {
      this.scene = scene;
      this.shakePower = 0;
      this.stopUntil = 0;
      this.now = 0;
    }
    update(rawDt) {
      this.now += rawDt;
      this.shakePower = Math.max(0, this.shakePower - rawDt * 3.4);
      const cam = this.scene.cameras && this.scene.cameras.main;
      if (cam) {
        if (this.shakePower > 0.003) {
          const p = this.shakePower * 7;
          cam.setScroll(U.randRange(-p, p), U.randRange(-p, p));
        } else {
          cam.setScroll(0, 0);
        }
      }
      // Hit-stop: scale game dt to 0 for the stop window.
      return this.now < this.stopUntil ? 0 : rawDt;
    }
    shake(power) {
      this.shakePower = Math.min(1.4, this.shakePower + power);
    }
    hitStop(seconds) {
      this.stopUntil = Math.max(this.stopUntil, this.now + Math.min(0.12, seconds));
    }
  };

  /* =============================== fx ================================ */

  const FX = (SD.FX = {});

  FX.updateParticles = function (particles, dt, defaultGravity) {
    const gravity = defaultGravity || 0;
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - U.clamp((p.drag || 0) * dt, 0, 0.82);
      p.vy += (p.gravity == null ? gravity : p.gravity) * dt;
      p.rotation = (p.rotation || 0) + (p.spin || 0) * dt;
    }
    return particles.filter((p) => p.life > 0);
  };

  FX.drawParticle = function (g, p) {
    const alpha = U.clamp(p.life / p.maxLife, 0, 1);
    const size = Math.max(0.8, p.size * (p.shape === "smoke" ? 0.8 + (1 - alpha) * 0.55 : 1));
    if (p.shape === "spark") {
      g.save();
      g.translateCanvas(p.x, p.y);
      g.rotateCanvas(p.rotation || 0);
      g.fillStyle(p.color, alpha * 0.9);
      g.fillRoundedRect(-size * 1.8, -size * 0.36, size * 3.6, size * 0.72, size * 0.28);
      g.fillStyle(p.glowColor || U.blend(p.color, 0xffffff, 0.35), alpha * 0.78);
      g.fillCircle(size * 1.3, 0, size * 0.45);
      g.restore();
      return;
    }
    if (p.shape === "shard") {
      g.save();
      g.translateCanvas(p.x, p.y);
      g.rotateCanvas(p.rotation || 0);
      g.fillStyle(p.color, alpha * 0.9);
      g.fillTriangle(-size * 1.2, -size * 0.55, size * 1.4, 0, -size * 1.2, size * 0.55);
      g.restore();
      return;
    }
    g.fillStyle(p.color, p.shape === "smoke" ? alpha * 0.42 : alpha * 0.95);
    g.fillCircle(p.x, p.y, size);
    if (p.shape === "smoke") {
      g.lineStyle(1, p.glowColor || U.blend(p.color, 0xffffff, 0.18), alpha * 0.18);
      g.strokeCircle(p.x, p.y, size * (1.12 + (1 - alpha) * 0.4));
    } else {
      g.fillStyle(p.glowColor || U.blend(p.color, PALETTE.shock, 0.4), alpha * 0.45);
      g.fillCircle(p.x, p.y, size * 0.52);
    }
  };

  FX.burstInto = function (list, x, y, color, count, sizeScale, opts) {
    const scale = sizeScale || 1;
    const o = opts || {};
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = U.randRange(24, 110) * scale;
      const roll = Math.random();
      const life = U.randRange(0.28, 0.62);
      list.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life,
        size: U.randRange(2, 5) * scale,
        color,
        glowColor: roll < 0.5 ? U.blend(color, PALETTE.shock, 0.3) : U.blend(color, 0xffffff, 0.12),
        shape: roll < 0.45 ? "spark" : roll < 0.75 ? "shard" : "smoke",
        spin: U.randRange(-7.5, 7.5),
        gravity: o.gravity == null ? 78 + U.randRange(-12, 36) : o.gravity,
        drag: o.drag == null ? 0.72 : o.drag,
        rotation: angle,
      });
    }
  };

  FX.drawBlastWave = function (g, blast, shockColor) {
    const alpha = U.clamp(blast.life / blast.maxLife, 0, 1);
    const progress = 1 - alpha;
    const color = blast.color;
    const ringColor = shockColor || U.blend(color, PALETTE.shock, 0.4);
    g.fillStyle(color, alpha * 0.12);
    g.fillCircle(blast.x, blast.y, blast.radius * (0.16 + progress * 0.44));
    g.fillStyle(U.blend(color, PALETTE.shock, 0.5), alpha * 0.18);
    g.fillCircle(blast.x, blast.y, blast.radius * (0.08 + progress * 0.22));
    g.lineStyle(2.4, ringColor, alpha * 0.72);
    g.strokeCircle(blast.x, blast.y, blast.radius * (0.32 + progress * 0.68));
    g.lineStyle(1.2, color, alpha * 0.38);
    g.strokeCircle(blast.x, blast.y, blast.radius * (0.18 + progress * 0.46));
    g.save();
    g.translateCanvas(blast.x, blast.y);
    g.rotateCanvas(progress * 2.6);
    g.lineStyle(1.6, ringColor, alpha * 0.34);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const inner = blast.radius * (0.18 + progress * 0.12);
      const outer = blast.radius * (0.42 + progress * 0.3);
      g.lineBetween(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    }
    g.restore();
  };

  FX.drawTracer = function (g, fromX, fromY, toX, toY, color, alpha, width, headRadius, glowAmount) {
    const dx = toX - fromX, dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;
    const glow = U.blend(color, 0xffffff, glowAmount == null ? 0.3 : glowAmount);
    g.lineStyle(width + 2, color, alpha * 0.16);
    g.lineBetween(fromX, fromY, toX, toY);
    g.lineStyle(width, glow, alpha * 0.84);
    g.lineBetween(fromX, fromY, toX, toY);
    g.fillStyle(color, alpha * 0.22);
    g.fillCircle(toX - nx * width * 1.6, toY - ny * width * 1.6, Math.max(width * 1.25, (headRadius || width) * 0.72));
    g.fillStyle(glow, alpha);
    g.fillCircle(toX, toY, headRadius || width * 1.2);
  };

  FX.drawRocket = function (g, x, y, angle, size, colors, pulse, danger) {
    const bodyColor = colors.body;
    const hotColor = colors.hot;
    const glowColor = colors.glow;
    const stripeColor = colors.stripe || U.blend(bodyColor, 0xffffff, 0.18);
    const flameColor = colors.flame || PALETTE.blast;
    const emberColor = colors.ember || PALETTE.shock;
    const pulseScale = 1 + Math.sin(pulse || 0) * 0.04;
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    g.fillStyle(glowColor, 0.16 + (danger || 0) * 0.18);
    g.fillTriangle(-1.1 * size, -0.64 * size, -1.1 * size, 0.64 * size, 0.98 * size, 0);
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(-0.72 * size, -0.29 * size, 1.46 * size, 0.58 * size, 4);
    g.fillStyle(stripeColor, 0.95);
    g.fillRect(-0.08 * size, -0.22 * size, 0.18 * size, 0.44 * size);
    g.fillStyle(hotColor, 1);
    g.fillTriangle(0.96 * size, 0, 0.24 * size, -0.47 * size, 0.24 * size, 0.47 * size);
    g.fillTriangle(-0.18 * size, -0.3 * size, -0.76 * size, -0.78 * size, -0.52 * size, -0.1 * size);
    g.fillTriangle(-0.18 * size, 0.3 * size, -0.76 * size, 0.78 * size, -0.52 * size, 0.1 * size);
    g.fillStyle(flameColor, 0.84 + (danger || 0) * 0.12);
    g.fillTriangle(-0.74 * size, 0, (-1.7 - (danger || 0) * 0.25) * size * pulseScale, -0.32 * size, (-1.7 - (danger || 0) * 0.25) * size * pulseScale, 0.32 * size);
    g.fillStyle(emberColor, 0.72);
    g.fillTriangle(-0.74 * size, 0, (-1.28 - (danger || 0) * 0.18) * size * pulseScale, -0.18 * size, (-1.28 - (danger || 0) * 0.18) * size * pulseScale, 0.18 * size);
    g.fillStyle(colors.core || 0x1c2834, 0.92);
    g.fillRect(-0.34 * size, -0.16 * size, 0.42 * size, 0.32 * size);
    g.restore();
  };

  /* ---------------------- crawler/enemy figures ---------------------- */

  function drawEnemyStanding(g, color, alpha, scale) {
    const s = scale || 1;
    const body = U.blend(0x10161d, color, 0.68);
    const armor = U.blend(0x32414d, color, 0.28);
    const accent = U.blend(color, PALETTE.shock, 0.32);
    g.fillStyle(0x04080b, alpha * 0.22);
    g.fillEllipse(0, 16 * s, 26 * s, 7 * s);
    g.fillStyle(body, alpha);
    g.fillCircle(0, -19 * s, 6.2 * s);
    g.fillStyle(armor, alpha * 0.95);
    g.fillEllipse(0, -22.5 * s, 13 * s, 6 * s);
    g.fillStyle(body, alpha);
    g.fillRoundedRect(-5.2 * s, -13 * s, 10.4 * s, 18 * s, 3.8 * s);
    g.fillStyle(armor, alpha * 0.84);
    g.fillRoundedRect(-3.4 * s, -10.5 * s, 6.8 * s, 10.5 * s, 2.5 * s);
    g.fillStyle(body, alpha * 0.94);
    g.fillRect(-7.2 * s, -10.5 * s, 2.5 * s, 12 * s);
    g.fillRect(4.7 * s, -9.6 * s, 2.6 * s, 11 * s);
    g.fillRect(-4 * s, 4.6 * s, 3.1 * s, 12.8 * s);
    g.fillRect(0.9 * s, 4.6 * s, 3.1 * s, 12.8 * s);
    g.fillStyle(0x070d11, alpha * 0.5);
    g.fillRoundedRect(-8.2 * s, -9.6 * s, 2.6 * s, 9.2 * s, 1.2 * s);
    g.fillStyle(accent, alpha * 0.78);
    g.fillRoundedRect(3.2 * s, -7.4 * s, 13.2 * s, 2.3 * s, 1.1 * s);
    g.fillRect(13.8 * s, -8.8 * s, 1.6 * s, 4.8 * s);
  }

  function drawEnemyCrawling(g, color, alpha, scale, progress) {
    const s = scale || 1;
    const t = U.clamp(progress, 0, 1);
    const body = U.blend(0x0e141a, color, 0.66);
    const armor = U.blend(0x31424c, color, 0.26);
    const accent = U.blend(color, PALETTE.shock, 0.3);
    const baseY = (1 - t) * 10 * s;
    g.fillStyle(0x04080b, alpha * 0.18);
    g.fillEllipse(0, 12 * s + baseY, 30 * s, 6 * s);
    g.fillStyle(body, alpha);
    g.fillCircle(-10 * s, -8 * s + baseY, 5.2 * s);
    g.fillStyle(armor, alpha * 0.9);
    g.fillEllipse(-10 * s, -10.6 * s + baseY, 11 * s, 5 * s);
    g.fillStyle(body, alpha);
    g.fillRoundedRect(-7 * s, -10 * s + baseY, 20 * s, 8.5 * s, 3 * s);
    g.fillStyle(0x070d11, alpha * 0.46);
    g.fillRoundedRect(-2 * s, -9.4 * s + baseY, 5 * s, 7 * s, 2 * s);
    g.lineStyle(Math.max(1, 1.8 * s), body, alpha * 0.98);
    g.beginPath();
    g.moveTo(-1 * s, -4 * s + baseY);
    g.lineTo(-12 * s, 3 * s + baseY);
    g.moveTo(2 * s, -3 * s + baseY);
    g.lineTo(13 * s, 3 * s + baseY);
    g.moveTo(6 * s, -2 * s + baseY);
    g.lineTo(1 * s, 8 * s + baseY);
    g.moveTo(-4 * s, -4 * s + baseY);
    g.lineTo(-15 * s, -1 * s + baseY);
    g.strokePath();
    g.fillStyle(accent, alpha * 0.75);
    g.fillRoundedRect(6 * s, -5.2 * s + baseY, 10.8 * s, 2 * s, 1 * s);
  }

  FX.drawEnemyFigure = function (g, x, y, color, alpha, scale, pose, progress) {
    const s = scale || 1;
    const t = U.clamp(progress || 0, 0, 1);
    if (pose === "explode") {
      const flare = U.blend(PALETTE.blast, PALETTE.shock, 0.42);
      g.fillStyle(flare, alpha * (0.14 + 0.34 * (1 - t)));
      g.fillCircle(x, y - 10 * s, (9 + 20 * t) * s);
      g.lineStyle(Math.max(1, 2 * s), PALETTE.shock, alpha * (1 - t));
      g.strokeCircle(x, y - 10 * s, (12 + 24 * t) * s);
      g.save();
      g.translateCanvas(x, y - 10 * s);
      g.rotateCanvas(t * 1.8);
      g.lineStyle(Math.max(1, 2.2 * s), color, alpha * (1 - t) * 0.62);
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2;
        const inner = 7 * s;
        const outer = (17 + 15 * t) * s;
        g.lineBetween(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
      }
      g.restore();
      return;
    }
    g.save();
    g.translateCanvas(x, y);
    if (pose === "crawl") {
      drawEnemyCrawling(g, color, alpha, s, t);
      g.restore();
      return;
    }
    if (pose === "fall") {
      g.translateCanvas(0, 5 * s * t);
      g.rotateCanvas(1.15 * t);
      drawEnemyStanding(g, color, alpha * (1 - t * 0.22), s);
      g.restore();
      return;
    }
    if (pose === "sink") {
      const fade = alpha * (1 - t);
      g.translateCanvas(0, 18 * s * t);
      drawEnemyStanding(g, color, fade, s);
      g.fillStyle(0x24341f, 0.72 * (1 - t * 0.4));
      g.fillEllipse(0, 18 * s, 34 * s, 9 * s);
      g.restore();
      return;
    }
    drawEnemyStanding(g, color, alpha, s);
    g.restore();
  };

  /* -------------------- parachute supply crates ---------------------- */

  FX.drawCrate = function (g, crate, accent) {
    const sway = Math.sin(crate.sway || 0) * 0.16;
    // canopy
    g.save();
    g.translateCanvas(crate.x, crate.y);
    g.rotateCanvas(sway);
    if (!crate.landed) {
      g.fillStyle(0xf4f7f9, 0.85);
      g.slice(0, -26, 20, Math.PI, Math.PI * 2, false);
      g.fillPath();
      g.lineStyle(1, 0xf4f7f9, 0.6);
      g.lineBetween(-18, -24, -8, -6);
      g.lineBetween(0, -28, 0, -8);
      g.lineBetween(18, -24, 8, -6);
      g.fillStyle(accent || 0xffcc4d, 0.5);
      g.slice(0, -26, 20, Math.PI * 1.28, Math.PI * 1.72, false);
      g.fillPath();
    }
    // box
    g.fillStyle(0x9a7b4f, 1);
    g.fillRoundedRect(-9, -7, 18, 15, 3);
    g.fillStyle(0x7a5f3a, 1);
    g.fillRect(-9, -2, 18, 3);
    g.lineStyle(1.4, accent || 0xffcc4d, 0.9);
    g.strokeRoundedRect(-9, -7, 18, 15, 3);
    g.restore();
    g.lineStyle(1.2, 0xffffff, 0.22 + Math.sin((crate.sway || 0) * 2) * 0.08);
    g.strokeCircle(crate.x, crate.y, 17);
  };

  /* ------------------------ floating text pool ----------------------- */

  SD.FloatTextPool = class FloatTextPool {
    constructor(scene, size) {
      this.items = [];
      this.pool = [];
      for (let i = 0; i < (size || 12); i += 1) {
        const text = scene.add.text(0, 0, "", {
          fontFamily: "Inter, 'Segoe UI', sans-serif",
          fontSize: "15px",
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#0a121a",
          strokeThickness: 3,
        });
        text.setDepth(40);
        text.setOrigin(0.5, 0.5);
        text.setVisible(false);
        this.pool.push(text);
      }
    }
    spawn(x, y, str, cssColor) {
      this.items.push({ x, y, str, color: cssColor || "#ffe9a8", life: 0.95, maxLife: 0.95, vy: -42 });
    }
    update(dt) {
      for (const item of this.items) {
        item.life -= dt;
        item.y += item.vy * dt;
        item.vy *= 1 - 1.8 * dt;
      }
      this.items = this.items.filter((item) => item.life > 0);
      for (let i = 0; i < this.pool.length; i += 1) {
        const node = this.pool[i];
        const item = this.items[this.items.length - 1 - i];
        if (!item) {
          node.setVisible(false);
          continue;
        }
        node.setVisible(true);
        node.setPosition(item.x, item.y);
        if (node.text !== item.str) node.setText(item.str);
        node.setColor(item.color);
        node.setAlpha(U.clamp(item.life / item.maxLife, 0, 1));
      }
    }
    clear() {
      this.items.length = 0;
      for (const node of this.pool) node.setVisible(false);
    }
  };
})();

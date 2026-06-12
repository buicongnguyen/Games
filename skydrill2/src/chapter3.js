/* Sky Drill 2 — chapter3.js
 * Last Uplink: hold the LZ in a gunship while the virus uploads.
 *
 * Physics/logic notes:
 *  - The gunship flies with thrust + air drag (inertia), not teleport moves.
 *  - Guns fire *real* projectiles with travel time; rockets are slower
 *    projectiles with splash. Nothing is hitscan-disguised-as-a-tracer.
 *  - Each of the three shield ovals is its own collider with 2 HP —
 *    what you see is exactly what gets hit. Body hits end the mission.
 *  - Supply crates parachute in using the shared integrator with a drag
 *    coefficient chosen for a ~64 px/s terminal velocity.
 */
(function () {
  "use strict";

  const SD = window.SD;
  const U = SD.U;
  const FX = SD.FX;
  const PHYS = SD.PHYS;
  const PALETTE = SD.PALETTE;
  const WORLD = SD.WORLD;
  const HELI = SD.HELI;

  // Parachute crates: terminal velocity v_t = sqrt(g_eff / k)  ->  k = g_eff / v_t^2
  const CRATE_GRAVITY = PHYS.GRAVITY * 0.55;
  const CRATE_DRAG_K = CRATE_GRAVITY / (PHYS.CRATE_TERMINAL * PHYS.CRATE_TERMINAL);

  SD.Chapter3 = class Chapter3 {
    constructor(scene) {
      this.scene = scene;
      this.id = "defense";
    }

    enter(levelIndex) {
      const level = SD.LEVELS.defense[levelIndex];
      this.levelIndex = levelIndex;
      this.level = level;
      this.time = 0;
      this.timeLeft = level.duration;
      this.pos = { x: HELI.BASE.x, y: HELI.BASE.y };
      this.vel = { x: 0, y: 0 };
      this.shields = HELI.SHIELD_OFFSETS.map((offsetX, i) => ({
        offsetX,
        hp: HELI.SHIELD_HP,
        label: ["Left", "Center", "Right"][i],
      }));
      this.weapon = "gun";
      this.holes = [];
      this.missiles = [];
      this.bullets = [];
      this.rockets = [];
      this.crates = [];
      this.blasts = [];
      this.fx = [];
      this.fireCooldown = 0;
      this.crateTimer = HELI.CRATE_INTERVAL * 0.7;
      this.invulnUntil = 0;
      this.failed = false;
      this.finished = false;
      const immediate = Math.ceil(level.holes * 0.58);
      for (let i = 0; i < level.holes; i += 1) {
        const [x, y, r] = HELI.HOLE_POSITIONS[i % HELI.HOLE_POSITIONS.length];
        const delay = i < immediate ? 0 : (i - immediate + 1) * 1.25 + U.randRange(0.1, 0.55);
        this.holes.push({
          x, y, r,
          state: delay > 0 ? "hidden" : "open",
          timer: delay > 0 ? -delay : U.randRange(0.2, 1.8),
          appearDuration: HELI.HOLE_APPEAR_TIME + U.randRange(-0.12, 0.18),
          missileCooldown: level.missileRate,
          hp: 2,
        });
      }
      SD.UI.setMode("defense");
      SD.UI.hint("Fly with WASD / left pad · fire with click / right pad · 1 gun · 2 rockets");
      SD.UI.banner(`${level.name} · ${level.sub}`, `Upload window ${level.duration}s`, 2.2);
    }

    exit() {}

    setWeapon(weapon) {
      this.weapon = weapon === "missile" ? "missile" : "gun";
      SD.UI.toast(this.weapon === "missile" ? "Rockets selected" : "Gun selected");
      SD.Audio.play("uiClick");
    }

    uploadPercent() {
      return U.clamp(1 - this.timeLeft / this.level.duration, 0, 1);
    }

    /* ------------------------------ input ------------------------------ */

    onPointer(pointer) {
      this.fireAt(pointer.x, pointer.y);
    }

    primaryAction() {
      // fire at the most dangerous thing on screen
      let best = null;
      let bestScore = Infinity;
      for (const missile of this.missiles) {
        if (missile.dead) continue;
        const score = U.dist(missile.x, missile.y, this.pos.x, this.pos.y) - (missile.danger || 0) * 120 - 200;
        if (score < bestScore) { bestScore = score; best = { x: missile.x, y: missile.y }; }
      }
      if (!best) {
        for (const hole of this.holes) {
          if (hole.state !== "launcher" && hole.state !== "enemy") continue;
          const score = U.dist(hole.x, hole.y, this.pos.x, this.pos.y) - (hole.state === "launcher" ? 140 : 0);
          if (score < bestScore) { bestScore = score; best = { x: hole.x, y: hole.y }; }
        }
      }
      if (best) this.fireAt(best.x, best.y);
    }

    fireAt(x, y) {
      if (this.failed || this.finished || this.fireCooldown > 0) return;
      const fromX = this.pos.x;
      const fromY = this.pos.y - 18;
      const angle = Math.atan2(y - fromY, x - fromX);
      if (this.weapon === "missile") {
        this.rockets.push({
          x: fromX, y: fromY, prevX: fromX, prevY: fromY,
          angle,
          speed: HELI.ROCKET_SPEED,
          targetX: x, targetY: y,
          life: 3,
          dead: false,
        });
        this.fireCooldown = HELI.FIRE_RATE_MISSILE;
        SD.Audio.play("launch");
      } else {
        this.bullets.push({
          x: fromX, y: fromY, prevX: fromX, prevY: fromY,
          vx: Math.cos(angle) * HELI.GUN_SPEED,
          vy: Math.sin(angle) * HELI.GUN_SPEED,
          life: 1.6,
        });
        this.fireCooldown = HELI.FIRE_RATE_GUN;
        SD.Audio.play("heliShoot");
        this.vel.x -= Math.cos(angle) * 4;
        this.vel.y -= Math.sin(angle) * 4;
      }
    }

    /* ------------------------------ update ----------------------------- */

    update(dt) {
      if (this.failed || this.finished) {
        this.fx = FX.updateParticles(this.fx, dt, 10);
        for (const blast of this.blasts) blast.life -= dt;
        this.blasts = this.blasts.filter((b) => b.life > 0);
        return;
      }
      this.time += dt;
      this.timeLeft -= dt;

      this.updateMotion(dt);
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);

      const firePad = this.scene.firePad();
      if (firePad.active && this.fireCooldown <= 0) {
        const len = Math.hypot(firePad.x, firePad.y) || 1;
        this.fireAt(this.pos.x + (firePad.x / len) * 520, this.pos.y - 18 + (firePad.y / len) * 520);
      }

      this.updateHoles(dt);
      this.updateMissiles(dt);
      this.updateBullets(dt);
      this.updateRockets(dt);
      this.updateCrates(dt);

      this.fx = FX.updateParticles(this.fx, dt, 10);
      for (const blast of this.blasts) blast.life -= dt;
      this.blasts = this.blasts.filter((b) => b.life > 0);

      if (this.timeLeft <= 0) {
        this.finished = true;
        const bonus = this.shields.reduce((sum, s) => sum + s.hp, 0) * 50;
        this.scene.addScore(bonus, this.pos.x, this.pos.y - 60, "#5ee3a2");
        SD.Audio.play("fanfare");
        SD.UI.banner("UPLOAD COMPLETE", `Shield bonus +${bonus}`, 2);
        this.scene.onLevelClear(2.2);
      }
    }

    updateMotion(dt) {
      const input = this.scene.moveInput();
      const len = Math.hypot(input.x, input.y);
      let ax = 0;
      let ay = 0;
      if (len > 0.01) {
        ax = (input.x / Math.max(1, len)) * HELI.THRUST;
        ay = (input.y / Math.max(1, len)) * HELI.THRUST;
      }
      this.vel.x += (ax - HELI.AIR_DRAG * this.vel.x) * dt;
      this.vel.y += (ay - HELI.AIR_DRAG * this.vel.y) * dt;
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      if (this.pos.x < HELI.LIMITS.left) { this.pos.x = HELI.LIMITS.left; this.vel.x = Math.max(0, this.vel.x); }
      if (this.pos.x > HELI.LIMITS.right) { this.pos.x = HELI.LIMITS.right; this.vel.x = Math.min(0, this.vel.x); }
      if (this.pos.y < HELI.LIMITS.top) { this.pos.y = HELI.LIMITS.top; this.vel.y = Math.max(0, this.vel.y); }
      if (this.pos.y > HELI.LIMITS.bottom) { this.pos.y = HELI.LIMITS.bottom; this.vel.y = Math.min(0, this.vel.y); }
    }

    updateHoles(dt) {
      for (const hole of this.holes) {
        if (hole.state === "hidden") {
          hole.timer += dt;
          if (hole.timer >= 0) { hole.state = "appearing"; hole.timer = 0; }
          continue;
        }
        if (hole.state === "appearing") {
          hole.timer += dt;
          if (hole.timer >= hole.appearDuration) { hole.state = "open"; hole.timer = 0; }
          continue;
        }
        if (hole.state === "closed") {
          hole.timer -= dt;
          if (hole.timer <= 0) { hole.state = "appearing"; hole.timer = 0; hole.hp = 2; }
          continue;
        }
        hole.timer += dt;
        if (hole.state === "open" && hole.timer > 1.4) {
          hole.state = "enemy";
          hole.timer = 0;
        } else if (hole.state === "enemy" && hole.timer > 3) {
          hole.state = "launcher";
          hole.timer = 0;
          hole.hp = 2;
          hole.missileCooldown = this.level.missileRate;
        } else if (hole.state === "launcher") {
          hole.missileCooldown -= dt;
          if (hole.timer > 1.6 && hole.missileCooldown <= 0) {
            const baseSize = 9 + this.levelIndex * 0.7 + U.randRange(0, 1.6);
            const maxSize = 18 + this.levelIndex * 1.6 + U.randRange(0.4, 2.6);
            this.missiles.push({
              x: hole.x,
              y: hole.y + hole.r * 0.2,
              angle: Math.atan2(this.pos.y - hole.y, this.pos.x - hole.x),
              speed: 116 + this.levelIndex * 14,
              size: baseSize, baseSize, maxSize, displaySize: baseSize,
              pulse: Math.random() * Math.PI * 2,
              danger: 0, life: 0, dead: false,
            });
            SD.Audio.play("launch");
            hole.missileCooldown = this.level.missileRate;
          }
        }
      }
    }

    updateMissiles(dt) {
      for (const missile of this.missiles) {
        missile.life += dt;
        missile.speed += 9 * dt;
        missile.pulse += dt * (5.8 + this.levelIndex * 0.5);
        missile.size = Math.min(missile.maxSize, missile.size + (2.25 + this.levelIndex * 0.22) * dt);
        missile.displaySize = U.clamp(missile.size + Math.sin(missile.pulse) * 1.15, missile.baseSize * 0.92, missile.maxSize + 0.9);
        missile.danger = U.clamp((missile.displaySize - missile.baseSize) / Math.max(1, missile.maxSize - missile.baseSize), 0, 1);
        const want = Math.atan2(this.pos.y - missile.y, this.pos.x - missile.x);
        missile.angle = U.turnToward(missile.angle, want, 1.45 * dt);
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        this.resolveMissileImpact(missile);
        if (!missile.dead && (missile.y > WORLD.height + 48 || missile.x < -70 || missile.x > WORLD.width + 70)) {
          missile.dead = true;
        }
      }
      this.missiles = this.missiles.filter((m) => !m.dead);
    }

    /* Shields are tested individually — what you see is what gets hit. */
    resolveMissileImpact(missile) {
      if (missile.dead) return;
      const margin = (missile.displaySize || 10) * 0.4;
      for (const shield of this.shields) {
        if (shield.hp <= 0) continue;
        if (U.ellipseHit(missile.x, missile.y, this.pos.x + shield.offsetX, this.pos.y, HELI.SHIELD_RX, HELI.SHIELD_RY, margin)) {
          missile.dead = true;
          if (this.time < this.invulnUntil) {
            this.burst(missile.x, missile.y, PALETTE.shock, 8);
            return;
          }
          this.invulnUntil = this.time + 0.4;
          shield.hp -= 1;
          this.burst(missile.x, missile.y, PALETTE.blast, 16);
          this.blasts.push({ x: missile.x, y: missile.y, radius: 40, color: PALETTE.blast, life: 0.34, maxLife: 0.34 });
          this.scene.juice.shake(0.3);
          if (shield.hp <= 0) {
            SD.Audio.play("shieldDown");
            this.scene.juice.hitStop(0.06);
            SD.UI.toast(`${shield.label} shield broken`);
          } else {
            SD.Audio.play("hit");
          }
          return;
        }
      }
      if (U.ellipseHit(missile.x, missile.y, this.pos.x, this.pos.y, HELI.BODY_RX, HELI.BODY_RY, margin)) {
        missile.dead = true;
        this.burst(missile.x, missile.y, PALETTE.blast, 22);
        this.blasts.push({ x: missile.x, y: missile.y, radius: 56, color: PALETTE.blast, life: 0.4, maxLife: 0.4 });
        this.failMission("Gunship down — direct hull hit");
      }
    }

    updateBullets(dt) {
      for (const bullet of this.bullets) {
        bullet.prevX = bullet.x;
        bullet.prevY = bullet.y;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        if (this.resolveShot(bullet.prevX, bullet.prevY, bullet.x, bullet.y, false)) bullet.life = 0;
      }
      this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < WORLD.width + 40 && b.y > -40 && b.y < WORLD.height + 40);
    }

    updateRockets(dt) {
      for (const rocket of this.rockets) {
        rocket.prevX = rocket.x;
        rocket.prevY = rocket.y;
        rocket.x += Math.cos(rocket.angle) * rocket.speed * dt;
        rocket.y += Math.sin(rocket.angle) * rocket.speed * dt;
        rocket.life -= dt;
        // proximity fuse vs incoming missiles
        for (const missile of this.missiles) {
          if (missile.dead) continue;
          if (U.pointSegDist(missile.x, missile.y, rocket.prevX, rocket.prevY, rocket.x, rocket.y) < 16 + (missile.displaySize || 10) * 0.5) {
            this.splash(rocket.x, rocket.y);
            rocket.dead = true;
            break;
          }
        }
        if (rocket.dead) continue;
        // reached the aim point
        const toTarget = U.dist(rocket.x, rocket.y, rocket.targetX, rocket.targetY);
        const passed =
          (rocket.prevX - rocket.targetX) * (rocket.x - rocket.targetX) + (rocket.prevY - rocket.targetY) * (rocket.y - rocket.targetY) <= 0;
        if (toTarget < 12 || passed || rocket.life <= 0) {
          this.splash(rocket.x, rocket.y);
          rocket.dead = true;
        }
      }
      this.rockets = this.rockets.filter((r) => !r.dead);
    }

    /** Bullet impact along a swept segment. Returns true when it hit something. */
    resolveShot(ax, ay, bx, by, isSplash) {
      for (const missile of this.missiles) {
        if (missile.dead) continue;
        const r = (missile.displaySize || missile.size) * 0.5;
        if (U.pointSegDist(missile.x, missile.y, ax, ay, bx, by) < r + 5) {
          missile.dead = true;
          const reward = 55 + Math.round((missile.displaySize || missile.size) * 3 + (missile.danger || 0) * 40);
          this.scene.addScore(reward, missile.x, missile.y, "#ffd9a8");
          this.burst(missile.x, missile.y, U.blend(PALETTE.shock, PALETTE.blast, missile.danger || 0.45), 12);
          SD.Audio.play("boom");
          return true;
        }
      }
      for (const hole of this.holes) {
        if (hole.state !== "enemy" && hole.state !== "launcher") continue;
        if (U.pointSegDist(hole.x, hole.y, ax, ay, bx, by) < hole.r * 0.66 + 4) {
          this.damageHole(hole, isSplash ? 2 : 1, false);
          return true;
        }
      }
      return false;
    }

    damageHole(hole, amount, fromSplash) {
      if (hole.state === "enemy") {
        this.scene.addScore(60, hole.x, hole.y - 14, "#5ee3a2");
        this.closeHole(hole, 2.2);
        this.burst(hole.x, hole.y, PALETTE.targetDone, 8);
        SD.Audio.play("hit");
        return;
      }
      if (hole.state === "launcher") {
        hole.hp -= amount;
        this.burst(hole.x, hole.y, PALETTE.blast, 6);
        if (hole.hp <= 0) {
          this.scene.addScore(120, hole.x, hole.y - 14, "#ffd9a8");
          this.closeHole(hole, fromSplash ? 4.2 : 3);
          this.burst(hole.x, hole.y, PALETTE.blast, 14);
          SD.Audio.play("boom");
        } else {
          SD.Audio.play("hit");
        }
      }
    }

    closeHole(hole, reopenDelay) {
      hole.state = "closed";
      hole.timer = reopenDelay;
      hole.missileCooldown = this.level.missileRate;
    }

    splash(x, y) {
      const radius = HELI.ROCKET_SPLASH;
      this.blasts.push({ x, y, radius, color: PALETTE.blast, life: 0.4, maxLife: 0.4 });
      this.burst(x, y, PALETTE.blast, 18);
      this.scene.juice.shake(0.28);
      SD.Audio.play("boom");
      for (const missile of this.missiles) {
        if (missile.dead) continue;
        if (U.dist(missile.x, missile.y, x, y) <= radius + (missile.displaySize || 10) * 0.5) {
          missile.dead = true;
          const reward = 55 + Math.round((missile.displaySize || missile.size) * 3);
          this.scene.addScore(reward, missile.x, missile.y, "#ffd9a8");
          this.burst(missile.x, missile.y, PALETTE.shock, 10);
        }
      }
      for (const hole of this.holes) {
        if ((hole.state === "enemy" || hole.state === "launcher") && U.dist(hole.x, hole.y, x, y) <= radius + hole.r * 0.4) {
          this.damageHole(hole, 2, true);
        }
      }
    }

    /* ------------------------- parachute crates ------------------------ */

    updateCrates(dt) {
      this.crateTimer -= dt;
      if (this.crateTimer <= 0) {
        this.crates.push({
          x: U.randRange(310, 650),
          y: -28,
          vx: U.randRange(-6, 6),
          vy: 0,
          prevX: 0, prevY: 0,
          sway: Math.random() * Math.PI * 2,
          landed: false,
          collected: false,
        });
        this.crateTimer = HELI.CRATE_INTERVAL + U.randRange(-2.5, 3);
        SD.UI.toast("Supply drop inbound");
      }
      for (const crate of this.crates) {
        crate.sway += dt * 2.2;
        SD.Physics.advanceBody(crate, { gravity: CRATE_GRAVITY, dragK: CRATE_DRAG_K, windX: Math.sin(crate.sway) * 18, windCouple: 0.6 }, dt);
        if (U.ellipseHit(crate.x, crate.y, this.pos.x, this.pos.y, HELI.BODY_RX + 18, HELI.BODY_RY + 16, 8)) {
          crate.collected = true;
          this.applyCrate();
        }
      }
      this.crates = this.crates.filter((c) => !c.collected && c.y < WORLD.height + 30);
    }

    applyCrate() {
      SD.Audio.play("pickup");
      // restore the weakest shield segment
      let weakest = null;
      for (const shield of this.shields) {
        if (shield.hp >= HELI.SHIELD_HP) continue;
        if (!weakest || shield.hp < weakest.hp) weakest = shield;
      }
      if (weakest) {
        weakest.hp += 1;
        SD.UI.toast(`${weakest.label} shield ${weakest.hp > 1 ? "restored" : "patched"}`);
        this.burst(this.pos.x + weakest.offsetX, this.pos.y, PALETTE.targetDone, 10);
      } else {
        this.scene.addScore(90, this.pos.x, this.pos.y - 50, "#b884ff");
        SD.UI.toast("Shields full — salvage +90");
      }
    }

    failMission(reason) {
      if (this.failed || this.finished) return;
      this.failed = true;
      SD.Audio.play("fail");
      this.scene.juice.shake(0.9);
      this.scene.onLevelFail(reason, "defense");
    }

    burst(x, y, color, count) {
      FX.burstInto(this.fx, x, y, color, count, 1, { gravity: 12, drag: 0.52 });
    }

    /* ------------------------------- HUD -------------------------------- */

    hudStats() {
      const shieldText = this.shields.map((s) => s.hp).join("·");
      return [
        { label: "Wave", value: `${this.levelIndex + 1}/${SD.LEVELS.defense.length}` },
        { label: "Upload", value: `${Math.floor(this.uploadPercent() * 100)}%` },
        { label: "Shields", value: shieldText, tone: this.shields.every((s) => s.hp <= 0) ? "warn" : "" },
        { label: "Weapon", value: this.weapon === "missile" ? "RKT" : "GUN" },
        { label: "Score", value: `${this.scene.score}` },
      ];
    }

    /* ------------------------------- draw ------------------------------- */

    draw() {
      const g = this.scene.g;
      g.bg.fillStyle(0x07150c, 0.1);
      g.bg.fillRect(0, 0, WORLD.width, WORLD.height);

      // upload progress strip
      const progress = this.uploadPercent();
      g.bg.fillStyle(0x07131d, 0.6);
      g.bg.fillRoundedRect(WORLD.width / 2 - 130, 20, 260, 10, 5);
      g.bg.fillStyle(0x5ee3a2, 0.85);
      g.bg.fillRoundedRect(WORLD.width / 2 - 128, 22, 256 * progress, 6, 3);

      this.drawHoles(g.map);
      this.drawCrates(g.dyn);
      this.drawProjectiles(g.dyn);
      this.drawHeli(g.dyn);
      for (const blast of this.blasts) FX.drawBlastWave(g.fx, blast);
      for (const particle of this.fx) FX.drawParticle(g.fx, particle);
    }

    drawHoles(g) {
      for (const hole of this.holes) {
        if (hole.state === "hidden") continue;
        const closed = hole.state === "closed";
        const appearing = hole.state === "appearing";
        const appearProgress = appearing ? U.clamp(hole.timer / hole.appearDuration, 0, 1) : 1;
        const drawR = hole.r * (appearing ? 0.28 + appearProgress * 0.72 : 1);
        const holeAlpha = appearing ? 0.35 + appearProgress * 0.65 : 1;
        g.fillStyle(closed ? 0x455044 : 0x15191b, holeAlpha);
        g.fillEllipse(hole.x, hole.y, drawR * 2.1, drawR * 1.25);
        g.lineStyle(2, closed ? 0x7da16f : 0xa4aeb6, (closed ? 0.45 : 0.35) * holeAlpha);
        g.strokeEllipse(hole.x, hole.y, drawR * 2.1, drawR * 1.25);
        if (appearing) {
          g.lineStyle(1, 0xd1ddbd, 0.3 * appearProgress);
          g.strokeEllipse(hole.x, hole.y, drawR * 2.7, drawR * 1.55);
        }
        if (hole.state === "enemy") {
          const emerge = U.clamp(hole.timer / 0.9, 0, 1);
          FX.drawEnemyFigure(g, hole.x, hole.y + hole.r * 0.44, PALETTE.target, 1, 0.26, emerge < 1 ? "crawl" : "standing", emerge);
        } else if (hole.state === "launcher") {
          g.fillStyle(0x2b3136, 1);
          g.fillRoundedRect(hole.x - 10, hole.y - 9, 20, 18, 4);
          FX.drawEnemyFigure(g, hole.x + 12, hole.y + hole.r * 0.44, PALETTE.target, 1, 0.24, "standing", 1);
          g.fillStyle(PALETTE.pod, 1);
          g.fillTriangle(hole.x - 3, hole.y - 23, hole.x + 7, hole.y - 4, hole.x - 13, hole.y - 4);
          if (hole.hp < 2) {
            g.lineStyle(1.4, PALETTE.blast, 0.7);
            g.lineBetween(hole.x - 8, hole.y - 6, hole.x + 6, hole.y + 5);
          }
        }
      }
    }

    drawCrates(g) {
      for (const crate of this.crates) FX.drawCrate(g, crate, 0x5ee3a2);
    }

    drawProjectiles(g) {
      for (const bullet of this.bullets) {
        FX.drawTracer(g, bullet.prevX, bullet.prevY, bullet.x, bullet.y, PALETTE.shock, 0.95, 2.1, 3.1, 0.3);
      }
      for (const rocket of this.rockets) {
        FX.drawRocket(g, rocket.x, rocket.y, rocket.angle, 11, {
          body: 0xdde8ee, hot: 0xffd058, glow: U.blend(PALETTE.blast, PALETTE.shock, 0.3),
          stripe: 0x9be3a8, flame: 0xff7c56, ember: PALETTE.shock, core: 0x23354a,
        }, rocket.life * 9, 0.25);
      }
      for (const missile of this.missiles) {
        const size = missile.displaySize || missile.size;
        const hot = U.blend(0xffc94b, 0xff5a42, missile.danger || 0);
        const body = U.blend(0xdde8ee, 0xffb16a, (missile.danger || 0) * 0.78);
        const glow = U.blend(PALETTE.shock, PALETTE.blast, missile.danger || 0);
        FX.drawRocket(g, missile.x, missile.y, missile.angle, size, {
          body, hot, glow, stripe: U.blend(body, 0xffffff, 0.2), flame: 0xff7c56, ember: PALETTE.shock, core: 0x253847,
        }, missile.pulse, missile.danger || 0);
        g.lineStyle(1.5, glow, 0.35 + (missile.danger || 0) * 0.3);
        g.strokeCircle(missile.x, missile.y, size + 4 + Math.sin(missile.pulse) * 1.4);
      }
    }

    drawHeli(g) {
      const x = this.pos.x;
      const y = this.pos.y + Math.sin(this.time * 5.2) * 1.6; // rotor bob
      const tilt = U.clamp(this.vel.x / 220, -1, 1) * 0.1;
      g.fillStyle(0x061018, 0.54);
      g.fillEllipse(x, y + 8, 156, 58);
      for (const shield of this.shields) {
        const shieldX = x + shield.offsetX;
        if (shield.hp > 0) {
          const strength = shield.hp / HELI.SHIELD_HP;
          g.lineStyle(4, shield.offsetX === 0 ? 0x5ee3a2 : 0x9bd5ff, 0.3 + strength * 0.5);
          g.strokeEllipse(shieldX, y, HELI.SHIELD_RX * 2, HELI.SHIELD_RY * 2);
          if (shield.hp < HELI.SHIELD_HP) {
            g.lineStyle(1.4, PALETTE.shock, 0.4);
            g.lineBetween(shieldX - 10, y - 8, shieldX + 4, y + 6);
          }
        } else {
          g.lineStyle(3, PALETTE.target, 0.5);
          g.strokeEllipse(shieldX, y, HELI.SHIELD_RX * 1.8, HELI.SHIELD_RY * 1.5);
          g.lineBetween(shieldX - 14, y - 12, shieldX + 12, y + 10);
          g.lineBetween(shieldX - 8, y + 12, shieldX + 16, y - 8);
        }
      }
      g.save();
      g.translateCanvas(x, y);
      g.rotateCanvas(tilt);
      g.fillStyle(0xe7eff4, 1);
      g.fillRoundedRect(-30, -13, 60, 26, 10);
      g.fillStyle(0x2b4658, 1);
      g.fillRect(-7, -25, 14, 50);
      const rotorPhase = this.time * 30;
      const rotorLen = 58;
      g.lineStyle(3, 0xd9e6ec, 0.55 + Math.abs(Math.sin(rotorPhase)) * 0.35);
      g.lineBetween(-Math.cos(rotorPhase) * rotorLen, -2 - Math.sin(rotorPhase) * 6, Math.cos(rotorPhase) * rotorLen, -2 + Math.sin(rotorPhase) * 6);
      g.lineBetween(-Math.sin(rotorPhase) * 8, -35, Math.sin(rotorPhase) * 8, 35);
      g.fillStyle(PALETTE.target, 0.88);
      g.fillCircle(0, 4, 6);
      g.restore();
    }
  };
})();

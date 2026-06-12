/* Sky Drill 2 — chapter2.js
 * The Canal Run: top-down survival, carrying the virus core upriver.
 *
 * Physics/logic notes:
 *  - The ship has real inertia: water-jet thrust + linear water drag
 *    (vmax = thrust / drag). No teleport movement.
 *  - One damage pipeline: shields absorb first (outer layer first);
 *    only when all shields are gone can the hull take damage, and only
 *    a direct core hit (small inner radius) is instantly fatal. The old
 *    "insta-fail through full shields" inconsistency is gone.
 *  - All hostile contacts test the hull *ellipse* (matches the sprite),
 *    with swept-segment tests for fast bullets so nothing tunnels.
 *  - Bank gunners lead their shots based on your velocity (more lead at
 *    later levels) with aim noise — dodging works like you'd expect.
 *  - Progress is distance upriver (integrated river speed), not a
 *    disconnected timer.
 */
(function () {
  "use strict";

  const SD = window.SD;
  const U = SD.U;
  const FX = SD.FX;
  const PALETTE = SD.PALETTE;
  const WORLD = SD.WORLD;
  const SHIP = SD.SHIP;

  SD.Chapter2 = class Chapter2 {
    constructor(scene) {
      this.scene = scene;
      this.id = "canal";
    }

    enter(levelIndex) {
      const level = SD.LEVELS.canal[levelIndex];
      this.levelIndex = levelIndex;
      this.level = level;
      this.time = 0;
      this.scroll = 0;
      this.distanceLeft = level.distance;
      this.pos = { x: SHIP.CENTER.x, y: SHIP.CENTER.y };
      this.vel = { x: 0, y: 0 };
      this.shields = [3, 3, 3]; // [core-guard, mid, outer] — damage taken from the end
      this.hullHp = SHIP.HULL_HP;
      this.bullets = [];
      this.playerBullets = [];
      this.mines = [];
      this.guns = [];
      this.launchers = [];
      this.crates = [];
      this.shots = [];
      this.blasts = [];
      this.supportMissiles = [];
      this.enemyMissiles = [];
      this.fx = [];
      this.fireCooldown = 0;
      this.supportCooldown = 0;
      this.crateCooldown = level.pickupRate * 0.6;
      this.invulnUntil = 0;
      this.dualUntil = 0;
      this.guidedUntil = 0;
      this.autoTarget = null;
      this.aimDir = { x: 0, y: -1 };
      this.failed = false;
      this.finished = false;
      for (let i = 0; i < level.guns; i += 1) this.guns.push(this.makeGun(i, 118 + ((i * 62) % 358)));
      for (let i = 0; i < level.launchers; i += 1) this.launchers.push(this.makeLauncher(i, 152 + ((i * 126) % 272)));
      for (let i = 0; i < level.mines; i += 1) this.mines.push(this.makeMine(-U.randInt(40, 520)));
      SD.UI.setMode("canal");
      SD.UI.hint("Steer with WASD / left pad · shoot with click / right pad");
      SD.UI.banner(`${level.name} · ${level.sub}`, `${level.distance} m to the uplink`, 2.2);
    }

    exit() {
      this.scene.setShipVisible(false);
    }

    /* ----------------------------- factories --------------------------- */

    makeGun(index, y) {
      const side = index % 2 === 0 ? -1 : 1;
      const dir = side < 0 ? 1 : -1;
      return {
        id: `gun-${index}-${Math.random().toString(36).slice(2, 7)}`,
        side,
        y,
        cooldown: U.randRange(0.3, this.level.bulletRate),
        alive: true,
        enemyAlive: true,
        enemyOffsetY: U.randInt(-6, 10),
        crew: [
          { alive: true, offsetX: 14 * dir, offsetY: -17, pose: "crawl", scale: 0.22 },
          { alive: true, offsetX: 40 * dir, offsetY: 8, pose: "standing", scale: 0.24 },
          { alive: true, offsetX: 62 * dir, offsetY: -4, pose: "standing", scale: 0.21 },
        ],
      };
    }

    makeLauncher(index, y) {
      const side = index % 2 === 0 ? -1 : 1;
      return {
        id: `launcher-${index}-${Math.random().toString(36).slice(2, 7)}`,
        side,
        y,
        alive: true,
        cooldown: this.level.launcherRate + U.randRange(-0.18, 0.16),
      };
    }

    makeMine(y) {
      return {
        x0: WORLD.width / 2 + U.randInt(-SHIP.MINE_SPREAD, SHIP.MINE_SPREAD),
        x: 0,
        y,
        pulse: Math.random() * Math.PI * 2,
        alert: 0,
        exploded: false,
      };
    }

    makeCrate(y, forcedType) {
      // when armor is low, command prioritizes shield resupply
      const hurting = this.shieldTotal() <= 3;
      const type = forcedType || (hurting && Math.random() < 0.45 ? "health" : U.pick(SHIP.PICKUP_TYPES));
      return {
        type,
        x: WORLD.width / 2 + U.randInt(-214, 214),
        y,
        sway: Math.random() * Math.PI * 2,
        collected: false,
      };
    }

    gunX(gun) {
      return gun.side < 0 ? SHIP.GUN_LEFT_X : SHIP.GUN_RIGHT_X;
    }

    launcherX(launcher) {
      return launcher.side < 0 ? SHIP.LAUNCHER_LEFT_X : SHIP.LAUNCHER_RIGHT_X;
    }

    gunTargets(gun) {
      const targets = [];
      if (gun.enemyAlive) {
        targets.push({
          slot: "main",
          crewIndex: -1,
          x: this.gunX(gun) + (gun.side < 0 ? 34 : -34),
          y: gun.y + (gun.enemyOffsetY || 0) + 12,
          pose: "standing",
          scale: 0.28,
        });
      }
      gun.crew.forEach((crew, crewIndex) => {
        if (!crew.alive) return;
        targets.push({
          slot: `crew-${crewIndex}`,
          crewIndex,
          x: this.gunX(gun) + crew.offsetX,
          y: gun.y + crew.offsetY,
          pose: crew.pose,
          scale: crew.scale,
        });
      });
      return targets;
    }

    shieldTotal() {
      return this.shields[0] + this.shields[1] + this.shields[2];
    }

    /* ------------------------------ damage ----------------------------- */

    hitShip(x, y, kind) {
      if (this.failed || this.finished) return;
      // brief mercy window after each absorbed hit — one volley, one hit
      if (this.time < this.invulnUntil) return;
      this.invulnUntil = this.time + 0.75;
      const labels = ["Core-guard", "Mid", "Outer"];
      for (let i = this.shields.length - 1; i >= 0; i -= 1) {
        if (this.shields[i] <= 0) continue;
        this.shields[i] -= 1;
        this.hitFx(x, y, PALETTE.shock, 9, 0.7);
        this.scene.juice.shake(0.22);
        if (this.shields[i] <= 0) {
          SD.Audio.play("shieldDown");
          SD.UI.toast(`${labels[i]} shield down`);
          this.scene.juice.hitStop(0.05);
        } else {
          SD.Audio.play("hit");
        }
        return;
      }
      // shields are gone — hull takes it
      if (U.dist(x, y, this.pos.x, this.pos.y) < SHIP.CORE_R + 4) {
        this.fail("Core hit — the virus core is lost");
        return;
      }
      this.hullHp -= 1;
      SD.Audio.play("alarm");
      this.scene.juice.shake(0.4);
      this.hitFx(x, y, PALETTE.blast, 12, 0.9);
      if (this.hullHp <= 0) {
        this.fail("Hull breached");
      } else {
        SD.UI.toast(`Hull integrity ${this.hullHp}/${SHIP.HULL_HP}`);
      }
    }

    fail(reason) {
      if (this.failed || this.finished) return;
      this.failed = true;
      SD.Audio.play("fail");
      this.scene.juice.shake(0.8);
      this.blast(this.pos.x, this.pos.y, 64, PALETTE.blast, 22, 1.3);
      this.scene.onLevelFail(reason, "canal");
    }

    blast(x, y, radius, color, count, scale) {
      this.blasts.push({ x, y, radius, color: color || PALETTE.blast, life: 0.4, maxLife: 0.4 });
      this.hitFx(x, y, color || PALETTE.blast, count || 16, scale || 1);
    }

    hitFx(x, y, color, count, sizeScale) {
      FX.burstInto(this.fx, x, y, color, count || 12, sizeScale || 1, { gravity: 16, drag: 0.5 });
    }

    /* ------------------------------ update ----------------------------- */

    update(dt) {
      if (this.failed || this.finished) {
        this.passiveUpdate(dt);
        return;
      }
      this.time += dt;
      this.scroll += this.level.riverSpeed * dt;
      this.distanceLeft = Math.max(0, this.distanceLeft - this.level.riverSpeed * dt * SHIP.PX_TO_M);

      this.updateShipMotion(dt);
      this.updateWeapons(dt);
      this.updateGuns(dt);
      this.updateLaunchers(dt);
      this.updatePlayerBullets(dt);
      this.updateEnemyBullets(dt);
      this.updateMines(dt);
      this.updateCrates(dt);
      this.updateSupportMissiles(dt);
      this.updateEnemyMissiles(dt);

      this.fx = FX.updateParticles(this.fx, dt, 18);
      for (const shot of this.shots) shot.life -= dt;
      this.shots = this.shots.filter((s) => s.life > 0);
      for (const blast of this.blasts) blast.life -= dt;
      this.blasts = this.blasts.filter((b) => b.life > 0);

      if (this.distanceLeft <= 0) {
        this.finished = true;
        const bonus = this.shieldTotal() * 30 + this.hullHp * 40;
        this.scene.addScore(bonus, this.pos.x, this.pos.y - 70, "#7ef4ff");
        SD.Audio.play("clear");
        SD.UI.banner("CHECKPOINT REACHED", `Intact-armor bonus +${bonus}`, 2);
        this.scene.onLevelClear(2.0);
      }
    }

    passiveUpdate(dt) {
      this.fx = FX.updateParticles(this.fx, dt, 18);
      for (const blast of this.blasts) blast.life -= dt;
      this.blasts = this.blasts.filter((b) => b.life > 0);
      for (const shot of this.shots) shot.life -= dt;
      this.shots = this.shots.filter((s) => s.life > 0);
    }

    updateShipMotion(dt) {
      const input = this.scene.moveInput();
      const len = Math.hypot(input.x, input.y);
      let ax = 0;
      let ay = 0;
      if (len > 0.01) {
        ax = (input.x / Math.max(1, len)) * SHIP.THRUST;
        ay = (input.y / Math.max(1, len)) * SHIP.THRUST;
      }
      // semi-implicit: velocity (thrust + water drag), then position
      this.vel.x += (ax - SHIP.WATER_DRAG * this.vel.x) * dt;
      this.vel.y += (ay - SHIP.WATER_DRAG * this.vel.y) * dt;
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      const minX = SHIP.WATER_LEFT + SHIP.HULL_RX + 6;
      const maxX = SHIP.WATER_LEFT + SHIP.WATER_WIDTH - SHIP.HULL_RX - 6;
      if (this.pos.x < minX) { this.pos.x = minX; this.vel.x = Math.max(0, this.vel.x); }
      if (this.pos.x > maxX) { this.pos.x = maxX; this.vel.x = Math.min(0, this.vel.x); }
      if (this.pos.y < SHIP.LIMITS.top) { this.pos.y = SHIP.LIMITS.top; this.vel.y = Math.max(0, this.vel.y); }
      if (this.pos.y > SHIP.LIMITS.bottom) { this.pos.y = SHIP.LIMITS.bottom; this.vel.y = Math.min(0, this.vel.y); }
    }

    updateWeapons(dt) {
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      this.supportCooldown = Math.max(0, this.supportCooldown - dt);
      const firePad = this.scene.firePad();
      const handsFree = this.dualUntil > this.time || this.guidedUntil > this.time;
      this.autoTarget = null;
      if (!firePad.active && handsFree) {
        const targets = this.pickAutoTargets();
        this.autoTarget = targets[0] || null;
        if (this.fireCooldown <= 0 && this.autoTarget) {
          if (this.dualUntil > this.time && targets.length > 1) {
            const opposite =
              targets.find((t) => Math.sign(t.x - this.pos.x) !== Math.sign(this.autoTarget.x - this.pos.x) && t.kind !== "mine") ||
              targets[1];
            this.fireGun([this.dirTo(this.autoTarget), this.dirTo(opposite)]);
          } else {
            this.fireGun(this.dirTo(this.autoTarget));
          }
        }
      } else if (firePad.active && this.fireCooldown <= 0) {
        this.fireGun({ x: firePad.x, y: firePad.y });
      }
      if (this.guidedUntil > this.time && this.supportCooldown <= 0) {
        const target = this.pickMissileTarget(this.pos.x, this.pos.y);
        if (target) this.launchSupportMissile(target);
      }
    }

    dirTo(target) {
      return { x: target.x - this.pos.x, y: target.y - (this.pos.y - 36) };
    }

    fireGun(directions) {
      if (this.failed || this.finished) return;
      const list = Array.isArray(directions) ? directions : [directions];
      const dual = this.dualUntil > this.time;
      const muzzles = dual ? [-16, 16] : [0];
      for (let i = 0; i < muzzles.length; i += 1) {
        const dir = list[Math.min(i, list.length - 1)] || list[0];
        let dx = dir ? dir.x : 0;
        let dy = dir ? dir.y : -1;
        if (Math.abs(dx) + Math.abs(dy) < 0.08) { dx = 0; dy = -1; }
        const len = Math.hypot(dx, dy) || 1;
        const fromX = this.pos.x + muzzles[i];
        const fromY = this.pos.y - 36;
        this.playerBullets.push({
          x: fromX, y: fromY, prevX: fromX, prevY: fromY,
          vx: (dx / len) * SHIP.BULLET_SPEED,
          vy: (dy / len) * SHIP.BULLET_SPEED,
          life: SHIP.BULLET_LIFE,
        });
        this.shots.push({ fromX, fromY, x: fromX + (dx / len) * 30, y: fromY + (dy / len) * 30, life: 0.1, maxLife: 0.1 });
        // recoil nudge — equal and opposite
        this.vel.x -= (dx / len) * 9;
        this.vel.y -= (dy / len) * 9;
      }
      this.aimDir = { x: list[0] ? list[0].x : 0, y: list[0] ? list[0].y : -1 };
      this.fireCooldown = dual ? SHIP.FIRE_RATE_DUAL : SHIP.FIRE_RATE;
      SD.Audio.play("shoot");
    }

    onPointer(pointer) {
      if (this.failed || this.finished || this.fireCooldown > 0) return;
      this.fireGun({ x: pointer.x - this.pos.x, y: pointer.y - (this.pos.y - 36) });
    }

    primaryAction() {
      if (this.fireCooldown <= 0) this.fireGun({ x: 0, y: -1 });
    }

    /* --------------------------- enemy logic --------------------------- */

    updateGuns(dt) {
      for (let i = 0; i < this.guns.length; i += 1) {
        const gun = this.guns[i];
        gun.y += this.level.riverSpeed * dt;
        if (gun.y > WORLD.height + 46) {
          this.guns[i] = this.makeGun(i, -U.randInt(45, 130));
          continue;
        }
        if (!gun.alive) continue;
        gun.cooldown -= dt;
        const inRange = U.dist(this.gunX(gun), gun.y, this.pos.x, this.pos.y) < 470;
        if (gun.y > 58 && gun.y < WORLD.height - 34 && inRange && gun.cooldown <= 0) {
          const x = this.gunX(gun);
          const y = gun.y;
          // lead the target: aim where the ship will be when the bullet arrives
          const travel = U.dist(x, y, this.pos.x, this.pos.y) / this.level.bulletSpeed;
          const lead = this.level.aimLead;
          const aimX = this.pos.x + this.vel.x * travel * lead + U.randRange(-14, 14);
          const aimY = this.pos.y + this.vel.y * travel * lead + U.randRange(-14, 14);
          const angle = Math.atan2(aimY - y, aimX - x);
          this.bullets.push({
            x, y,
            prevX: x, prevY: y,
            vx: Math.cos(angle) * this.level.bulletSpeed,
            vy: Math.sin(angle) * this.level.bulletSpeed,
            life: 4.5,
          });
          gun.cooldown = this.level.bulletRate + U.randRange(-0.25, 0.35);
        }
      }
    }

    updateLaunchers(dt) {
      for (let i = 0; i < this.launchers.length; i += 1) {
        const launcher = this.launchers[i];
        launcher.y += this.level.riverSpeed * dt;
        if (launcher.y > WORLD.height + 68) {
          this.launchers[i] = this.makeLauncher(i, -U.randInt(80, 200));
          continue;
        }
        if (!launcher.alive) continue;
        launcher.cooldown -= dt;
        if (launcher.y > 72 && launcher.y < this.pos.y - 18 && launcher.cooldown <= 0) {
          const x = this.launcherX(launcher) + (launcher.side < 0 ? 10 : -10);
          const y = launcher.y - 16;
          const baseSize = 8 + this.levelIndex * 0.55 + U.randRange(0, 1.2);
          const maxSize = 16 + this.levelIndex * 1.45 + U.randRange(0.3, 2);
          this.enemyMissiles.push({
            x, y,
            angle: Math.atan2(this.pos.y - y, this.pos.x - x),
            speed: SHIP.ENEMY_MISSILE_SPEED + this.levelIndex * 10 + U.randRange(-4, 8),
            size: baseSize, baseSize, maxSize, displaySize: baseSize,
            pulse: Math.random() * Math.PI * 2,
            danger: 0, life: 0, dead: false,
          });
          this.shots.push({
            fromX: x, fromY: y,
            x: x + Math.cos(Math.atan2(this.pos.y - y, this.pos.x - x)) * 38,
            y: y + Math.sin(Math.atan2(this.pos.y - y, this.pos.x - x)) * 38,
            life: 0.2, maxLife: 0.2, hostile: true,
          });
          SD.Audio.play("launch");
          launcher.cooldown = this.level.launcherRate + U.randRange(-0.14, 0.18);
        }
      }
    }

    updatePlayerBullets(dt) {
      for (const bullet of this.playerBullets) {
        bullet.prevX = bullet.x;
        bullet.prevY = bullet.y;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        if (this.resolvePlayerBullet(bullet)) bullet.life = 0;
      }
      this.playerBullets = this.playerBullets.filter(
        (b) => b.life > 0 && b.x > -50 && b.x < WORLD.width + 50 && b.y > -50 && b.y < WORLD.height + 50
      );
    }

    resolvePlayerBullet(bullet) {
      // launchers first (big, valuable)
      for (const launcher of this.launchers) {
        if (!launcher.alive) continue;
        if (U.pointSegDist(this.launcherX(launcher), launcher.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < 34) {
          this.explodeLauncher(launcher);
          return true;
        }
      }
      for (const missile of this.enemyMissiles) {
        if (missile.dead) continue;
        const r = (missile.displaySize || missile.size) * 0.48;
        if (U.pointSegDist(missile.x, missile.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < r + 6) {
          missile.dead = true;
          const reward = 36 + Math.round((missile.displaySize || missile.size) * 1.4 + (missile.danger || 0) * 20);
          this.scene.addScore(reward, missile.x, missile.y, "#ffd9a8");
          this.blast(missile.x, missile.y, 30 + (missile.danger || 0) * 14, U.blend(PALETTE.shock, PALETTE.blast, missile.danger || 0.35), 10, 0.72);
          SD.Audio.play("boom");
          return true;
        }
      }
      for (const gun of this.guns) {
        if (!gun.alive) continue;
        for (const enemy of this.gunTargets(gun)) {
          if (U.pointSegDist(enemy.x, enemy.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < (enemy.slot === "main" ? 12 : 10)) {
            this.killGunEnemy(gun, enemy, enemy.slot === "main" ? 18 : 14);
            return true;
          }
        }
        if (U.pointSegDist(this.gunX(gun), gun.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < 42) {
          this.killGun(gun, this.gunX(gun), gun.y, 40, "Cannon disabled");
          return true;
        }
      }
      for (const mine of this.mines) {
        if (mine.exploded) continue;
        const radius = 14 + (mine.alert || 0) * 13;
        if (U.pointSegDist(mine.x, mine.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < radius) {
          mine.exploded = true;
          this.scene.addScore(28, mine.x, mine.y, "#ffd9a8");
          this.blast(mine.x, mine.y, 40, PALETTE.blast, 12, 0.72);
          SD.Audio.play("boom");
          return true;
        }
      }
      return false;
    }

    updateEnemyBullets(dt) {
      for (const bullet of this.bullets) {
        bullet.prevX = bullet.x;
        bullet.prevY = bullet.y;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        // swept test against the hull ellipse (+small bullet radius)
        if (U.segEllipseHit(bullet.prevX, bullet.prevY, bullet.x, bullet.y, this.pos.x, this.pos.y, SHIP.HULL_RX, SHIP.HULL_RY, 3)) {
          bullet.life = 0;
          this.hitShip(bullet.x, bullet.y, "gunfire");
        }
      }
      this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < WORLD.width + 40 && b.y > -40 && b.y < WORLD.height + 40);
    }

    updateMines(dt) {
      for (const mine of this.mines) {
        mine.y += this.level.riverSpeed * dt;
        mine.pulse += dt * 5;
        mine.x = mine.x0 + Math.sin(mine.pulse * 0.34) * 5;
        const distance = U.dist(mine.x, mine.y, this.pos.x, this.pos.y);
        mine.alert = U.clamp(1 - distance / 178, 0, 1);
        if (!mine.exploded && U.ellipseHit(mine.x, mine.y, this.pos.x, this.pos.y, SHIP.HULL_RX, SHIP.HULL_RY, 10 + mine.alert * 18)) {
          mine.exploded = true;
          this.blast(mine.x, mine.y, 52, PALETTE.blast, 14, 1);
          SD.Audio.play("boom");
          this.hitShip(mine.x, mine.y, "mine");
        }
        if (mine.y > WORLD.height + 60 || mine.exploded) {
          Object.assign(mine, this.makeMine(-U.randInt(80, 420)));
        }
      }
    }

    updateCrates(dt) {
      this.crateCooldown -= dt;
      if (this.crateCooldown <= 0 && this.crates.length < 2) {
        this.crates.push(this.makeCrate(-U.randInt(50, 220)));
        this.crateCooldown = this.level.pickupRate + U.randRange(-1.2, 0.8);
      }
      for (const crate of this.crates) {
        crate.y += this.level.riverSpeed * 0.85 * dt; // floats a touch slower than the current
        crate.sway += dt * 2.6;
        crate.x += Math.sin(crate.sway) * 6 * dt;
        if (U.ellipseHit(crate.x, crate.y, this.pos.x, this.pos.y, SHIP.HULL_RX, SHIP.HULL_RY, 14)) {
          crate.collected = true;
          this.applyPickup(crate.type);
        }
      }
      this.crates = this.crates.filter((c) => !c.collected && c.y < WORLD.height + 44);
    }

    applyPickup(type) {
      SD.Audio.play("pickup");
      if (type === "health") {
        this.shields = [3, 3, 3];
        this.hullHp = SHIP.HULL_HP;
        this.blast(this.pos.x, this.pos.y - 4, 42, PALETTE.targetDone, 12, 0.88);
        SD.UI.toast("Shields restored");
        return;
      }
      if (type === "star") {
        this.dualUntil = Math.max(this.dualUntil, this.time + SHIP.DUAL_DURATION);
        this.scene.addScore(60, this.pos.x, this.pos.y - 60, "#ffd55a");
        SD.UI.toast("Twin guns online");
        return;
      }
      if (type === "smallgun") {
        this.guidedUntil = Math.max(this.guidedUntil, this.time + SHIP.GUIDED_DURATION);
        this.scene.addScore(50, this.pos.x, this.pos.y - 60, "#9bd5ff");
        SD.UI.toast("Guided missiles online");
        return;
      }
      this.scene.addScore(120, this.pos.x, this.pos.y - 60, "#b884ff");
      SD.UI.toast("Medal +120");
    }

    /* ------------------------- support missiles ------------------------ */

    pickAutoTargets() {
      const out = [];
      const consider = (kind, x, y, bias, alert, extra) => {
        if (y < -28 || y > this.pos.y + 72 || x < 0 || x > WORLD.width) return;
        const score = U.dist(x, y, this.pos.x, this.pos.y - 36) + bias - (alert || 0) * 90;
        out.push({ kind, x, y, score, ...(extra || {}) });
      };
      for (const l of this.launchers) if (l.alive) consider("launcher", this.launcherX(l), l.y, -170, 0, { obj: l });
      for (const m of this.enemyMissiles) if (!m.dead) consider("enemyMissile", m.x, m.y, -230, m.danger || 0.3, { obj: m });
      for (const gun of this.guns) {
        if (!gun.alive) continue;
        consider("gun", this.gunX(gun), gun.y, -140, 0, { obj: gun });
        for (const enemy of this.gunTargets(gun)) {
          consider("enemy", enemy.x, enemy.y, enemy.slot === "main" ? -110 : -94, 0, { obj: gun, crewIndex: enemy.crewIndex });
        }
      }
      for (const mine of this.mines) {
        if (!mine.exploded) consider("mine", mine.x, mine.y, mine.y > this.pos.y - 24 ? -70 : 26, mine.alert || 0, { obj: mine });
      }
      out.sort((a, b) => a.score - b.score);
      return out;
    }

    pickMissileTarget(x, y) {
      const targets = this.pickAutoTargets();
      let best = null;
      let bestDist = Infinity;
      for (const t of targets) {
        const d = U.dist(t.x, t.y, x, y);
        if (d < bestDist) { bestDist = d; best = t; }
      }
      return best;
    }

    launchSupportMissile(target) {
      this.supportMissiles.push({
        x: this.pos.x,
        y: this.pos.y - 18,
        angle: Math.atan2(target.y - (this.pos.y - 18), target.x - this.pos.x),
        speed: SHIP.SUPPORT_MISSILE_SPEED,
        size: 9,
        life: 0,
        dead: false,
      });
      this.supportCooldown = SHIP.SUPPORT_MISSILE_RATE;
      SD.Audio.play("launch");
    }

    updateSupportMissiles(dt) {
      for (const missile of this.supportMissiles) {
        missile.life += dt;
        missile.speed += 14 * dt;
        missile.size = Math.min(14, missile.size + 1.4 * dt);
        const target = this.pickMissileTarget(missile.x, missile.y);
        if (target) {
          const want = Math.atan2(target.y - missile.y, target.x - missile.x);
          missile.angle = U.turnToward(missile.angle, want, 1.65 * dt);
        }
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        if (target && U.dist(missile.x, missile.y, target.x, target.y) < 18 + missile.size * 0.45) {
          missile.dead = true;
          this.resolveSupportHit(target);
        } else if (missile.life > 4 || missile.x < -50 || missile.x > WORLD.width + 50 || missile.y < -50 || missile.y > WORLD.height + 50) {
          missile.dead = true;
        }
      }
      this.supportMissiles = this.supportMissiles.filter((m) => !m.dead);
    }

    resolveSupportHit(target) {
      if (target.kind === "launcher" && target.obj.alive) {
        this.explodeLauncher(target.obj, "Guided strike");
      } else if (target.kind === "enemyMissile" && !target.obj.dead) {
        target.obj.dead = true;
        this.scene.addScore(42, target.x, target.y, "#ffd9a8");
        this.blast(target.x, target.y, 34, U.blend(PALETTE.shock, PALETTE.blast, target.obj.danger || 0.35), 12, 0.78);
        SD.Audio.play("boom");
      } else if (target.kind === "gun" && target.obj.alive) {
        this.killGun(target.obj, target.x, target.y, 44, "Guided strike");
      } else if (target.kind === "enemy" && target.obj.alive) {
        this.killGunEnemy(target.obj, { crewIndex: target.crewIndex, x: target.x, y: target.y }, target.crewIndex < 0 ? 24 : 20);
        this.blast(target.x, target.y, 36, PALETTE.shock, 10, 0.72);
      } else if (target.kind === "mine" && !target.obj.exploded) {
        target.obj.exploded = true;
        this.scene.addScore(34, target.x, target.y, "#ffd9a8");
        this.blast(target.x, target.y, 42, PALETTE.blast, 12, 0.82);
        SD.Audio.play("boom");
      }
    }

    updateEnemyMissiles(dt) {
      for (const missile of this.enemyMissiles) {
        missile.life += dt;
        missile.speed += SHIP.ENEMY_MISSILE_ACCEL * dt;
        missile.pulse += dt * (5.4 + this.levelIndex * 0.45);
        missile.size = Math.min(missile.maxSize, missile.size + (2 + this.levelIndex * 0.24) * dt);
        missile.displaySize = U.clamp(missile.size + Math.sin(missile.pulse) * 1.05, missile.baseSize * 0.92, missile.maxSize + 0.8);
        missile.danger = U.clamp((missile.displaySize - missile.baseSize) / Math.max(1, missile.maxSize - missile.baseSize), 0, 1);
        const want = Math.atan2(this.pos.y - missile.y, this.pos.x - missile.x);
        missile.angle = U.turnToward(missile.angle, want, SHIP.ENEMY_MISSILE_TURN * dt);
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        // proximity fuse against the hull ellipse
        if (U.ellipseHit(missile.x, missile.y, this.pos.x, this.pos.y, SHIP.HULL_RX, SHIP.HULL_RY, (missile.displaySize || 10) * 0.5)) {
          missile.dead = true;
          this.blast(missile.x, missile.y, 46, PALETTE.blast, 16, 1.08);
          SD.Audio.play("boom");
          this.hitShip(missile.x, missile.y, "missile");
        } else if (missile.y > WORLD.height + 56 || missile.x < -80 || missile.x > WORLD.width + 80 || missile.life > 5.2) {
          missile.dead = true;
        }
      }
      this.enemyMissiles = this.enemyMissiles.filter((m) => !m.dead);
    }

    killGun(gun, x, y, score, message) {
      if (!gun || !gun.alive) return false;
      gun.alive = false;
      gun.enemyAlive = false;
      gun.crew.forEach((c) => { c.alive = false; });
      this.scene.addScore(score || 40, x, y, "#ffd9a8");
      this.blast(x, y, 26, PALETTE.blast, 10, 0.84);
      SD.Audio.play("boom");
      if (message) SD.UI.toast(message);
      return true;
    }

    killGunEnemy(gun, enemy, score) {
      if (!gun) return false;
      if (enemy.crewIndex == null || enemy.crewIndex < 0) {
        if (!gun.enemyAlive) return false;
        gun.enemyAlive = false;
      } else {
        const crew = gun.crew[enemy.crewIndex];
        if (!crew || !crew.alive) return false;
        crew.alive = false;
      }
      this.scene.addScore(score || 18, enemy.x, enemy.y, "#5ee3a2");
      this.hitFx(enemy.x, enemy.y, PALETTE.targetDone, 7, 0.58);
      SD.Audio.play("hit");
      return true;
    }

    explodeLauncher(launcher, message) {
      if (!launcher || !launcher.alive) return false;
      launcher.alive = false;
      const x = this.launcherX(launcher);
      const y = launcher.y;
      this.scene.addScore(65, x, y, "#ffd9a8");
      this.blast(x, y, 116, PALETTE.blast, 20, 1.35);
      this.scene.juice.shake(0.4);
      SD.Audio.play("bigBoom");
      for (const gun of this.guns) {
        if (!gun.alive) continue;
        if (U.dist(this.gunX(gun), gun.y, x, y) <= 118) {
          this.killGun(gun, this.gunX(gun), gun.y, 24);
        } else {
          for (const enemy of this.gunTargets(gun)) {
            if (U.dist(enemy.x, enemy.y, x, y) <= 122) this.killGunEnemy(gun, enemy, enemy.slot === "main" ? 18 : 14);
          }
        }
      }
      for (const other of this.launchers) {
        if (other !== launcher && other.alive && U.dist(this.launcherX(other), other.y, x, y) <= 88) {
          other.alive = false;
          this.hitFx(this.launcherX(other), other.y, PALETTE.blast, 10, 0.8);
        }
      }
      SD.UI.toast(message || "Launcher emplacement destroyed");
      return true;
    }

    /* ------------------------------- HUD -------------------------------- */

    hudStats() {
      const boosts = [];
      if (this.dualUntil > this.time) boosts.push("2X");
      if (this.guidedUntil > this.time) boosts.push("GM");
      const shieldText = this.shieldTotal() > 0 ? this.shields.slice().reverse().join("·") : `H${this.hullHp}`;
      return [
        { label: "Leg", value: `${this.levelIndex + 1}/${SD.LEVELS.canal.length}` },
        { label: "Uplink", value: `${Math.ceil(this.distanceLeft)} m` },
        { label: "Shield", value: shieldText, tone: this.shieldTotal() === 0 ? "warn" : "" },
        { label: "Boost", value: boosts.join(" ") || "—" },
        { label: "Score", value: `${this.scene.score}` },
      ];
    }

    /* ------------------------------- draw ------------------------------- */

    draw() {
      const g = this.scene.g;
      this.scene.setBankScroll(this.scroll);
      this.drawWater(g.bg);
      this.drawBanks(g.map);
      this.drawCrates(g.dyn);
      this.drawProjectiles(g.dyn);
      this.drawShip(g.dyn);
      for (const blast of this.blasts) FX.drawBlastWave(g.fx, blast);
      for (const particle of this.fx) FX.drawParticle(g.fx, particle);
    }

    drawWater(g) {
      g.fillStyle(0x031622, 0.12);
      g.fillRect(0, 0, WORLD.width, WORLD.height);
      g.fillStyle(0x0ca7d8, 0.08);
      g.fillRoundedRect(SHIP.WATER_LEFT, -32, SHIP.WATER_WIDTH, WORLD.height + 64, 26);
      g.fillStyle(0x7ef4ff, 0.05);
      g.fillRoundedRect(SHIP.WATER_LEFT + 42, -18, SHIP.WATER_WIDTH - 84, WORLD.height + 36, 22);
      const offset = this.scroll % 118;
      g.lineStyle(2, 0xdff8ff, 0.2);
      for (let y = -120 + offset; y < WORLD.height + 140; y += 118) {
        g.strokeRoundedRect(332, y + 18, 36, 56, 14);
        g.strokeRoundedRect(430, y + 6, 28, 62, 12);
        g.strokeRoundedRect(560, y + 42, 30, 54, 12);
        g.strokeRoundedRect(644, y + 12, 26, 48, 10);
      }
      // wake behind the ship — scales with speed
      const speed = Math.hypot(this.vel.x, this.vel.y);
      if (speed > 18) {
        const wake = U.clamp(speed / 240, 0, 1);
        g.lineStyle(2, 0xdff8ff, 0.12 + wake * 0.22);
        const backX = this.pos.x - this.vel.x * 0.12;
        const backY = this.pos.y + 56;
        g.lineBetween(this.pos.x - 14, this.pos.y + 40, backX - 22 - wake * 10, backY + wake * 26);
        g.lineBetween(this.pos.x + 14, this.pos.y + 40, backX + 22 + wake * 10, backY + wake * 26);
      }
    }

    drawBanks(g) {
      for (const launcher of this.launchers) {
        if (!launcher.alive || launcher.y < -42 || launcher.y > WORLD.height + 42) continue;
        const x = this.launcherX(launcher);
        const baseX = x + (launcher.side < 0 ? -26 : -34);
        g.fillStyle(0x5f5143, 1);
        g.fillRoundedRect(baseX, launcher.y - 20, 60, 38, 6);
        g.fillStyle(0x8d6f55, 1);
        g.fillTriangle(baseX - 4, launcher.y - 20, baseX + 30, launcher.y - 38, baseX + 64, launcher.y - 20);
        g.fillStyle(0x2a3138, 1);
        g.fillRoundedRect(baseX + 18, launcher.y - 14, 24, 22, 4);
        g.fillStyle(PALETTE.pod, 0.92);
        g.fillTriangle(baseX + 28, launcher.y - 28, baseX + 38, launcher.y - 10, baseX + 18, launcher.y - 10);
      }
      for (const gun of this.guns) {
        if (!gun.alive || gun.y < -32 || gun.y > WORLD.height + 32) continue;
        const x = this.gunX(gun);
        g.fillStyle(0x2d3338, 1);
        g.fillRoundedRect(x - 14, gun.y - 12, 28, 24, 4);
        g.fillStyle(0x1a2026, 1);
        g.fillRect(x + (gun.side < 0 ? 8 : -28), gun.y - 3, 20, 6);
        for (const enemy of this.gunTargets(gun)) {
          FX.drawEnemyFigure(g, enemy.x, enemy.y, PALETTE.target, 1, enemy.scale, enemy.pose, 1);
        }
      }
      for (const mine of this.mines) {
        const alert = mine.alert || 0;
        const radius = 5 + alert * 15 + Math.sin(mine.pulse) * (1 + alert * 2);
        g.lineStyle(1.5, 0xffb0a0, 0.18 + alert * 0.68);
        for (let i = 0; i < 8; i += 1) {
          const angle = mine.pulse * 0.22 + (i / 8) * Math.PI * 2;
          g.lineBetween(
            mine.x + Math.cos(angle) * radius * 0.72,
            mine.y + Math.sin(angle) * radius * 0.72,
            mine.x + Math.cos(angle) * (radius + 6),
            mine.y + Math.sin(angle) * (radius + 6)
          );
        }
        g.fillStyle(0xff2f2f, 0.22 + alert * 0.7);
        g.fillCircle(mine.x, mine.y, radius);
        g.lineStyle(1, 0xffb0a0, 0.2 + alert * 0.6);
        g.strokeCircle(mine.x, mine.y, radius + 5);
      }
    }

    drawCrates(g) {
      for (const crate of this.crates) {
        const accent =
          crate.type === "star" ? 0xffd55a : crate.type === "health" ? 0xff6b5d : crate.type === "smallgun" ? 0x9bd5ff : 0xb884ff;
        g.save();
        g.translateCanvas(crate.x, crate.y);
        g.rotateCanvas(Math.sin(crate.sway) * 0.12);
        g.fillStyle(0x9a7b4f, 1);
        g.fillRoundedRect(-11, -9, 22, 18, 4);
        g.fillStyle(0x7a5f3a, 1);
        g.fillRect(-11, -2, 22, 4);
        g.lineStyle(1.6, accent, 0.95);
        g.strokeRoundedRect(-11, -9, 22, 18, 4);
        g.lineBetween(0, -9, 0, 9);
        g.restore();
        g.lineStyle(1.4, 0xffffff, 0.22 + Math.sin(crate.sway * 2) * 0.06);
        g.strokeCircle(crate.x, crate.y, 16);
      }
    }

    drawProjectiles(g) {
      for (const bullet of this.bullets) {
        FX.drawTracer(g, bullet.x - bullet.vx * 0.022, bullet.y - bullet.vy * 0.022, bullet.x, bullet.y, 0xffefe0, 0.95, 2.4, 3.4, 0.45);
      }
      for (const shot of this.shots) {
        const alpha = U.clamp(shot.life / shot.maxLife, 0, 1);
        FX.drawTracer(g, shot.fromX, shot.fromY, shot.x, shot.y, shot.hostile ? PALETTE.hostile : PALETTE.shock, alpha, shot.hostile ? 3.1 : 2.2, shot.hostile ? 4.6 : 3.2, 0.34);
      }
      for (const bullet of this.playerBullets) {
        FX.drawTracer(g, bullet.prevX, bullet.prevY, bullet.x, bullet.y, PALETTE.shock, 0.95, 2.1, 3.1, 0.36);
      }
      for (const missile of this.supportMissiles) {
        FX.drawRocket(g, missile.x, missile.y, missile.angle, Math.max(8, missile.size), {
          body: 0xdde8ee, hot: 0xffd058, glow: U.blend(PALETTE.blast, PALETTE.shock, 0.26),
          stripe: 0x7ec8ff, flame: 0xff7c56, ember: PALETTE.shock, core: 0x23354a,
        }, missile.life * 8, 0.22);
      }
      for (const missile of this.enemyMissiles) {
        const size = missile.displaySize || missile.size;
        const hot = U.blend(0xff69b4, 0xff3f74, missile.danger || 0);
        const body = U.blend(0x4b153a, 0xffb0d6, (missile.danger || 0) * 0.74);
        const glow = U.blend(0xb33b74, 0xff4f96, missile.danger || 0);
        FX.drawRocket(g, missile.x, missile.y, missile.angle, size, {
          body, hot, glow, stripe: U.blend(body, 0xffffff, 0.18), flame: 0xff7c56,
          ember: U.blend(PALETTE.shock, 0xffd18a, 0.25), core: 0x20303e,
        }, missile.pulse, missile.danger || 0);
        g.lineStyle(1.6, glow, 0.28 + (missile.danger || 0) * 0.28);
        g.strokeCircle(missile.x, missile.y, size + 3 + Math.sin(missile.pulse) * 1.2);
      }
    }

    drawShip(g) {
      this.scene.setShipVisible(!this.failed);
      this.scene.setShipPosition(this.pos.x, this.pos.y + 6, U.clamp(this.vel.x / 240, -1, 1) * 0.14);

      // aim guide
      const firePad = this.scene.firePad();
      const aim = firePad.active ? firePad : this.autoTarget ? this.dirTo(this.autoTarget) : null;
      if (aim) {
        const len = Math.hypot(aim.x, aim.y) || 1;
        g.lineStyle(2, PALETTE.shock, 0.38);
        g.lineBetween(this.pos.x, this.pos.y - 36, this.pos.x + (aim.x / len) * 82, this.pos.y - 36 + (aim.y / len) * 82);
      }
      if (this.autoTarget && !firePad.active) {
        g.lineStyle(1.5, PALETTE.hudCyan, 0.26);
        g.strokeCircle(this.autoTarget.x, this.autoTarget.y, this.autoTarget.kind === "launcher" ? 22 : this.autoTarget.kind === "gun" ? 18 : 14);
      }

      // shield rings + status bars (flicker while the mercy window is live)
      const invuln = this.time < this.invulnUntil;
      const flicker = invuln ? 0.45 + Math.sin(this.time * 42) * 0.35 : 1;
      g.save();
      g.translateCanvas(this.pos.x, this.pos.y);
      const shieldColors = [0x9bd5ff, 0xffcc4d, 0x5ee3a2];
      for (let layer = 0; layer < this.shields.length; layer += 1) {
        const hp = this.shields[layer];
        const color = shieldColors[layer];
        const alpha = (hp > 0 ? 0.26 + (hp / 3) * 0.5 : 0.14) * flicker;
        g.lineStyle(3, color, alpha);
        g.strokeRoundedRect(-28 - layer * 8, -45 - layer * 8, 56 + layer * 16, 90 + layer * 16, 18);
      }
      g.fillStyle(0x07131d, 0.82);
      g.fillRoundedRect(-62, -78, 124, 16, 7);
      for (let layer = 0; layer < this.shields.length; layer += 1) {
        const hp = this.shields[layer];
        const color = shieldColors[layer];
        const x = -58 + layer * 40;
        g.fillStyle(color, 0.16);
        g.fillRoundedRect(x, -74, 34, 8, 4);
        if (hp > 0) {
          g.fillStyle(color, 0.92);
          g.fillRoundedRect(x, -74, 34 * (hp / 3), 8, 4);
        }
      }
      if (this.shieldTotal() === 0) {
        g.fillStyle(0xff6b5d, 0.9);
        for (let i = 0; i < this.hullHp; i += 1) g.fillCircle(-14 + i * 14, -86, 4);
        g.lineStyle(1, 0xff6b5d, 0.5);
        for (let i = 0; i < SHIP.HULL_HP; i += 1) g.strokeCircle(-14 + i * 14, -86, 4);
      }
      g.restore();
    }
  };
})();

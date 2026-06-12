/* Sky Drill 2 — chapter1.js
 * Operation Sky Drill: plane-dropped drill pods vs fortified towers.
 *
 * Physics notes:
 *  - Pods integrate with the shared semi-implicit Euler core (gravity,
 *    quadratic drag, wind coupling, guidance thrust). The aim preview
 *    runs the *same* stepPod() against cloned block health, so the
 *    dashed line, detonation point and blast circle are exact.
 *  - Trajectory styles are real forces: Brake = lateral air brake,
 *    Hook = thruster glide then dive, Zigzag = alternating lateral
 *    thrusters. Gravity never changes.
 *  - Bounces use a constant restitution (e = 0.52) so every bounce
 *    loses energy; drilling applies material resistance that can jam
 *    (and detonate) a slow pod.
 *  - Destroyed blocks remove support: masonry above falls, takes
 *    impact damage, and crushes crawlers it lands on.
 */
(function () {
  "use strict";

  const SD = window.SD;
  const U = SD.U;
  const FX = SD.FX;
  const PHYS = SD.PHYS;
  const PALETTE = SD.PALETTE;
  const WORLD = SD.WORLD;
  const MAP = SD.MAP;
  const SURFACE_Y = SD.SURFACE_Y;

  const PLANE_Y = 78;
  const RELEASE_DROP = 18; // pod leaves 18px under the plane

  /* ------------------------- pod construction ------------------------ */

  function createPod(x, y, planeVx, angleDeg, speed, cfg, level) {
    const rad = (angleDeg * Math.PI) / 180;
    // Launch speed is applied at angleDeg from straight down; the pod
    // also inherits the full carrier velocity (no fudge factors).
    const vx = planeVx + Math.sin(rad) * speed;
    const vy = Math.cos(rad) * speed;
    return {
      x, y, vx, vy,
      prevX: x, prevY: y,
      t: 0,
      forward: vx >= 0 ? 1 : -1,
      cfg,
      drillDps: 240 + speed * 1.15,
      radius: level.podRadius,
      drillRadius: level.drillRadius,
      fuse: cfg.fuse,
      pierced: 0,
      lastPiercedRow: -1,
      bounces: 0,
      rolling: false,
      dead: false,
      result: null, // {x, y, reason} once finished
      trail: [],
    };
  }

  /* Guidance thrust — pure function of pod state, identical in preview. */
  function guidance(pod) {
    if (pod.bounces > 0 || pod.rolling) return null; // thrusters shear off on ground contact
    const path = pod.cfg.path;
    if (path === "drop") {
      return { x: -pod.vx * 4.6, y: 0 };
    }
    if (path === "hook") {
      if (pod.t < 0.24 || pod.t > 1.1) return null;
      return { x: pod.forward * 330, y: -PHYS.GRAVITY * 0.62 };
    }
    if (path === "zigzag") {
      if (pod.t < 0.18) return null;
      const phase = Math.floor((pod.t - 0.18) / 0.42);
      return { x: (phase % 2 === 0 ? 1 : -1) * pod.forward * 430, y: -PHYS.GRAVITY * 0.3 };
    }
    return null; // arc: pure ballistics
  }

  /**
   * Advance one pod. `world` adapts live vs preview state:
   *   blocks: flat array (each block has .idx)
   *   isDestroyed(block), damage(block, dmg) -> true when block breaks
   *   targets: array or null
   *   wind: px/s
   *   events: {onPierce, onBounce, onRoll, onTargetKill, onDetonate, onFizzle}
   * Detonation/fizzle sets pod.dead + pod.result; physics stops that substep.
   */
  function stepPod(pod, world, dt) {
    const events = world.events;
    const detonate = (reason) => {
      pod.dead = true;
      pod.result = { x: pod.x, y: pod.y, reason };
      if (events.onDetonate) events.onDetonate(pod, reason);
      return false;
    };

    return SD.Physics.advanceBody(
      pod,
      {
        gravity: PHYS.GRAVITY,
        dragK: PHYS.POD_DRAG_K,
        windX: world.wind,
        windCouple: PHYS.POD_WIND_COUPLE,
        accel: guidance,
      },
      dt,
      (body, h) => {
        pod.t += h;
        // bounce pods detonate by contact count, not by fuse — the timer
        // would otherwise expire mid-air and make bounceCount unreachable
        if (pod.cfg.type !== "bounce") {
          pod.fuse -= h;
          if (pod.fuse <= 0) return detonate("fuse");
        }
        if (pod.t > 8) return detonate("timeout");

        // --- masonry contact ---
        let resist = 0;
        for (const block of world.blocks) {
          if (world.isDestroyed(block)) continue;
          if (!U.circleRect(pod.x, pod.y, pod.drillRadius, block)) continue;
          resist = Math.max(resist, block.foundation ? PHYS.RESIST_FOUNDATION : PHYS.RESIST_WALL);
          if (world.damage(block, pod.drillDps * h)) {
            // "drill depth" counts floors pierced, not raw blocks — a pod
            // straddling a column boundary must not double-count a layer
            if (block.row == null || block.row > pod.lastPiercedRow) {
              pod.pierced += 1;
              if (block.row != null) pod.lastPiercedRow = block.row;
            }
            if (events.onPierce) events.onPierce(block, pod);
          }
        }

        // --- island ground ---
        const overIsland = pod.x > MAP.x && pod.x < MAP.x + MAP.width;
        if (overIsland) {
          const floorY = SURFACE_Y - pod.radius;
          if (pod.cfg.type === "drill") {
            if (pod.y > SURFACE_Y) {
              resist = Math.max(resist, PHYS.RESIST_GROUND);
              if (pod.y > SURFACE_Y + 50) return detonate("deep");
            }
          } else if (pod.y >= floorY && pod.vy > 0) {
            if (pod.cfg.type === "bounce") {
              pod.bounces += 1;
              if (events.onBounce) events.onBounce(pod);
              if (pod.bounces >= pod.cfg.bounceCount) return detonate("impact");
              SD.Physics.bounceOffGround(pod, floorY, PHYS.RESTITUTION_POD, PHYS.BOUNCE_FRICTION);
            } else {
              // timer: one soft bounce, then roll with friction while the fuse burns
              if (pod.vy > 60 && !pod.rolling) {
                SD.Physics.bounceOffGround(pod, floorY, PHYS.RESTITUTION_TIMER, 0.86);
                if (events.onBounce) events.onBounce(pod);
              } else {
                pod.y = floorY;
                pod.vy = 0;
                if (!pod.rolling && events.onRoll) events.onRoll(pod);
                pod.rolling = true;
                pod.vx *= Math.max(0, 1 - PHYS.ROLL_FRICTION * h);
              }
            }
          }
        }

        // --- material resistance (drilling decelerates; slow drill jams) ---
        if (resist > 0) {
          const speed = Math.hypot(pod.vx, pod.vy);
          const drop = resist * h;
          if (speed - drop < PHYS.POD_STUCK_SPEED) return detonate("jam");
          const scale = (speed - drop) / speed;
          pod.vx *= scale;
          pod.vy *= scale;
        }

        if (pod.cfg.type === "drill" && pod.pierced >= pod.cfg.drillWalls) {
          return detonate("drill");
        }

        // --- crawler contact (swept segment, no tunneling) ---
        if (world.targets) {
          for (const target of world.targets) {
            if (!target.alive) continue;
            const ty = target.y - 8 * target.scale;
            if (U.pointSegDist(target.x, ty, pod.prevX, pod.prevY, pod.x, pod.y) < pod.drillRadius + target.hitRadius) {
              if (events.onTargetKill) events.onTargetKill(target, pod);
            }
          }
        }

        // --- out of bounds ---
        if (pod.y > MAP.y + MAP.height + 60 || pod.x < -80 || pod.x > WORLD.width + 80) {
          pod.dead = true;
          pod.result = { x: pod.x, y: pod.y, reason: "fizzle" };
          if (events.onFizzle) events.onFizzle(pod);
          return false;
        }
        return true;
      }
    );
  }

  /* ------------------------------ chapter ---------------------------- */

  SD.Chapter1 = class Chapter1 {
    constructor(scene) {
      this.scene = scene;
      this.id = "bombing";
    }

    enter(levelIndex) {
      const level = SD.LEVELS.bombing[levelIndex];
      this.levelIndex = levelIndex;
      this.level = level;
      this.time = 0;
      this.plane = { x: -90, y: PLANE_Y, vx: level.planeSpeed, banking: 0 };
      this.blocks = [];
      this.buildings = level.buildings.map((spec) => this.buildBuilding(spec));
      this.targets = level.targets.map((t, index) => ({
        id: index,
        x0: t.x,
        x: t.x,
        y: t.y,
        dir: index % 2 === 0 ? 1 : -1,
        scale: level.targetScale,
        hitRadius: level.targetHitRadius,
        alive: true,
        state: "crawl",
        stateTime: -index * 0.16,
      }));
      this.podsLeft = level.pods;
      this.pods = [];
      this.pending = null;
      this.fx = [];
      this.rings = [];
      this.finished = false;
      this.failed = false;
      this.preview = null;
      this.previewHp = null;
      this.previewDestroyed = null;
      SD.UI.setMode("bombing");
      SD.UI.hint("");
      SD.UI.setDropEnabled(true);
      SD.UI.banner(`${level.name} · ${level.sub}`, this.windLabel(), 2.2);
    }

    exit() {
      this.pods = [];
      this.fx = [];
      this.rings = [];
    }

    windLabel() {
      const wind = this.level.wind;
      if (!wind) return "Calm air";
      return `Wind ${wind > 0 ? "→" : "←"} ${Math.abs(wind)}`;
    }

    buildBuilding(spec) {
      const blocks = [];
      const bw = spec.width / spec.cols;
      const bh = spec.height / spec.rows;
      const scale = spec.healthScale || 1;
      for (let row = 0; row < spec.rows; row += 1) {
        for (let col = 0; col < spec.cols; col += 1) {
          const foundation = row === spec.rows - 1;
          const health = (foundation ? 90 : 45) * scale;
          const block = {
            idx: this.blocks.length,
            x: spec.x + col * bw,
            y: spec.y + row * bh,
            width: bw,
            height: bh,
            col,
            row,
            foundation,
            health,
            maxHealth: health,
            destroyed: false,
            fallVy: 0,
          };
          this.blocks.push(block);
          blocks.push(block);
        }
      }
      return { ...spec, blocks, bw, bh, baseY: spec.y + spec.height };
    }

    /* ------------------------------ input ----------------------------- */

    primaryAction() {
      this.queueDrop();
    }

    queueDrop() {
      if (this.finished || this.failed || this.pending || this.pods.length > 0) return;
      if (this.podsLeft <= 0) {
        SD.UI.toast("No pods left");
        return;
      }
      const params = SD.UI.readDropParams();
      const cfg = SD.UI.takeShotConfig();
      const releaseX = this.wrapPlaneX(this.plane.x + this.plane.vx * params.delay);
      this.pending = {
        releaseAt: this.time + params.delay,
        releaseX,
        params,
        cfg,
        path: this.simulatePath(releaseX, this.plane.vx, params, cfg),
      };
      SD.UI.setDropEnabled(false);
      SD.UI.toast("Drop armed");
      SD.Audio.play("uiClick");
    }

    wrapPlaneX(x) {
      const span = WORLD.width + 190;
      let wrapped = (x + 95) % span;
      if (wrapped < 0) wrapped += span;
      return wrapped - 95;
    }

    /* ------------------------- preview / simulate --------------------- */

    /** Full-fidelity simulation against cloned block health. */
    simulatePath(releaseX, planeVx, params, cfg) {
      if (!this.previewHp || this.previewHp.length !== this.blocks.length) {
        this.previewHp = new Float64Array(this.blocks.length);
        this.previewDestroyed = new Uint8Array(this.blocks.length);
      }
      for (let i = 0; i < this.blocks.length; i += 1) {
        this.previewHp[i] = this.blocks[i].health;
        this.previewDestroyed[i] = this.blocks[i].destroyed ? 1 : 0;
      }
      const hp = this.previewHp;
      const destroyed = this.previewDestroyed;
      const pod = createPod(releaseX, PLANE_Y + RELEASE_DROP, planeVx, params.angleDeg, params.speed, cfg, this.level);
      const world = {
        blocks: this.blocks,
        wind: this.level.wind,
        targets: null,
        isDestroyed: (b) => destroyed[b.idx] === 1,
        damage: (b, dmg) => {
          hp[b.idx] -= dmg;
          if (hp[b.idx] <= 0 && destroyed[b.idx] === 0) {
            destroyed[b.idx] = 1;
            return true;
          }
          return false;
        },
        events: {},
      };
      const points = [{ x: pod.x, y: pod.y }];
      const maxSteps = Math.ceil(6 / PHYS.DT);
      for (let i = 0; i < maxSteps && !pod.dead; i += 1) {
        stepPod(pod, world, PHYS.DT);
        if (i % 3 === 0 || pod.dead) points.push({ x: pod.x, y: pod.y });
      }
      return { points, result: pod.result, blast: cfg.blastRadius, type: cfg.type };
    }

    refreshPreview() {
      if (this.pending || this.pods.length > 0 || this.finished || this.failed) {
        this.preview = null;
        return;
      }
      const params = SD.UI.readDropParams();
      const cfg = { ...SD.UI.editableConfig() };
      const releaseX = this.wrapPlaneX(this.plane.x + this.plane.vx * params.delay);
      this.preview = this.simulatePath(releaseX, this.plane.vx, params, cfg);
      this.preview.releaseX = releaseX;
    }

    /* ------------------------------ update ---------------------------- */

    update(dt) {
      this.time += dt;
      const state = this;
      this.plane.x += this.plane.vx * dt;
      this.plane.banking = Math.sin(this.time * 1.8) * 0.025;
      if (this.plane.x > WORLD.width + 95) this.plane.x = -95;

      if (this.pending && this.time >= this.pending.releaseAt) this.releasePod();

      // live pods
      const liveWorld = this.liveWorld();
      for (const pod of this.pods) {
        if (pod.dead) continue;
        stepPod(pod, liveWorld, dt);
        pod.trail.push({ x: pod.x, y: pod.y });
        if (pod.trail.length > 30) pod.trail.shift();
      }
      this.pods = this.pods.filter((pod) => !pod.dead);

      this.updateCollapse(dt);
      this.updateTargets(dt);

      this.fx = FX.updateParticles(this.fx, dt, 110);
      for (const ring of this.rings) ring.life -= dt;
      this.rings = this.rings.filter((ring) => ring.life > 0);

      // drop availability + end conditions
      if (!this.finished && !this.failed) {
        SD.UI.setDropEnabled(!this.pending && this.pods.length === 0 && this.podsLeft > 0);
        if (this.pods.length === 0 && !this.pending && this.podsLeft <= 0 && this.targets.some((t) => t.alive)) {
          this.failed = true;
          this.scene.onLevelFail("Out of pods", "bombing");
        }
      }

      this.refreshPreview();
    }

    liveWorld() {
      return {
        blocks: this.blocks,
        wind: this.level.wind,
        targets: this.targets,
        isDestroyed: (b) => b.destroyed,
        damage: (b, dmg) => {
          if (b.destroyed) return false;
          b.health -= dmg;
          if (b.health <= 0) {
            this.destroyBlock(b, "drill");
            return true;
          }
          return false;
        },
        events: {
          onPierce: () => SD.Audio.play("drillBreak"),
          onBounce: (pod) => {
            SD.Audio.play("bounce");
            FX.burstInto(this.fx, pod.x, SURFACE_Y, PALETTE.islandDark, 6, 0.55);
          },
          onRoll: (pod) => {
            SD.Audio.play("thud");
            FX.burstInto(this.fx, pod.x, SURFACE_Y, PALETTE.islandDark, 4, 0.4);
          },
          onTargetKill: (target) => this.killTarget(target, "drill"),
          onDetonate: (pod) => this.explode(pod),
          onFizzle: (pod) => {
            FX.burstInto(this.fx, pod.x, Math.min(pod.y, MAP.y + MAP.height + 30), PALETTE.smoke, 7, 0.6);
          },
        },
      };
    }

    releasePod() {
      const pending = this.pending;
      this.pending = null;
      const pod = createPod(
        pending.releaseX,
        PLANE_Y + RELEASE_DROP,
        this.plane.vx,
        pending.params.angleDeg,
        pending.params.speed,
        pending.cfg,
        this.level
      );
      pod.plannedPath = pending.path;
      this.podsLeft -= 1;
      this.pods.push(pod);
      SD.Audio.play("launch");
    }

    destroyBlock(block, source) {
      if (block.destroyed) return;
      block.destroyed = true;
      this.scene.addScore(source === "blast" ? 6 : source === "crush" ? 2 : 4);
      FX.burstInto(this.fx, block.x + block.width / 2, block.y + block.height / 2, PALETTE.buildingDark, 5, 0.45);
    }

    /* Masonry above destroyed blocks loses support and falls. */
    updateCollapse(dt) {
      for (const building of this.buildings) {
        for (let col = 0; col < building.cols; col += 1) {
          let supportTop = building.baseY;
          for (let row = building.rows - 1; row >= 0; row -= 1) {
            const block = building.blocks[row * building.cols + col];
            if (block.destroyed) continue;
            const restY = supportTop - block.height;
            if (block.y < restY - 0.5) {
              block.fallVy += PHYS.BLOCK_FALL_GRAVITY * dt;
              block.y = Math.min(block.y + block.fallVy * dt, restY);
              // crush crawlers under falling masonry
              for (const target of this.targets) {
                if (!target.alive) continue;
                if (
                  target.x > block.x - 2 &&
                  target.x < block.x + block.width + 2 &&
                  target.y - 6 > block.y &&
                  target.y - 14 < block.y + block.height
                ) {
                  this.killTarget(target, "crush");
                }
              }
              if (block.y >= restY) {
                const impact = block.fallVy;
                block.fallVy = 0;
                if (impact > PHYS.BLOCK_IMPACT_SAFE) {
                  block.health -= (impact - PHYS.BLOCK_IMPACT_SAFE) * 0.5;
                  SD.Audio.play("thud");
                  FX.burstInto(this.fx, block.x + block.width / 2, block.y + block.height, PALETTE.blockCrack, 4, 0.5);
                  if (block.health <= 0) {
                    this.destroyBlock(block, "crush");
                    continue; // destroyed: does not become support
                  }
                }
              }
            } else if (block.y > restY) {
              block.y = restY;
              block.fallVy = 0;
            }
            supportTop = block.y;
          }
        }
      }
    }

    updateTargets(dt) {
      for (const target of this.targets) {
        target.stateTime += dt;
        if (target.alive) {
          if (target.state === "crawl" && target.stateTime >= 1.15) {
            target.state = "standing";
            target.stateTime = 0;
          } else if (target.state === "standing") {
            target.x += target.dir * 9 * dt;
            if (Math.abs(target.x - target.x0) > 14) target.dir *= -1;
          }
          continue;
        }
        if (target.state === "fall" && target.stateTime >= 0.34) {
          target.state = "explode";
          target.stateTime = 0;
          this.rings.push({ x: target.x, y: target.y - 12 * target.scale, radius: 18 * target.scale, life: 0.28, maxLife: 0.28 });
        } else if (target.state === "explode" && target.stateTime >= 0.36) {
          target.state = "sink";
          target.stateTime = 0;
        } else if (target.state === "sink" && target.stateTime >= 1.05) {
          target.state = "gone";
          target.stateTime = 0;
        }
      }
    }

    killTarget(target, source) {
      if (!target.alive) return;
      target.alive = false;
      target.state = "fall";
      target.stateTime = 0;
      this.scene.addScore(120, target.x, target.y - 18, "#5ee3a2");
      FX.burstInto(this.fx, target.x, target.y - 14 * target.scale, PALETTE.targetDone, 8, 0.42);
      SD.Audio.play("hit");
      this.scene.juice.shake(0.16);
      if (source === "crush") SD.UI.toast("Nest crushed by falling masonry");
      this.checkClear();
    }

    explode(pod) {
      const radius = pod.cfg.blastRadius;
      const x = U.clamp(pod.x, MAP.x, MAP.x + MAP.width);
      const y = U.clamp(pod.y, MAP.y, MAP.y + MAP.height + 18);
      let destroyed = 0;
      for (const block of this.blocks) {
        if (block.destroyed || !U.circleRect(x, y, radius, block)) continue;
        const cx = block.x + block.width / 2;
        const cy = block.y + block.height / 2;
        const falloff = U.clamp(1 - U.dist(cx, cy, x, y) / radius, 0, 1);
        block.health -= U.lerp(PHYS.BLAST_DMG_EDGE, PHYS.BLAST_DMG_CENTER, falloff);
        if (block.health <= 0) {
          this.destroyBlock(block, "blast");
          destroyed += 1;
        }
      }
      let kills = 0;
      for (const target of this.targets) {
        if (!target.alive) continue;
        if (U.dist(target.x, target.y - 8 * target.scale, x, y) <= radius * 0.85 + target.hitRadius) {
          this.killTarget(target, "blast");
          kills += 1;
        }
      }
      this.rings.push({ x, y, radius, life: 0.34, maxLife: 0.34 });
      FX.burstInto(this.fx, x, y, PALETTE.blast, 18, 0.86);
      FX.burstInto(this.fx, x, y, PALETTE.shock, 10, 0.55);
      const big = destroyed >= 4 || kills > 0;
      this.scene.juice.shake(big ? 0.55 : 0.3);
      if (big) this.scene.juice.hitStop(0.06);
      SD.Audio.play(big ? "bigBoom" : "boom");
      if (pod.result && pod.result.reason === "jam") SD.UI.toast("Drill jammed — detonated in place");
    }

    checkClear() {
      if (this.finished || this.failed) return;
      if (this.targets.every((t) => !t.alive)) {
        this.finished = true;
        const bonus = this.podsLeft * this.level.bonusPerPod;
        if (bonus > 0) {
          this.scene.addScore(bonus, WORLD.width / 2, 150, "#ffcc4d");
        }
        SD.UI.setDropEnabled(false);
        SD.Audio.play("clear");
        SD.UI.banner("AREA CLEARED", bonus > 0 ? `Pod efficiency bonus +${bonus}` : "All nests destroyed", 2);
        this.scene.onLevelClear(2.0);
      }
    }

    hudStats() {
      const marked = this.targets.filter((t) => !t.alive).length;
      return [
        { label: "Level", value: `${this.levelIndex + 1}/${SD.LEVELS.bombing.length}` },
        { label: "Nests", value: `${marked}/${this.targets.length}` },
        { label: "Pods", value: `${this.podsLeft}`, tone: this.podsLeft === 0 ? "warn" : "" },
        { label: "Wind", value: this.level.wind ? `${this.level.wind > 0 ? "→" : "←"}${Math.abs(this.level.wind)}` : "—" },
        { label: "Score", value: `${this.scene.score}` },
      ];
    }

    /* ------------------------------- draw ------------------------------ */

    draw() {
      const g = this.scene.g;
      this.drawBackdrop(g.bg);
      this.drawPreview(g.traj);
      this.drawBasement(g.map);
      this.drawBuildings(g.map);
      this.drawTargets(g.map);
      for (const ring of this.rings) FX.drawBlastWave(g.fx, { ...ring, color: PALETTE.blast }, PALETTE.shock);
      for (const particle of this.fx) FX.drawParticle(g.fx, particle);
      this.drawPlane(g.dyn);
      this.drawPods(g.dyn);
      this.drawPending(g.dyn);
    }

    drawBackdrop(g) {
      g.fillStyle(0x041018, 0.08);
      g.fillRect(0, 0, WORLD.width, WORLD.height);
      g.fillStyle(0x365c36, 0.34);
      g.fillRoundedRect(MAP.x + 86, SURFACE_Y + 8, MAP.width - 172, 58, 10);
      g.fillStyle(0x1f3026, 0.24);
      g.fillRoundedRect(MAP.x + 116, SURFACE_Y + 36, MAP.width - 232, 28, 8);
      g.lineStyle(3, 0xf4f7f9, 0.32);
      g.strokeRoundedRect(MAP.x - 22, MAP.y - 18, MAP.width + 44, MAP.height + 40, 12);
      // wind streaks
      const wind = this.level.wind;
      if (wind) {
        const tt = this.time * (wind * 1.6);
        g.lineStyle(1.4, 0xffffff, 0.16);
        for (let i = 0; i < 5; i += 1) {
          const y = 96 + i * 26;
          const span = WORLD.width + 160;
          let x = ((tt * (0.7 + i * 0.12)) % span + span) % span - 80;
          const len = 26 + Math.abs(wind) * 0.5;
          g.lineBetween(x, y, x + (wind > 0 ? len : -len), y);
        }
      }
    }

    drawBasement(g) {
      g.fillStyle(0x1d2a2b, 0.78);
      g.fillRoundedRect(MAP.x + 116, SURFACE_Y - 8, 690, 56, 6);
      g.lineStyle(2, 0x9bd29e, 0.25);
      g.strokeRoundedRect(MAP.x + 116, SURFACE_Y - 8, 690, 56, 6);
      g.fillStyle(0x0f171b, 0.4);
      for (let x = MAP.x + 150; x < MAP.x + 770; x += 84) {
        g.fillRect(x, SURFACE_Y - 7, 3, 55);
      }
    }

    drawBuildings(g) {
      for (const building of this.buildings) {
        g.fillStyle(0x313c44, 0.45);
        g.fillRect(building.x + 8, building.y + 10, building.width, building.height);
        for (const block of building.blocks) {
          if (block.destroyed) {
            g.lineStyle(1, PALETTE.blockCrack, 0.16);
            g.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
            continue;
          }
          const health = U.clamp(block.health / block.maxHealth, 0, 1);
          const hex = U.blend(PALETTE.buildingDark, PALETTE.building, health);
          g.fillStyle(hex, 1);
          g.fillRect(block.x, block.y, block.width - 1.5, block.height - 1.5);
          g.lineStyle(1, 0xffffff, 0.12);
          g.strokeRect(block.x + 0.5, block.y + 0.5, block.width - 2.5, block.height - 2.5);
          if (health < 0.6) {
            g.lineStyle(1, PALETTE.blockCrack, 0.5 * (1 - health));
            g.lineBetween(block.x + block.width * 0.2, block.y + 2, block.x + block.width * 0.5, block.y + block.height - 3);
            g.lineBetween(block.x + block.width * 0.5, block.y + block.height * 0.4, block.x + block.width * 0.8, block.y + block.height - 2);
          }
          if (block.foundation) {
            g.lineStyle(2, 0x141b20, 0.48);
            g.strokeRect(block.x + 1, block.y + 1, block.width - 3, block.height - 3);
          }
          if (block.height > 30) {
            g.fillStyle(0x365d72, 0.58);
            g.fillRect(block.x + block.width * 0.28, block.y + 9, block.width * 0.18, 12);
            g.fillRect(block.x + block.width * 0.58, block.y + 9, block.width * 0.18, 12);
          }
        }
        g.fillStyle(0x434e58, 1);
        g.fillRect(building.x - 8, building.y - 12, building.width + 16, 12);
        g.fillStyle(0x788591, 1);
        g.fillTriangle(building.x - 12, building.y - 12, building.x + 20, building.y - 32, building.x + 52, building.y - 12);
      }
    }

    drawTargets(g) {
      for (const target of this.targets) {
        if (target.state === "gone") continue;
        const color = target.alive ? PALETTE.target : PALETTE.targetDone;
        const pose = target.state || (target.alive ? "standing" : "sink");
        const poseDuration =
          pose === "crawl" ? 1.15 : pose === "fall" ? 0.34 : pose === "explode" ? 0.36 : pose === "sink" ? 1.05 : 1;
        const progress = U.clamp(target.stateTime / poseDuration, 0, 1);
        const alpha = target.alive ? 1 : pose === "sink" ? Math.max(0.1, 1 - progress) : 0.86;
        if (target.alive) {
          g.lineStyle(1, color, 0.42);
          g.strokeCircle(target.x, target.y - 8 * target.scale, target.hitRadius);
        }
        FX.drawEnemyFigure(g, target.x, target.y, color, alpha, target.scale, pose, progress);
      }
    }

    drawPlane(g) {
      const x = this.plane.x;
      const y = this.plane.y;
      g.save();
      g.translateCanvas(x, y);
      g.rotateCanvas(this.plane.banking);
      g.scaleCanvas(0.62, 0.62);
      g.fillStyle(0xf5f8fb, 1);
      g.fillRoundedRect(-54, -11, 92, 22, 10);
      g.fillStyle(0xd7e0e7, 1);
      g.fillTriangle(-8, -9, 30, -48, 48, -8);
      g.fillTriangle(-4, 9, 26, 45, 42, 8);
      g.fillStyle(0x4e6f85, 1);
      g.fillTriangle(-48, -10, -72, -36, -42, 0);
      g.fillTriangle(-48, 10, -72, 36, -42, 0);
      g.fillStyle(0x2f91c2, 1);
      g.fillRoundedRect(8, -7, 18, 14, 6);
      g.fillStyle(PALETTE.pod, 1);
      g.fillCircle(46, 0, 5);
      g.restore();
    }

    drawPods(g) {
      for (const pod of this.pods) {
        for (let i = 0; i < pod.trail.length; i += 1) {
          const point = pod.trail[i];
          const a = i / pod.trail.length;
          g.fillStyle(PALETTE.pod, 0.06 + a * 0.16);
          g.fillCircle(point.x, point.y, 1.2 + a * pod.radius * 0.54);
        }
        const rotation = Math.atan2(pod.vy, pod.vx);
        const r = pod.radius;
        g.save();
        g.translateCanvas(pod.x, pod.y);
        g.rotateCanvas(rotation);
        g.fillStyle(PALETTE.pod, 1);
        g.fillRoundedRect(-1.45 * r, -0.72 * r, 2.9 * r, 1.44 * r, 3);
        g.fillStyle(0x1a2027, 1);
        g.fillTriangle(1.18 * r, -0.88 * r, 2.4 * r, 0, 1.18 * r, 0.88 * r);
        // drill bit spin marks
        g.lineStyle(1, 0xffffff, 0.5);
        const spin = (pod.t * 26) % 1;
        g.lineBetween(1.3 * r, -0.5 * r + spin * r, 1.9 * r, -0.2 * r + spin * 0.5 * r);
        g.restore();
      }
    }

    drawPending(g) {
      if (!this.pending) return;
      const remaining = Math.max(0, this.pending.releaseAt - this.time);
      const progress = 1 - remaining / Math.max(0.001, this.pending.params.delay);
      const x = this.pending.releaseX;
      const y = PLANE_Y + RELEASE_DROP;
      g.lineStyle(2, PALETTE.pod, 0.8);
      g.strokeCircle(x, y, 8 + progress * 10);
      g.fillStyle(PALETTE.pod, 0.9);
      g.fillCircle(x, y, 3);
      this.drawPath(g, this.pending.path, 0.5);
    }

    drawPreview(g) {
      if (this.pending || !this.preview) return;
      this.drawPath(g, this.preview, 0.42);
      g.fillStyle(PALETTE.pod, 0.6);
      g.fillCircle(this.preview.releaseX, PLANE_Y + RELEASE_DROP, 3);
    }

    drawPath(g, path, alpha) {
      if (!path || path.points.length < 2) return;
      g.lineStyle(1.4, PALETTE.pod, alpha);
      for (let i = 1; i < path.points.length; i += 1) {
        if (i % 2 === 0) continue; // dashed
        const a = path.points[i - 1];
        const b = path.points[i];
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
      if (path.result && path.result.reason !== "fizzle") {
        const r = path.result;
        g.lineStyle(1.6, PALETTE.blast, alpha + 0.25);
        g.lineBetween(r.x - 6, r.y - 6, r.x + 6, r.y + 6);
        g.lineBetween(r.x - 6, r.y + 6, r.x + 6, r.y - 6);
        g.lineStyle(1.2, PALETTE.blast, alpha + 0.1);
        g.strokeCircle(r.x, r.y, path.blast);
      }
    }
  };
})();

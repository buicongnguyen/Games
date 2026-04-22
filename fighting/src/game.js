(function () {
  "use strict";

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const WORLD = { width: 960, height: 540 };
  const MAP = { x: 56, y: 112, width: 848, height: 344 };
  const SURFACE_Y = 394;
  const GRAVITY = 450;

  const els = {
    angle: document.getElementById("angle-input"),
    angleOut: document.getElementById("angle-output"),
    speed: document.getElementById("speed-input"),
    speedOut: document.getElementById("speed-output"),
    delay: document.getElementById("delay-input"),
    delayOut: document.getElementById("delay-output"),
    drop: document.getElementById("drop-button"),
    reset: document.getElementById("reset-button"),
    stage: document.getElementById("stage-value"),
    targets: document.getElementById("targets-value"),
    pods: document.getElementById("pods-value"),
    score: document.getElementById("score-value"),
    message: document.getElementById("message"),
  };

  const palette = {
    skyTop: 0x9ed9f2,
    skyMid: 0x75c5e2,
    sea: 0x1f7594,
    island: 0x5dae7d,
    islandDark: 0x2f7b55,
    road: 0xe0d2a5,
    building: 0xb8c2ca,
    buildingDark: 0x6f7b86,
    blockCrack: 0x404954,
    target: 0xff6b5d,
    targetDone: 0x5ee3a2,
    pod: 0xffcc4d,
    smoke: 0xf4f7f9,
  };

  const LEVELS = [
    {
      name: "Stage 1",
      pods: 6,
      planeSpeed: 96,
      podRadius: 6,
      drillRadius: 11,
      targetScale: 0.58,
      targetHitRadius: 5,
      bonusPerPod: 35,
      buildings: [
        { id: "A", x: 202, y: 238, width: 104, height: 156, cols: 4, rows: 4 },
        { id: "B", x: 396, y: 206, width: 132, height: 188, cols: 5, rows: 5 },
        { id: "C", x: 636, y: 254, width: 118, height: 140, cols: 4, rows: 4 },
      ],
      targets: [
        { x: 240, y: 384 },
        { x: 455, y: 382 },
        { x: 704, y: 385 },
      ],
    },
    {
      name: "Stage 2",
      pods: 5,
      planeSpeed: 108,
      podRadius: 5.5,
      drillRadius: 9.5,
      targetScale: 0.54,
      targetHitRadius: 4.5,
      bonusPerPod: 45,
      buildings: [
        { id: "A", x: 166, y: 250, width: 96, height: 144, cols: 3, rows: 4 },
        { id: "B", x: 330, y: 194, width: 124, height: 200, cols: 4, rows: 5, healthScale: 1.05 },
        { id: "C", x: 536, y: 224, width: 108, height: 170, cols: 4, rows: 5 },
        { id: "D", x: 728, y: 272, width: 82, height: 122, cols: 3, rows: 3 },
      ],
      targets: [
        { x: 213, y: 386 },
        { x: 386, y: 382 },
        { x: 589, y: 382 },
        { x: 770, y: 386 },
      ],
    },
    {
      name: "Stage 3",
      pods: 4,
      planeSpeed: 122,
      podRadius: 5,
      drillRadius: 8.5,
      targetScale: 0.5,
      targetHitRadius: 4,
      bonusPerPod: 60,
      buildings: [
        { id: "A", x: 188, y: 206, width: 90, height: 188, cols: 3, rows: 5, healthScale: 1.08 },
        { id: "B", x: 352, y: 230, width: 108, height: 164, cols: 4, rows: 4 },
        { id: "C", x: 548, y: 182, width: 118, height: 212, cols: 4, rows: 6, healthScale: 1.1 },
        { id: "D", x: 732, y: 244, width: 92, height: 150, cols: 3, rows: 4 },
      ],
      targets: [
        { x: 232, y: 383 },
        { x: 405, y: 386 },
        { x: 604, y: 378 },
        { x: 778, y: 384 },
      ],
    },
  ];

  function makeLevel(stageIndex, score) {
    const level = LEVELS[stageIndex];
    const buildings = level.buildings.map((building) =>
      createBuilding(
        building.id,
        building.x,
        building.y,
        building.width,
        building.height,
        building.cols,
        building.rows,
        building.healthScale || 1
      )
    );

    const targets = level.targets.map((target, index) => ({
      id: `s${stageIndex + 1}-t${index + 1}`,
      x: target.x,
      y: target.y,
      scale: level.targetScale,
      hitRadius: level.targetHitRadius,
      alive: true,
    }));

    return {
      stageIndex,
      stageStartScore: score,
      level,
      buildings,
      targets,
      podsLeft: level.pods,
      score,
      shots: [],
      activePods: [],
      pendingDrop: null,
      fx: [],
      finished: false,
      advanceAt: 0,
      messageUntil: 0,
      cameraKick: 0,
    };
  }

  function createBuilding(id, x, y, width, height, cols, rows, healthScale) {
    const blocks = [];
    const bw = width / cols;
    const bh = height / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const block = {
          id: `${id}-${col}-${row}`,
          x: x + col * bw,
          y: y + row * bh,
          width: bw,
          height: bh,
          health: (row === rows - 1 ? 60 : 42) * healthScale,
          maxHealth: (row === rows - 1 ? 60 : 42) * healthScale,
          destroyed: false,
        };
        blocks.push(block);
      }
    }

    return { id, x, y, width, height, cols, rows, blocks };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function circleRectIntersects(cx, cy, radius, rect) {
    const nx = clamp(cx, rect.x, rect.x + rect.width);
    const ny = clamp(cy, rect.y, rect.y + rect.height);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= radius * radius;
  }

  function drawStickFigure(graphics, x, y, color, alpha, scale) {
    const s = scale || 1;
    graphics.lineStyle(Math.max(1.4, 3 * s), color, alpha);
    graphics.strokeCircle(x, y - 20 * s, 6 * s);
    graphics.beginPath();
    graphics.moveTo(x, y - 14 * s);
    graphics.lineTo(x, y + 4 * s);
    graphics.moveTo(x - 10 * s, y - 7 * s);
    graphics.lineTo(x + 10 * s, y - 7 * s);
    graphics.moveTo(x, y + 4 * s);
    graphics.lineTo(x - 9 * s, y + 17 * s);
    graphics.moveTo(x, y + 4 * s);
    graphics.lineTo(x + 9 * s, y + 17 * s);
    graphics.strokePath();
  }

  function drawPlane(graphics, x, y, scale, banking) {
    graphics.save();
    graphics.translateCanvas(x, y);
    graphics.rotateCanvas(banking);
    graphics.scaleCanvas(scale, scale);

    graphics.fillStyle(0xf5f8fb, 1);
    graphics.fillRoundedRect(-54, -11, 92, 22, 10);
    graphics.fillStyle(0xd7e0e7, 1);
    graphics.fillTriangle(-8, -9, 30, -48, 48, -8);
    graphics.fillTriangle(-4, 9, 26, 45, 42, 8);
    graphics.fillStyle(0x4e6f85, 1);
    graphics.fillTriangle(-48, -10, -72, -36, -42, 0);
    graphics.fillTriangle(-48, 10, -72, 36, -42, 0);
    graphics.fillStyle(0x2f91c2, 1);
    graphics.fillRoundedRect(8, -7, 18, 14, 6);
    graphics.fillStyle(0xffcc4d, 1);
    graphics.fillCircle(46, 0, 5);

    graphics.restore();
  }

  class SkyDrillScene extends Phaser.Scene {
    constructor() {
      super("SkyDrillScene");
      this.state = makeLevel(0, 0);
      this.plane = { x: -90, y: 78, speed: this.state.level.planeSpeed, banking: 0 };
      this.elapsed = 0;
      this.lastHud = "";
    }

    create() {
      this.bg = this.add.graphics();
      this.map = this.add.graphics();
      this.dynamic = this.add.graphics();
      this.fx = this.add.graphics();
      this.trajectory = this.add.graphics();
      this.drawBackground();
      this.wireControls();
      this.refreshHud(true);
      this.showMessage("Stage 1: precision range active");
    }

    wireControls() {
      const updateReadouts = () => {
        els.angleOut.textContent = `${Number(els.angle.value)} deg`;
        els.speedOut.textContent = `${Number(els.speed.value)}`;
        els.delayOut.textContent = `${Number(els.delay.value).toFixed(2)} s`;
      };

      ["input", "change"].forEach((eventName) => {
        els.angle.addEventListener(eventName, updateReadouts);
        els.speed.addEventListener(eventName, updateReadouts);
        els.delay.addEventListener(eventName, updateReadouts);
      });

      els.drop.addEventListener("click", () => this.queueDrop());
      els.reset.addEventListener("click", () => this.resetLevel());

      this.input.keyboard.on("keydown-SPACE", () => this.queueDrop());
      this.input.keyboard.on("keydown-R", () => this.resetLevel());
      updateReadouts();
    }

    resetLevel() {
      this.loadStage(this.state.stageIndex, this.state.stageStartScore, `${this.state.level.name} reset`);
    }

    loadStage(stageIndex, carryScore, message) {
      this.state = makeLevel(stageIndex, carryScore);
      this.plane.x = -90;
      this.plane.y = 78;
      this.plane.speed = this.state.level.planeSpeed;
      this.elapsed = 0;
      els.drop.disabled = false;
      this.showMessage(message || `${this.state.level.name}: precision range active`);
      this.refreshHud(true);
    }

    queueDrop() {
      if (this.state.finished || this.state.pendingDrop || this.state.activePods.length > 0) {
        return;
      }

      if (this.state.podsLeft <= 0) {
        this.showMessage("No pods left");
        return;
      }

      const delay = Number(els.delay.value);
      this.state.pendingDrop = {
        releaseAt: this.elapsed + delay,
        startX: this.plane.x,
        startY: this.plane.y,
        delay,
      };
      els.drop.disabled = true;
      this.showMessage("Drop armed");
    }

    releasePod() {
      const angleDeg = Number(els.angle.value);
      const speed = Number(els.speed.value);
      const radians = Phaser.Math.DegToRad(angleDeg);
      const level = this.state.level;
      const pod = {
        x: this.plane.x,
        y: this.plane.y + 18,
        prevX: this.plane.x,
        prevY: this.plane.y + 18,
        vx: this.plane.speed + Math.sin(radians) * speed * 0.68,
        vy: Math.cos(radians) * speed,
        radius: level.podRadius,
        drillRadius: level.drillRadius,
        energy: speed * 0.76,
        dead: false,
        age: 0,
        trail: [],
      };
      this.state.podsLeft -= 1;
      this.state.pendingDrop = null;
      this.state.activePods.push(pod);
      this.refreshHud(true);
    }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.033);
      this.elapsed += dt;
      this.updatePlane(dt);
      this.updatePendingDrop();
      this.updatePods(dt);
      this.updateFx(dt);
      this.updateStageAdvance();
      this.drawState();
      this.refreshHud();
      this.updateMessage();
    }

    updatePlane(dt) {
      this.plane.x += this.plane.speed * dt;
      this.plane.banking = Math.sin(this.elapsed * 1.8) * 0.025;
      if (this.plane.x > WORLD.width + 95) {
        this.plane.x = -95;
      }
    }

    updatePendingDrop() {
      const pending = this.state.pendingDrop;
      if (!pending) {
        return;
      }

      if (this.elapsed >= pending.releaseAt) {
        this.releasePod();
      }
    }

    updateStageAdvance() {
      if (!this.state.advanceAt || this.elapsed < this.state.advanceAt) {
        return;
      }

      const nextStage = this.state.stageIndex + 1;
      if (nextStage < LEVELS.length) {
        this.loadStage(nextStage, this.state.score, `${LEVELS[nextStage].name}: tighter target lane`);
      }
    }

    updatePods(dt) {
      const pods = this.state.activePods;
      for (const pod of pods) {
        pod.prevX = pod.x;
        pod.prevY = pod.y;
        pod.age += dt;
        pod.vy += GRAVITY * dt;
        pod.x += pod.vx * dt;
        pod.y += pod.vy * dt;

        pod.trail.push({ x: pod.x, y: pod.y, life: 0.8 });
        if (pod.trail.length > 38) {
          pod.trail.shift();
        }

        const touched = this.sampleDamage(pod, dt);
        if (touched) {
          pod.energy -= (Number(els.speed.value) * 0.64 + 190) * dt;
          this.state.cameraKick = Math.min(1, this.state.cameraKick + 0.08);
        } else {
          pod.energy -= 22 * dt;
        }

        this.checkTargets(pod);

        if (pod.y > MAP.y + MAP.height + 55 || pod.x < -80 || pod.x > WORLD.width + 80 || pod.energy <= 0) {
          pod.dead = true;
          this.makeBurst(pod.x, pod.y, pod.energy <= 0 ? palette.pod : palette.smoke, 7, 0.62);
        }
      }

      this.state.activePods = pods.filter((pod) => !pod.dead);
      const canDrop =
        !this.state.finished &&
        !this.state.pendingDrop &&
        this.state.activePods.length === 0 &&
        this.state.podsLeft > 0;
      els.drop.disabled = !canDrop;

      if (!this.state.finished && this.state.activePods.length === 0 && this.state.podsLeft <= 0) {
        const alive = this.state.targets.some((target) => target.alive);
        if (alive) {
          this.state.finished = true;
          this.showMessage(`${this.state.level.name} failed - reset to retry`);
        }
      }
    }

    sampleDamage(pod, dt) {
      const dx = pod.x - pod.prevX;
      const dy = pod.y - pod.prevY;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const steps = Math.ceil(dist / 7);
      let touched = false;

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = pod.prevX + dx * t;
        const y = pod.prevY + dy * t;
        if (this.damageAt(x, y, pod.drillRadius, dt)) {
          touched = true;
        }
        if (y > SURFACE_Y + 12 && x > MAP.x && x < MAP.x + MAP.width) {
          touched = true;
          pod.energy -= 20 * dt;
          this.chipGround(x, y);
        }
      }

      return touched;
    }

    damageAt(x, y, radius, dt) {
      let touched = false;
      for (const building of this.state.buildings) {
        for (const block of building.blocks) {
          if (block.destroyed) {
            continue;
          }
          if (circleRectIntersects(x, y, radius, block)) {
            touched = true;
            const damage = 180 * dt + radius * 0.9;
            block.health -= damage;
            this.state.fx.push({
              x: x + Phaser.Math.Between(-5, 5),
              y: y + Phaser.Math.Between(-5, 5),
              vx: Phaser.Math.Between(-18, 18),
              vy: Phaser.Math.Between(-30, 8),
              life: 0.34,
              maxLife: 0.34,
              size: Phaser.Math.Between(2, 4),
              color: palette.blockCrack,
            });

            if (block.health <= 0) {
              block.destroyed = true;
              this.state.score += 4;
              this.makeBurst(block.x + block.width / 2, block.y + block.height / 2, palette.buildingDark, 5, 0.58);
            }
          }
        }
      }
      return touched;
    }

    chipGround(x, y) {
      if (Math.random() < 0.15) {
        this.state.fx.push({
          x,
          y: Math.min(y, SURFACE_Y + 52),
          vx: Phaser.Math.Between(-32, 32),
          vy: Phaser.Math.Between(-22, 8),
          life: 0.42,
          maxLife: 0.42,
          size: Phaser.Math.Between(2, 4),
          color: palette.islandDark,
        });
      }
    }

    checkTargets(pod) {
      for (const target of this.state.targets) {
        if (!target.alive) {
          continue;
        }

        const distance = Math.hypot(pod.x - target.x, pod.y - (target.y - 8 * target.scale));
        if (distance < pod.drillRadius + target.hitRadius) {
          target.alive = false;
          this.state.score += 120;
          this.makeBurst(target.x, target.y - 14 * target.scale, palette.targetDone, 10, 0.58);
          this.showMessage("Target marked");
        }
      }

      if (!this.state.finished && this.state.targets.every((target) => !target.alive)) {
        this.state.finished = true;
        this.state.score += this.state.podsLeft * this.state.level.bonusPerPod;
        if (this.state.stageIndex < LEVELS.length - 1) {
          this.state.advanceAt = this.elapsed + 1.65;
          this.showMessage(`${this.state.level.name} clear`);
        } else {
          this.showMessage("All stages clear");
        }
      }
    }

    makeBurst(x, y, color, count, sizeScale) {
      const scale = sizeScale || 1;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(24, 86) * scale;
        this.state.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: Phaser.Math.FloatBetween(0.28, 0.62),
          maxLife: 0.62,
          size: Phaser.Math.Between(2, 5) * scale,
          color,
        });
      }
    }

    updateFx(dt) {
      for (const particle of this.state.fx) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 110 * dt;
      }
      this.state.fx = this.state.fx.filter((particle) => particle.life > 0);

      if (this.state.cameraKick > 0) {
        this.state.cameraKick = Math.max(0, this.state.cameraKick - dt * 2.8);
        const shake = this.state.cameraKick * 4;
        this.cameras.main.setScroll(
          Math.sin(this.elapsed * 80) * shake,
          Math.cos(this.elapsed * 70) * shake
        );
      } else {
        this.cameras.main.setScroll(0, 0);
      }
    }

    drawBackground() {
      this.bg.clear();

      this.bg.fillGradientStyle(palette.skyTop, palette.skyTop, palette.skyMid, palette.skyMid, 1);
      this.bg.fillRect(0, 0, WORLD.width, WORLD.height);

      this.bg.fillStyle(0xffffff, 0.18);
      this.bg.fillEllipse(130, 78, 96, 28);
      this.bg.fillEllipse(186, 68, 128, 34);
      this.bg.fillEllipse(760, 94, 130, 30);
      this.bg.fillEllipse(820, 80, 90, 26);

      this.bg.fillStyle(palette.sea, 1);
      this.bg.fillRect(MAP.x - 22, MAP.y - 18, MAP.width + 44, MAP.height + 40);
      this.bg.lineStyle(3, 0xf4f7f9, 0.42);
      this.bg.strokeRoundedRect(MAP.x - 22, MAP.y - 18, MAP.width + 44, MAP.height + 40, 12);

      this.bg.fillStyle(palette.island, 1);
      this.bg.fillRoundedRect(MAP.x, MAP.y, MAP.width, MAP.height, 8);
      this.bg.fillStyle(0x7ecb98, 0.72);
      this.bg.fillEllipse(MAP.x + 128, MAP.y + 102, 180, 90);
      this.bg.fillEllipse(MAP.x + 684, MAP.y + 224, 240, 116);
      this.bg.fillStyle(0x358963, 0.58);
      this.bg.fillEllipse(MAP.x + 720, MAP.y + 88, 170, 72);

      this.bg.lineStyle(10, palette.road, 0.9);
      this.bg.beginPath();
      this.bg.moveTo(MAP.x + 28, SURFACE_Y + 28);
      this.bg.lineTo(MAP.x + 260, SURFACE_Y + 2);
      this.bg.lineTo(MAP.x + 460, SURFACE_Y + 28);
      this.bg.lineTo(MAP.x + 680, SURFACE_Y + 10);
      this.bg.lineTo(MAP.x + MAP.width - 32, SURFACE_Y + 24);
      this.bg.strokePath();

      this.bg.lineStyle(2, 0xffffff, 0.08);
      for (let x = MAP.x + 42; x < MAP.x + MAP.width; x += 64) {
        this.bg.lineBetween(x, MAP.y + 26, x + 30, MAP.y + MAP.height - 26);
      }
    }

    drawState() {
      this.map.clear();
      this.dynamic.clear();
      this.fx.clear();
      this.trajectory.clear();

      this.drawAimPreview();
      this.drawBasements();
      this.drawBuildings();
      this.drawTargets();
      this.drawFx();
      drawPlane(this.dynamic, this.plane.x, this.plane.y, 0.62, this.plane.banking);
      this.drawPods();
      this.drawPendingDrop();
    }

    drawAimPreview() {
      if (this.state.finished || this.state.activePods.length > 0) {
        return;
      }

      const delay = Number(els.delay.value);
      const angleDeg = Number(els.angle.value);
      const speed = Number(els.speed.value);
      const futureX = this.wrapPlaneX(this.plane.x + this.plane.speed * delay);
      const futureY = this.plane.y + 18;
      const radians = Phaser.Math.DegToRad(angleDeg);
      let x = futureX;
      let y = futureY;
      let vx = this.plane.speed + Math.sin(radians) * speed * 0.68;
      let vy = Math.cos(radians) * speed;

      this.trajectory.lineStyle(1, palette.pod, 0.28);
      this.trajectory.beginPath();
      this.trajectory.moveTo(x, y);
      for (let i = 0; i < 42; i += 1) {
        vy += GRAVITY * 0.035;
        x += vx * 0.035;
        y += vy * 0.035;
        if (i % 2 === 0) {
          this.trajectory.lineTo(x, y);
        } else {
          this.trajectory.moveTo(x, y);
        }
        if (y > MAP.y + MAP.height || x > WORLD.width + 80 || x < -80) {
          break;
        }
      }
      this.trajectory.strokePath();
      this.trajectory.fillStyle(palette.pod, 0.6);
      this.trajectory.fillCircle(futureX, futureY, 3);
    }

    wrapPlaneX(x) {
      const span = WORLD.width + 190;
      let wrapped = x + 95;
      wrapped %= span;
      if (wrapped < 0) {
        wrapped += span;
      }
      return wrapped - 95;
    }

    drawBasements() {
      this.map.fillStyle(0x1d2a2b, 0.78);
      this.map.fillRoundedRect(MAP.x + 116, SURFACE_Y - 8, 690, 56, 6);
      this.map.lineStyle(2, 0x9bd29e, 0.25);
      this.map.strokeRoundedRect(MAP.x + 116, SURFACE_Y - 8, 690, 56, 6);
      this.map.fillStyle(0x0f171b, 0.4);
      for (let x = MAP.x + 150; x < MAP.x + 770; x += 84) {
        this.map.fillRect(x, SURFACE_Y - 7, 3, 55);
      }
    }

    drawBuildings() {
      for (const building of this.state.buildings) {
        this.map.fillStyle(0x313c44, 0.45);
        this.map.fillRect(building.x + 8, building.y + 10, building.width, building.height);

        for (const block of building.blocks) {
          if (block.destroyed) {
            this.map.lineStyle(1, palette.blockCrack, 0.18);
            this.map.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
            continue;
          }

          const health = clamp(block.health / block.maxHealth, 0, 1);
          const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(palette.buildingDark),
            Phaser.Display.Color.ValueToColor(palette.building),
            100,
            Math.floor(health * 100)
          );
          const hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

          this.map.fillStyle(hex, 1);
          this.map.fillRect(block.x, block.y, block.width - 1.5, block.height - 1.5);
          this.map.lineStyle(1, 0xffffff, 0.12);
          this.map.strokeRect(block.x + 0.5, block.y + 0.5, block.width - 2.5, block.height - 2.5);

          if (health < 0.75) {
            this.map.lineStyle(2, palette.blockCrack, 0.42);
            this.map.lineBetween(block.x + 8, block.y + 8, block.x + block.width - 10, block.y + block.height - 12);
          }

          if (block.height > 30) {
            this.map.fillStyle(0x365d72, 0.58);
            this.map.fillRect(block.x + block.width * 0.28, block.y + 9, block.width * 0.18, 12);
            this.map.fillRect(block.x + block.width * 0.58, block.y + 9, block.width * 0.18, 12);
          }
        }

        this.map.fillStyle(0x434e58, 1);
        this.map.fillRect(building.x - 8, building.y - 12, building.width + 16, 12);
        this.map.fillStyle(0x788591, 1);
        this.map.fillTriangle(building.x - 12, building.y - 12, building.x + 20, building.y - 32, building.x + 52, building.y - 12);
      }
    }

    drawTargets() {
      for (const target of this.state.targets) {
        const color = target.alive ? palette.target : palette.targetDone;
        const alpha = target.alive ? 1 : 0.52;
        const s = target.scale;
        const boxW = 30 * s + 8;
        const boxH = 54 * s + 8;
        this.map.fillStyle(0x0b1117, target.alive ? 0.72 : 0.38);
        this.map.fillRoundedRect(target.x - boxW / 2, target.y - boxH + 10 * s, boxW, boxH, 4);
        this.map.lineStyle(1, color, target.alive ? 0.42 : 0.24);
        this.map.strokeCircle(target.x, target.y - 8 * s, target.hitRadius);
        drawStickFigure(this.map, target.x, target.y, color, alpha, s);
      }
    }

    drawPods() {
      for (const pod of this.state.activePods) {
        for (let i = 0; i < pod.trail.length; i += 1) {
          const point = pod.trail[i];
          const a = i / pod.trail.length;
          this.dynamic.fillStyle(palette.pod, 0.06 + a * 0.16);
          this.dynamic.fillCircle(point.x, point.y, 1.2 + a * pod.radius * 0.54);
        }

        const rotation = Math.atan2(pod.vy, pod.vx);
        const r = pod.radius;
        this.dynamic.save();
        this.dynamic.translateCanvas(pod.x, pod.y);
        this.dynamic.rotateCanvas(rotation);
        this.dynamic.fillStyle(palette.pod, 1);
        this.dynamic.fillRoundedRect(-1.45 * r, -0.72 * r, 2.9 * r, 1.44 * r, 3);
        this.dynamic.fillStyle(0x1a2027, 1);
        this.dynamic.fillTriangle(1.18 * r, -0.88 * r, 2.4 * r, 0, 1.18 * r, 0.88 * r);
        this.dynamic.restore();
      }
    }

    drawPendingDrop() {
      const pending = this.state.pendingDrop;
      if (!pending) {
        return;
      }
      const remaining = Math.max(0, pending.releaseAt - this.elapsed);
      const progress = 1 - remaining / Math.max(0.001, pending.delay);
      const x = this.wrapPlaneX(pending.startX + this.plane.speed * pending.delay);
      const y = this.plane.y + 18;
      this.dynamic.lineStyle(2, palette.pod, 0.8);
      this.dynamic.strokeCircle(x, y, 8 + progress * 10);
      this.dynamic.fillStyle(palette.pod, 0.9);
      this.dynamic.fillCircle(x, y, 3);
    }

    drawFx() {
      for (const particle of this.state.fx) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        this.fx.fillStyle(particle.color, alpha);
        this.fx.fillCircle(particle.x, particle.y, particle.size * alpha);
      }
    }

    showMessage(text) {
      els.message.textContent = text;
      els.message.classList.add("is-visible");
      this.state.messageUntil = this.elapsed + 1.8;
    }

    updateMessage() {
      if (this.state.messageUntil && this.elapsed > this.state.messageUntil) {
        els.message.classList.remove("is-visible");
        this.state.messageUntil = 0;
      }
    }

    refreshHud(force) {
      const marked = this.state.targets.filter((target) => !target.alive).length;
      const total = this.state.targets.length;
      const hud = `${this.state.stageIndex}|${marked}/${total}|${this.state.podsLeft}|${this.state.score}`;
      if (!force && hud === this.lastHud) {
        return;
      }
      this.lastHud = hud;
      els.stage.textContent = `${this.state.stageIndex + 1}/${LEVELS.length}`;
      els.targets.textContent = `${marked}/${total}`;
      els.pods.textContent = `${this.state.podsLeft}`;
      els.score.textContent = `${this.state.score}`;
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: "#152331",
    scene: SkyDrillScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
  });

  window.skyDrill = { game };
})();

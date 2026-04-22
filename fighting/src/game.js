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
    controls: document.getElementById("drop-controls"),
    angle: document.getElementById("angle-input"),
    angleOut: document.getElementById("angle-output"),
    speed: document.getElementById("speed-input"),
    speedOut: document.getElementById("speed-output"),
    delay: document.getElementById("delay-input"),
    delayOut: document.getElementById("delay-output"),
    drop: document.getElementById("drop-button"),
    reset: document.getElementById("reset-button"),
    bombConfig: document.getElementById("bomb-config-button"),
    bombPanel: document.getElementById("bomb-panel"),
    bombClose: document.getElementById("bomb-close-button"),
    bombSummary: document.getElementById("bomb-summary"),
    scopeButtons: Array.from(document.querySelectorAll("[data-scope]")),
    typeButtons: Array.from(document.querySelectorAll("[data-bomb-type]")),
    fuse: document.getElementById("fuse-input"),
    fuseOut: document.getElementById("fuse-output"),
    blast: document.getElementById("blast-input"),
    blastOut: document.getElementById("blast-output"),
    drillWalls: document.getElementById("drill-walls-input"),
    drillWallsOut: document.getElementById("drill-walls-output"),
    bounceCount: document.getElementById("bounce-count-input"),
    bounceCountOut: document.getElementById("bounce-count-output"),
    stageLabel: document.getElementById("stage-label"),
    stage: document.getElementById("stage-value"),
    targetsLabel: document.getElementById("targets-label"),
    targets: document.getElementById("targets-value"),
    podsLabel: document.getElementById("pods-label"),
    pods: document.getElementById("pods-value"),
    scoreLabel: document.getElementById("score-label"),
    score: document.getElementById("score-value"),
    skip: document.getElementById("skip-button"),
    statusToggle: document.getElementById("status-toggle-button"),
    statusPanel: document.getElementById("status-panel"),
    touchControls: document.getElementById("touch-controls"),
    movePad: document.getElementById("move-pad"),
    movePadKnob: document.getElementById("move-pad-knob"),
    firePad: document.getElementById("fire-pad"),
    firePadKnob: document.getElementById("fire-pad-knob"),
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
    blast: 0xff9c4a,
    shock: 0xfff1a8,
    river: 0x197ea0,
    riverDark: 0x0d4c68,
    bank: 0x536a42,
    mountain: 0x5f655e,
    dark: 0x101820,
  };

  const DEFAULT_BOMB_CONFIG = {
    type: "drill",
    fuse: 1.35,
    blastRadius: 42,
    drillWalls: 3,
    bounceCount: 1,
  };

  const BOMB_LABELS = {
    drill: "Drill",
    bounce: "Bounce",
    timer: "Timer",
  };

  const CHAPTER1_LEVELS = [
    {
      name: "Chapter 1-1",
      pods: 1,
      planeSpeed: 92,
      podRadius: 6,
      drillRadius: 10.5,
      targetScale: 0.58,
      targetHitRadius: 5,
      bonusPerPod: 45,
      buildings: [{ id: "A", x: 418, y: 226, width: 120, height: 168, cols: 4, rows: 5 }],
      targets: [{ x: 478, y: 384 }],
    },
    {
      name: "Chapter 1-2",
      pods: 1,
      planeSpeed: 98,
      podRadius: 6,
      drillRadius: 10,
      targetScale: 0.56,
      targetHitRadius: 4.8,
      bonusPerPod: 50,
      buildings: [{ id: "A", x: 346, y: 202, width: 142, height: 192, cols: 5, rows: 5 }],
      targets: [{ x: 418, y: 382 }],
    },
    {
      name: "Chapter 1-3",
      pods: 1,
      planeSpeed: 104,
      podRadius: 5.8,
      drillRadius: 9.5,
      targetScale: 0.54,
      targetHitRadius: 4.5,
      bonusPerPod: 55,
      buildings: [{ id: "A", x: 566, y: 216, width: 128, height: 178, cols: 4, rows: 5 }],
      targets: [{ x: 628, y: 382 }],
    },
    {
      name: "Chapter 1-4",
      pods: 2,
      planeSpeed: 108,
      podRadius: 5.6,
      drillRadius: 9.2,
      targetScale: 0.52,
      targetHitRadius: 4.2,
      bonusPerPod: 60,
      buildings: [{ id: "A", x: 362, y: 196, width: 176, height: 198, cols: 6, rows: 5 }],
      targets: [
        { x: 405, y: 382 },
        { x: 456, y: 382 },
        { x: 508, y: 382 },
      ],
    },
    {
      name: "Chapter 1-5",
      pods: 3,
      planeSpeed: 114,
      podRadius: 5.2,
      drillRadius: 8.8,
      targetScale: 0.5,
      targetHitRadius: 4,
      bonusPerPod: 70,
      buildings: [{ id: "A", x: 320, y: 178, width: 230, height: 216, cols: 7, rows: 6, healthScale: 1.06 }],
      targets: [
        { x: 360, y: 382 },
        { x: 398, y: 382 },
        { x: 436, y: 382 },
        { x: 474, y: 382 },
        { x: 512, y: 382 },
        { x: 455, y: 350 },
      ],
    },
    {
      name: "Chapter 1-6",
      pods: 5,
      planeSpeed: 122,
      podRadius: 5,
      drillRadius: 8.5,
      targetScale: 0.48,
      targetHitRadius: 3.8,
      bonusPerPod: 85,
      buildings: [{ id: "A", x: 278, y: 166, width: 304, height: 228, cols: 8, rows: 6, healthScale: 1.12 }],
      targets: [
        { x: 324, y: 382 },
        { x: 362, y: 382 },
        { x: 400, y: 382 },
        { x: 438, y: 382 },
        { x: 476, y: 382 },
        { x: 514, y: 382 },
        { x: 344, y: 350 },
        { x: 402, y: 350 },
        { x: 460, y: 350 },
        { x: 518, y: 350 },
      ],
    },
  ];

  const SHIP_LEVELS = [
    { name: "Chapter 2-1", duration: 34, guns: 4, mines: 5, bulletRate: 1.45, riverSpeed: 76 },
    { name: "Chapter 2-2", duration: 42, guns: 6, mines: 7, bulletRate: 1.15, riverSpeed: 88 },
    { name: "Chapter 2-3", duration: 50, guns: 8, mines: 9, bulletRate: 0.95, riverSpeed: 102 },
  ];

  const SHIP_CENTER = { x: WORLD.width / 2, y: 316 };
  const SHIP_LIMITS = { left: 242, right: 718, top: 148, bottom: 458 };
  const SHIP_MOVE_SPEED = 218;
  const SHIP_FIRE_RATE = 0.18;
  const SHIP_BULLET_SPEED = 780;

  const HELI_LEVELS = [
    { name: "Chapter 3-1", duration: 42, holes: 8, missileRate: 2.8 },
    { name: "Chapter 3-2", duration: 50, holes: 10, missileRate: 2.25 },
    { name: "Chapter 3-3", duration: 58, holes: 12, missileRate: 1.85 },
  ];

  const HELI_BASE = { x: WORLD.width / 2, y: 462 };
  const HELI_LIMITS = { left: 268, right: 692, top: 350, bottom: 500 };
  const HELI_MOVE_SPEED = 236;
  const HELI_FIRE_RATE = 0.18;

  function cloneBombConfig(config) {
    return {
      type: config.type,
      fuse: config.fuse,
      blastRadius: config.blastRadius,
      drillWalls: config.drillWalls,
      bounceCount: config.bounceCount,
    };
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

  function pointSegmentDistance(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const lenSq = vx * vx + vy * vy || 1;
    const t = clamp(((px - ax) * vx + (py - ay) * vy) / lenSq, 0, 1);
    const x = ax + vx * t;
    const y = ay + vy * t;
    return Math.hypot(px - x, py - y);
  }

  function turnToward(current, target, maxTurn) {
    let delta = target - current;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return current + clamp(delta, -maxTurn, maxTurn);
  }

  function createBuilding(id, x, y, width, height, cols, rows, healthScale) {
    const blocks = [];
    const bw = width / cols;
    const bh = height / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const health = (row === rows - 1 ? 86 : 43) * healthScale;
        blocks.push({
          id: `${id}-${col}-${row}`,
          x: x + col * bw,
          y: y + row * bh,
          width: bw,
          height: bh,
          row,
          rows,
          health,
          maxHealth: health,
          destroyed: false,
        });
      }
    }
    return { id, x, y, width, height, cols, rows, blocks };
  }

  function makeBombingLevel(levelIndex, score) {
    const level = CHAPTER1_LEVELS[levelIndex];
    return {
      levelIndex,
      levelStartScore: score,
      level,
      buildings: level.buildings.map((building) =>
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
      ),
      targets: level.targets.map((target, index) => ({
        id: `c1-${levelIndex + 1}-${index + 1}`,
        x: target.x,
        y: target.y,
        scale: level.targetScale,
        hitRadius: level.targetHitRadius,
        alive: true,
      })),
      podsLeft: level.pods,
      score,
      activePods: [],
      pendingDrop: null,
      fx: [],
      blastRings: [],
      finished: false,
      advanceAt: 0,
      messageUntil: 0,
      cameraKick: 0,
    };
  }

  function drawStickFigure(graphics, x, y, color, alpha, scale) {
    const s = scale || 1;
    graphics.lineStyle(Math.max(1.3, 3 * s), color, alpha);
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
    graphics.fillStyle(palette.pod, 1);
    graphics.fillCircle(46, 0, 5);
    graphics.restore();
  }

  class SkyDrillScene extends Phaser.Scene {
    constructor() {
      super("SkyDrillScene");
      this.mode = "bombing";
      this.score = 0;
      this.bombing = makeBombingLevel(0, 0);
      this.ship = null;
      this.heli = null;
      this.plane = { x: -90, y: 78, speed: this.bombing.level.planeSpeed, banking: 0 };
      this.bombScope = "all";
      this.globalBombConfig = cloneBombConfig(DEFAULT_BOMB_CONFIG);
      this.nextBombConfig = null;
      this.movePad = { x: 0, y: 0, active: false };
      this.firePad = { x: 0, y: -1, active: false };
      this.elapsed = 0;
      this.lastHud = "";
    }

    preload() {
      this.load.image("bg-bombing", "assets/chapter1-bombing-bg.png");
      this.load.image("bg-ship", "assets/chapter2-canal-bg.png");
      this.load.image("bg-ship-bank-left", "assets/chapter2-left-bank-scroll.png");
      this.load.image("bg-ship-bank-right", "assets/chapter2-right-bank-scroll.png");
      this.load.image("bg-heli", "assets/chapter3-heli-bg.png");
    }

    create() {
      this.chapterBackgrounds = {
        bombing: this.add.image(0, 0, "bg-bombing"),
        ship: this.add.image(0, 0, "bg-ship"),
        heli: this.add.image(0, 0, "bg-heli"),
      };
      Object.values(this.chapterBackgrounds).forEach((image) => {
        image.setOrigin(0, 0);
        image.setDisplaySize(WORLD.width, WORLD.height);
        image.setDepth(-20);
        image.setVisible(false);
      });
      this.shipBankScrolls = {
        left: this.add.tileSprite(0, 0, 300, WORLD.height, "bg-ship-bank-left"),
        right: this.add.tileSprite(WORLD.width - 300, 0, 300, WORLD.height, "bg-ship-bank-right"),
      };
      Object.values(this.shipBankScrolls).forEach((image) => {
        image.setOrigin(0, 0);
        image.setDepth(-19);
        image.setVisible(false);
      });
      this.setChapterBackground("bombing");
      this.bg = this.add.graphics();
      this.map = this.add.graphics();
      this.dynamic = this.add.graphics();
      this.fx = this.add.graphics();
      this.trajectory = this.add.graphics();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D,ONE,TWO");
      this.wireControls();
      this.input.on("pointerdown", (pointer) => this.handlePointer(pointer));
      this.showBombingControls(true);
      this.refreshHud(true);
      this.showMessage("Chapter 1-1: one target, one pod");
    }

    setChapterBackground(mode) {
      if (!this.chapterBackgrounds) {
        return;
      }
      Object.entries(this.chapterBackgrounds).forEach(([key, image]) => {
        image.setVisible(key === mode);
      });
      if (this.shipBankScrolls) {
        Object.values(this.shipBankScrolls).forEach((image) => {
          image.setVisible(mode === "ship");
        });
      }
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
      els.reset.addEventListener("click", () => this.resetCurrentLevel());
      els.skip.addEventListener("click", () => {
        this.toggleStatusPanel(false);
        this.skipCurrentLevel();
      });
      els.statusToggle.addEventListener("click", () => this.toggleStatusPanel());
      els.bombConfig.addEventListener("click", () => this.toggleBombPanel());
      els.bombClose.addEventListener("click", () => this.toggleBombPanel(false));

      els.scopeButtons.forEach((button) => {
        button.addEventListener("click", () => this.setBombScope(button.dataset.scope));
      });
      els.typeButtons.forEach((button) => {
        button.addEventListener("click", () => this.setBombType(button.dataset.bombType));
      });
      [els.fuse, els.blast, els.drillWalls, els.bounceCount].forEach((input) => {
        ["input", "change"].forEach((eventName) => {
          input.addEventListener(eventName, () => this.applyBombInputs());
        });
      });

      this.input.keyboard.on("keydown-SPACE", () => {
        if (this.mode === "bombing") {
          this.queueDrop();
        } else if (this.mode === "ship") {
          this.fireShipGun({ x: 0, y: -1 });
        } else if (this.mode === "heli") {
          this.fireHeliWeapon(WORLD.width / 2, WORLD.height / 2);
        }
      });
      this.input.keyboard.on("keydown-R", () => this.resetCurrentLevel());
      this.input.keyboard.on("keydown-N", () => this.skipCurrentLevel());
      this.input.keyboard.on("keydown-ONE", () => this.setHeliWeapon("gun"));
      this.input.keyboard.on("keydown-TWO", () => this.setHeliWeapon("missile"));
      this.bindTouchPad(els.movePad, els.movePadKnob, this.movePad, false);
      this.bindTouchPad(els.firePad, els.firePadKnob, this.firePad, true);
      updateReadouts();
      this.syncBombUi(this.getEditableBombConfig());
    }

    toggleStatusPanel(force) {
      const open = typeof force === "boolean" ? force : els.statusPanel.hidden;
      els.statusPanel.hidden = !open;
      els.statusToggle.setAttribute("aria-expanded", String(open));
    }

    bindTouchPad(pad, knob, state, keepDirection) {
      const resetKnob = () => {
        knob.style.transform = "translate(-50%, -50%)";
      };
      const setFromEvent = (event) => {
        const rect = pad.getBoundingClientRect();
        const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
        const rawX = event.clientX - (rect.left + rect.width / 2);
        const rawY = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(rawX, rawY);
        const scale = distance > radius ? radius / distance : 1;
        const x = rawX * scale;
        const y = rawY * scale;
        state.x = distance < 6 && keepDirection ? state.x || 0 : x / radius;
        state.y = distance < 6 && keepDirection ? state.y || -1 : y / radius;
        state.active = true;
        knob.style.transform = `translate(calc(-50% + ${x * 0.72}px), calc(-50% + ${y * 0.72}px))`;
      };
      pad.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        pad.setPointerCapture(event.pointerId);
        setFromEvent(event);
      });
      pad.addEventListener("pointermove", (event) => {
        if (pad.hasPointerCapture(event.pointerId)) {
          event.preventDefault();
          setFromEvent(event);
        }
      });
      const release = (event) => {
        if (pad.hasPointerCapture(event.pointerId)) {
          pad.releasePointerCapture(event.pointerId);
        }
        state.active = false;
        if (!keepDirection) {
          state.x = 0;
          state.y = 0;
          resetKnob();
        }
      };
      pad.addEventListener("pointerup", release);
      pad.addEventListener("pointercancel", release);
    }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.033);
      this.elapsed += dt;
      this.bg.clear();
      this.map.clear();
      this.dynamic.clear();
      this.fx.clear();
      this.trajectory.clear();

      if (this.mode === "ship") {
        this.updateShip(dt);
        this.drawShip();
      } else if (this.mode === "heli") {
        this.updateHeli(dt);
        this.drawHeli();
      } else {
        this.updateBombing(dt);
        this.drawBombing();
      }

      this.updateMessage();
      this.refreshHud();
    }

    resetCurrentLevel() {
      if (this.mode === "ship") {
        this.loadShipLevel(this.ship.levelIndex, this.score, `${this.ship.level.name} reset`);
      } else if (this.mode === "heli") {
        this.loadHeliLevel(this.heli.levelIndex, this.score, `${this.heli.level.name} reset`);
      } else {
        this.loadBombingLevel(this.bombing.levelIndex, this.bombing.levelStartScore, `${this.bombing.level.name} reset`);
      }
    }

    skipCurrentLevel() {
      if (this.mode === "ship") {
        const next = this.ship.levelIndex + 1;
        if (next < SHIP_LEVELS.length) {
          this.loadShipLevel(next, this.score, `Skipped to ${SHIP_LEVELS[next].name}`);
        } else {
          this.loadHeliLevel(0, this.score, "Skipped to Chapter 3");
        }
      } else if (this.mode === "heli") {
        const next = this.heli.levelIndex + 1;
        if (next < HELI_LEVELS.length) {
          this.loadHeliLevel(next, this.score, `Skipped to ${HELI_LEVELS[next].name}`);
        } else {
          this.heli.finished = true;
          this.showMessage("Campaign complete");
        }
      } else {
        const next = this.bombing.levelIndex + 1;
        const score = this.bombing.score;
        if (next < CHAPTER1_LEVELS.length) {
          this.loadBombingLevel(next, score, `Skipped to ${CHAPTER1_LEVELS[next].name}`);
        } else {
          this.loadShipLevel(0, score, "Skipped to Chapter 2");
        }
      }
      this.refreshHud(true);
    }

    showBombingControls(visible) {
      els.controls.hidden = !visible;
      document.querySelector(".stage").classList.toggle("is-full-game", !visible);
      this.setTouchControlsMode(visible ? null : this.mode);
      if (!visible) {
        els.bombPanel.hidden = true;
      }
    }

    setTouchControlsMode(mode) {
      const active = mode === "ship" || mode === "heli";
      els.touchControls.hidden = !active;
      els.touchControls.classList.toggle("is-ship", mode === "ship");
      els.touchControls.classList.toggle("is-heli", mode === "heli");
      if (!active) {
        this.movePad.x = 0;
        this.movePad.y = 0;
        this.movePad.active = false;
        this.firePad.active = false;
      }
    }

    showMessage(text) {
      els.message.textContent = text;
      els.message.classList.add("is-visible");
      const state = this.mode === "bombing" ? this.bombing : this.mode === "ship" ? this.ship : this.heli;
      if (state) {
        state.messageUntil = this.elapsed + 2.2;
      }
    }

    updateMessage() {
      const state = this.mode === "bombing" ? this.bombing : this.mode === "ship" ? this.ship : this.heli;
      if (state && state.messageUntil && this.elapsed > state.messageUntil) {
        els.message.classList.remove("is-visible");
        state.messageUntil = 0;
      }
    }

    getEditableBombConfig() {
      if (this.bombScope === "next") {
        if (!this.nextBombConfig) {
          this.nextBombConfig = cloneBombConfig(this.globalBombConfig);
        }
        return this.nextBombConfig;
      }
      return this.globalBombConfig;
    }

    getShotBombConfig() {
      if (this.bombScope === "next" && this.nextBombConfig) {
        const config = cloneBombConfig(this.nextBombConfig);
        this.nextBombConfig = null;
        this.syncBombUi(this.globalBombConfig);
        return config;
      }
      return cloneBombConfig(this.globalBombConfig);
    }

    toggleBombPanel(forceOpen) {
      const open = typeof forceOpen === "boolean" ? forceOpen : els.bombPanel.hidden;
      els.bombPanel.hidden = !open;
    }

    setBombScope(scope) {
      this.bombScope = scope === "next" ? "next" : "all";
      if (this.bombScope === "all") {
        this.nextBombConfig = null;
      }
      this.syncBombUi(this.getEditableBombConfig());
    }

    setBombType(type) {
      const config = this.getEditableBombConfig();
      config.type = BOMB_LABELS[type] ? type : "drill";
      this.syncBombUi(config);
    }

    applyBombInputs() {
      const config = this.getEditableBombConfig();
      config.fuse = Number(els.fuse.value);
      config.blastRadius = Number(els.blast.value);
      config.drillWalls = Number(els.drillWalls.value);
      config.bounceCount = Number(els.bounceCount.value);
      this.syncBombUi(config);
    }

    syncBombUi(config) {
      els.fuse.value = `${config.fuse}`;
      els.blast.value = `${config.blastRadius}`;
      els.drillWalls.value = `${config.drillWalls}`;
      els.bounceCount.value = `${config.bounceCount}`;
      els.fuseOut.textContent = `${config.fuse.toFixed(2)} s`;
      els.blastOut.textContent = `${config.blastRadius}`;
      els.drillWallsOut.textContent = `${config.drillWalls}`;
      els.bounceCountOut.textContent = `${config.bounceCount}`;
      els.typeButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.bombType === config.type);
      });
      els.scopeButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.scope === this.bombScope);
      });
      const scope = this.bombScope === "next" ? "Next pod" : "All pods";
      const detail =
        config.type === "bounce"
          ? `${config.bounceCount} bounce${config.bounceCount === 1 ? "" : "s"}`
          : config.type === "drill"
            ? `${config.drillWalls} wall${config.drillWalls === 1 ? "" : "s"}`
            : `${config.fuse.toFixed(2)} s`;
      els.bombSummary.textContent = `${scope}: ${BOMB_LABELS[config.type]}, ${detail}, blast ${config.blastRadius}`;
    }

    loadBombingLevel(levelIndex, carryScore, message) {
      this.mode = "bombing";
      this.setChapterBackground("bombing");
      this.score = carryScore;
      this.bombing = makeBombingLevel(levelIndex, carryScore);
      this.plane.x = -90;
      this.plane.y = 78;
      this.plane.speed = this.bombing.level.planeSpeed;
      this.elapsed = 0;
      this.showBombingControls(true);
      els.drop.disabled = false;
      this.showMessage(message || `${this.bombing.level.name}: precision drop`);
      this.refreshHud(true);
    }

    queueDrop() {
      const state = this.bombing;
      if (this.mode !== "bombing" || state.finished || state.pendingDrop || state.activePods.length > 0) {
        return;
      }
      if (state.podsLeft <= 0) {
        this.showMessage("No pods left");
        return;
      }
      const delay = Number(els.delay.value);
      state.pendingDrop = {
        releaseAt: this.elapsed + delay,
        startX: this.plane.x,
        delay,
      };
      els.drop.disabled = true;
      this.showMessage("Drop armed");
    }

    releasePod() {
      const angleDeg = Number(els.angle.value);
      const speed = Number(els.speed.value);
      const radians = Phaser.Math.DegToRad(angleDeg);
      const level = this.bombing.level;
      const bombConfig = this.getShotBombConfig();
      const pod = {
        x: this.plane.x,
        y: this.plane.y + 18,
        prevX: this.plane.x,
        prevY: this.plane.y + 18,
        vx: this.plane.speed + Math.sin(radians) * speed * 0.68,
        vy: Math.cos(radians) * speed,
        radius: level.podRadius,
        drillRadius: level.drillRadius,
        energy: speed * 0.78,
        config: bombConfig,
        fuseLeft: bombConfig.fuse,
        piercedWalls: 0,
        bounces: 0,
        groundCooldown: 0,
        dead: false,
        trail: [],
      };
      this.bombing.podsLeft -= 1;
      this.bombing.pendingDrop = null;
      this.bombing.activePods.push(pod);
      this.refreshHud(true);
    }

    updateBombing(dt) {
      const state = this.bombing;
      this.plane.x += this.plane.speed * dt;
      this.plane.banking = Math.sin(this.elapsed * 1.8) * 0.025;
      if (this.plane.x > WORLD.width + 95) {
        this.plane.x = -95;
      }
      if (state.pendingDrop && this.elapsed >= state.pendingDrop.releaseAt) {
        this.releasePod();
      }

      for (const pod of state.activePods) {
        pod.prevX = pod.x;
        pod.prevY = pod.y;
        pod.fuseLeft -= dt;
        pod.groundCooldown = Math.max(0, pod.groundCooldown - dt);
        pod.vy += GRAVITY * dt;
        pod.x += pod.vx * dt;
        pod.y += pod.vy * dt;
        pod.trail.push({ x: pod.x, y: pod.y });
        if (pod.trail.length > 34) {
          pod.trail.shift();
        }

        const contact = this.sampleDamage(pod, dt);
        if (pod.dead) {
          continue;
        }
        pod.energy -= contact.touched ? (Number(els.speed.value) * 0.64 + 190) * dt : 22 * dt;

        if (pod.config.type === "drill" && pod.piercedWalls >= pod.config.drillWalls) {
          this.explodePod(pod, "drill");
          continue;
        }
        if (pod.fuseLeft <= 0) {
          this.explodePod(pod, "fuse");
          continue;
        }

        this.checkTargetsByDrill(pod);
        if (pod.y > MAP.y + MAP.height + 55 || pod.x < -80 || pod.x > WORLD.width + 80 || pod.energy <= 0) {
          if (pod.energy <= 0 && pod.x > MAP.x && pod.x < MAP.x + MAP.width) {
            this.explodePod(pod, "energy");
          } else {
            pod.dead = true;
            this.makeBurst(state, pod.x, pod.y, pod.energy <= 0 ? palette.pod : palette.smoke, 7, 0.62);
          }
        }
      }

      state.activePods = state.activePods.filter((pod) => !pod.dead);
      els.drop.disabled =
        state.finished || state.pendingDrop || state.activePods.length > 0 || state.podsLeft <= 0;

      if (!state.finished && state.activePods.length === 0 && state.podsLeft <= 0) {
        if (state.targets.some((target) => target.alive)) {
          state.finished = true;
          this.showMessage(`${state.level.name} failed - press R`);
        }
      }

      for (const particle of state.fx) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 110 * dt;
      }
      state.fx = state.fx.filter((particle) => particle.life > 0);
      for (const ring of state.blastRings) {
        ring.life -= dt;
      }
      state.blastRings = state.blastRings.filter((ring) => ring.life > 0);

      if (state.advanceAt && this.elapsed >= state.advanceAt) {
        const next = state.levelIndex + 1;
        if (next < CHAPTER1_LEVELS.length) {
          this.loadBombingLevel(next, state.score, `${CHAPTER1_LEVELS[next].name}: efficient pods`);
        } else {
          this.loadShipLevel(0, state.score, "Chapter 2: steer through the canal");
        }
      }
    }

    sampleDamage(pod, dt) {
      const dx = pod.x - pod.prevX;
      const dy = pod.y - pod.prevY;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const steps = Math.ceil(dist / 7);
      const contact = { touched: false };
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = pod.prevX + dx * t;
        const y = pod.prevY + dy * t;
        const hit = this.damageAt(x, y, pod.drillRadius, 180 * dt + pod.drillRadius * 0.9, "drill");
        if (hit.touched) {
          contact.touched = true;
          pod.piercedWalls += hit.destroyed;
        }
        if (y > SURFACE_Y + 12 && x > MAP.x && x < MAP.x + MAP.width) {
          contact.touched = true;
          this.handleLandContact(pod, x, y, dt);
          if (pod.dead) {
            break;
          }
        }
      }
      return contact;
    }

    damageAt(x, y, radius, damage, source) {
      const contact = { touched: false, destroyed: 0 };
      for (const building of this.bombing.buildings) {
        for (const block of building.blocks) {
          if (block.destroyed || !circleRectIntersects(x, y, radius, block)) {
            continue;
          }
          contact.touched = true;
          block.health -= damage;
          if (source !== "blast") {
            this.bombing.fx.push({
              x: x + Phaser.Math.Between(-5, 5),
              y: y + Phaser.Math.Between(-5, 5),
              vx: Phaser.Math.Between(-18, 18),
              vy: Phaser.Math.Between(-30, 8),
              life: 0.34,
              maxLife: 0.34,
              size: Phaser.Math.Between(2, 4),
              color: palette.blockCrack,
            });
          }
          if (block.health <= 0) {
            block.destroyed = true;
            contact.destroyed += 1;
            this.bombing.score += source === "blast" ? 6 : 4;
            this.score = this.bombing.score;
            this.makeBurst(this.bombing, block.x + block.width / 2, block.y + block.height / 2, palette.buildingDark, 5, 0.45);
          }
        }
      }
      return contact;
    }

    handleLandContact(pod, x, y, dt) {
      if (Math.random() < 0.16) {
        this.bombing.fx.push({
          x,
          y: Math.min(y, SURFACE_Y + 52),
          vx: Phaser.Math.Between(-28, 28),
          vy: Phaser.Math.Between(-20, 8),
          life: 0.42,
          maxLife: 0.42,
          size: Phaser.Math.Between(2, 4),
          color: palette.islandDark,
        });
      }

      if (pod.config.type === "bounce") {
        if (pod.groundCooldown > 0) {
          return;
        }
        pod.x = x;
        pod.y = SURFACE_Y - pod.radius - 2;
        pod.vx *= 0.72;
        pod.vy = -Math.abs(pod.vy) * (0.34 + pod.bounces * 0.07);
        pod.bounces += 1;
        pod.groundCooldown = 0.18;
        if (pod.bounces >= pod.config.bounceCount) {
          pod.fuseLeft = Math.min(pod.fuseLeft, 0.25);
        }
        return;
      }
      if (pod.config.type === "timer") {
        pod.fuseLeft = Math.min(pod.fuseLeft, 0.12);
      }
      pod.energy -= pod.config.type === "drill" ? 18 * dt : 36 * dt;
    }

    checkTargetsByDrill(pod) {
      for (const target of this.bombing.targets) {
        if (!target.alive) {
          continue;
        }
        const distance = Math.hypot(pod.x - target.x, pod.y - (target.y - 8 * target.scale));
        if (distance < pod.drillRadius + target.hitRadius) {
          this.markBombingTarget(target);
        }
      }
      this.checkBombingClear();
    }

    markBombingTarget(target) {
      target.alive = false;
      this.bombing.score += 120;
      this.score = this.bombing.score;
      this.makeBurst(this.bombing, target.x, target.y - 14 * target.scale, palette.targetDone, 10, 0.58);
      this.showMessage("Target marked");
    }

    explodePod(pod, reason) {
      if (pod.dead) {
        return;
      }
      pod.dead = true;
      const radius = pod.config.blastRadius;
      const x = clamp(pod.x, MAP.x, MAP.x + MAP.width);
      const y = clamp(pod.y, MAP.y, MAP.y + MAP.height + 18);
      const hits = this.applyBlast(x, y, radius);
      this.bombing.blastRings.push({ x, y, radius, life: 0.34, maxLife: 0.34 });
      this.makeBurst(this.bombing, x, y, palette.blast, 18, 0.86);
      this.makeBurst(this.bombing, x, y, palette.shock, 10, 0.55);
      this.bombing.cameraKick = Math.min(1.6, this.bombing.cameraKick + 0.45);
      if (!this.bombing.finished && hits.targets > 0) {
        this.showMessage(`${BOMB_LABELS[pod.config.type]} blast marked target`);
      } else if (reason === "drill") {
        this.showMessage("Drill depth reached");
      }
    }

    applyBlast(x, y, radius) {
      const hits = { blocks: 0, targets: 0 };
      for (const building of this.bombing.buildings) {
        for (const block of building.blocks) {
          if (block.destroyed || !circleRectIntersects(x, y, radius, block)) {
            continue;
          }
          const cx = block.x + block.width / 2;
          const cy = block.y + block.height / 2;
          const distance = Math.hypot(cx - x, cy - y);
          const falloff = clamp(1 - distance / radius, 0.18, 1);
          block.health -= 58 + radius * 0.9 * falloff;
          if (block.health <= 0) {
            block.destroyed = true;
            hits.blocks += 1;
            this.bombing.score += 6;
            this.score = this.bombing.score;
            this.makeBurst(this.bombing, cx, cy, palette.buildingDark, 4, 0.42);
          }
        }
      }
      for (const target of this.bombing.targets) {
        if (!target.alive) {
          continue;
        }
        const tx = target.x;
        const ty = target.y - 8 * target.scale;
        if (Math.hypot(tx - x, ty - y) <= radius * 0.72 + target.hitRadius) {
          this.markBombingTarget(target);
          hits.targets += 1;
        }
      }
      this.checkBombingClear();
      return hits;
    }

    checkBombingClear() {
      if (!this.bombing.finished && this.bombing.targets.every((target) => !target.alive)) {
        this.bombing.finished = true;
        this.bombing.score += this.bombing.podsLeft * this.bombing.level.bonusPerPod;
        this.score = this.bombing.score;
        this.bombing.advanceAt = this.elapsed + 1.55;
        this.showMessage(`${this.bombing.level.name} clear`);
      }
    }

    drawBombing() {
      const state = this.bombing;
      this.drawBombingBackground();
      this.drawAimPreview();
      this.drawBasements();
      this.drawBuildings();
      this.drawBombingTargets();
      this.drawBombingFx();
      drawPlane(this.dynamic, this.plane.x, this.plane.y, 0.62, this.plane.banking);
      this.drawPods();
      this.drawPendingDrop();
    }

    drawBombingBackground() {
      if (this.chapterBackgrounds) {
        this.bg.fillStyle(0x041018, 0.08);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(0x365c36, 0.34);
        this.bg.fillRoundedRect(MAP.x + 86, SURFACE_Y + 8, MAP.width - 172, 58, 10);
        this.bg.fillStyle(0x1f3026, 0.24);
        this.bg.fillRoundedRect(MAP.x + 116, SURFACE_Y + 36, MAP.width - 232, 28, 8);
        this.bg.lineStyle(3, 0xf4f7f9, 0.32);
        this.bg.strokeRoundedRect(MAP.x - 22, MAP.y - 18, MAP.width + 44, MAP.height + 40, 12);
        return;
      }
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
    }

    drawAimPreview() {
      if (this.bombing.finished || this.bombing.activePods.length > 0 || this.bombing.pendingDrop) {
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
      for (const building of this.bombing.buildings) {
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
          if (block.row === block.rows - 1) {
            this.map.lineStyle(2, 0x141b20, 0.48);
            this.map.strokeRect(block.x + 1, block.y + 1, block.width - 3, block.height - 3);
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

    drawBombingTargets() {
      for (const target of this.bombing.targets) {
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
      for (const pod of this.bombing.activePods) {
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
      const pending = this.bombing.pendingDrop;
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

    drawBombingFx() {
      for (const ring of this.bombing.blastRings) {
        const progress = 1 - ring.life / ring.maxLife;
        const alpha = clamp(ring.life / ring.maxLife, 0, 1);
        this.fx.lineStyle(2, palette.shock, alpha * 0.75);
        this.fx.strokeCircle(ring.x, ring.y, ring.radius * (0.45 + progress * 0.55));
        this.fx.fillStyle(palette.blast, alpha * 0.12);
        this.fx.fillCircle(ring.x, ring.y, ring.radius * (0.32 + progress * 0.5));
      }
      for (const particle of this.bombing.fx) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        this.fx.fillStyle(particle.color, alpha);
        this.fx.fillCircle(particle.x, particle.y, particle.size * alpha);
      }
    }

    makeBurst(state, x, y, color, count, sizeScale) {
      const scale = sizeScale || 1;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(24, 86) * scale;
        state.fx.push({
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

    loadShipLevel(levelIndex, carryScore, message) {
      this.mode = "ship";
      this.setChapterBackground("ship");
      this.score = carryScore;
      const level = SHIP_LEVELS[levelIndex];
      this.showBombingControls(false);
      this.elapsed = 0;
      this.ship = {
        levelIndex,
        level,
        score: carryScore,
        timeLeft: level.duration,
        scroll: 0,
        shipX: 0,
        shipY: 0,
        armor: 3,
        bullets: [],
        playerBullets: [],
        mines: [],
        guns: [],
        fx: [],
        fireCooldown: 0,
        failed: false,
        finished: false,
        messageUntil: 0,
      };
      for (let i = 0; i < level.guns; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        this.ship.guns.push({
          side,
          y: 118 + (i * 73) % 330,
          cooldown: Phaser.Math.FloatBetween(0.3, level.bulletRate),
          alive: true,
        });
      }
      for (let i = 0; i < level.mines; i += 1) {
        this.ship.mines.push(this.createMine(-Phaser.Math.Between(40, 520)));
      }
      this.showMessage(message || `${level.name}: survive the canal`);
      this.refreshHud(true);
    }

    createMine(y) {
      return {
        x: WORLD.width / 2 + Phaser.Math.Between(-196, 196),
        y,
        pulse: Math.random() * Math.PI * 2,
        exploded: false,
      };
    }

    updateShip(dt) {
      const state = this.ship;
      if (state.failed || state.finished) {
        return;
      }
      state.timeLeft -= dt;
      state.scroll += state.level.riverSpeed * dt;
      const left = this.cursors.left.isDown || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      const down = this.cursors.down.isDown || this.keys.S.isDown;
      const moveX = (right ? 1 : 0) - (left ? 1 : 0) + this.movePad.x;
      const moveY = (down ? 1 : 0) - (up ? 1 : 0) + this.movePad.y;
      if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        state.shipX += (moveX / length) * SHIP_MOVE_SPEED * dt;
        state.shipY += (moveY / length) * SHIP_MOVE_SPEED * dt;
      }
      state.shipX = clamp(state.shipX, SHIP_LIMITS.left - SHIP_CENTER.x, SHIP_LIMITS.right - SHIP_CENTER.x);
      state.shipY = clamp(state.shipY, SHIP_LIMITS.top - SHIP_CENTER.y, SHIP_LIMITS.bottom - SHIP_CENTER.y);
      const ship = this.shipPosition();
      state.fireCooldown = Math.max(0, state.fireCooldown - dt);
      if (this.firePad.active && state.fireCooldown <= 0) {
        this.fireShipGun(this.firePad);
      }

      for (const gun of state.guns) {
        gun.y += state.level.riverSpeed * dt;
        if (gun.y > WORLD.height + 46) {
          gun.y = -Phaser.Math.Between(45, 130);
          gun.cooldown = Phaser.Math.FloatBetween(0.25, state.level.bulletRate);
          gun.alive = true;
        }
        if (!gun.alive) {
          continue;
        }
        gun.cooldown -= dt;
        if (gun.y > 58 && gun.y < WORLD.height - 34 && gun.cooldown <= 0) {
          const x = gun.side < 0 ? 180 : 780;
          const y = gun.y;
          const angle = Math.atan2(ship.y - y, ship.x - x);
          state.bullets.push({ x, y, vx: Math.cos(angle) * 185, vy: Math.sin(angle) * 185, life: 4 });
          gun.cooldown = state.level.bulletRate + Phaser.Math.FloatBetween(-0.25, 0.35);
        }
      }

      for (const bullet of state.playerBullets) {
        bullet.prevX = bullet.x;
        bullet.prevY = bullet.y;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        for (const gun of state.guns) {
          if (!gun.alive) {
            continue;
          }
          const gunX = gun.side < 0 ? 190 : 770;
          if (pointSegmentDistance(gunX, gun.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < 42) {
            gun.alive = false;
            bullet.life = 0;
            state.score += 40;
            this.score = state.score;
            this.shipHitFx(gunX, gun.y, palette.blast);
            this.showMessage("Cannon disabled");
            break;
          }
        }
      }
      state.playerBullets = state.playerBullets.filter(
        (bullet) => bullet.life > 0 && bullet.x > -50 && bullet.x < WORLD.width + 50 && bullet.y > -50 && bullet.y < WORLD.height + 50
      );

      for (const bullet of state.bullets) {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        const distance = Math.hypot(bullet.x - ship.x, bullet.y - ship.y);
        if (distance < 42 && state.armor > 0) {
          state.armor -= 1;
          bullet.life = 0;
          this.shipHitFx(bullet.x, bullet.y, palette.shock);
        } else if (distance < 15) {
          this.failShip("Controller hit");
        }
      }
      state.bullets = state.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -40 && bullet.x < WORLD.width + 40 && bullet.y > -40 && bullet.y < WORLD.height + 40);

      for (const mine of state.mines) {
        mine.y += state.level.riverSpeed * dt;
        mine.pulse += dt * 5;
        const distance = Math.hypot(mine.x - ship.x, mine.y - ship.y);
        mine.alert = clamp(1 - distance / 150, 0, 1);
        if (!mine.exploded && distance < 30 + mine.alert * 24) {
          mine.exploded = true;
          this.shipHitFx(mine.x, mine.y, palette.blast);
          if (state.armor > 0) {
            state.armor -= 1;
          } else {
            this.failShip("Mine reached controller");
          }
        }
        if (mine.y > WORLD.height + 60 || mine.exploded) {
          Object.assign(mine, this.createMine(-Phaser.Math.Between(80, 420)));
        }
      }

      for (const particle of state.fx) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }
      state.fx = state.fx.filter((particle) => particle.life > 0);

      if (state.timeLeft <= 0) {
        state.finished = true;
        this.score += state.armor * 90;
        const next = state.levelIndex + 1;
        if (next < SHIP_LEVELS.length) {
          this.loadShipLevel(next, this.score, `${SHIP_LEVELS[next].name}: more bankside fire`);
        } else {
          this.loadHeliLevel(0, this.score, "Chapter 3: mountain hole defense");
        }
      }
    }

    shipPosition() {
      return { x: SHIP_CENTER.x + this.ship.shipX, y: SHIP_CENTER.y + this.ship.shipY };
    }

    fireShipGun(direction) {
      if (!this.ship || this.ship.failed || this.ship.finished) {
        return;
      }
      const ship = this.shipPosition();
      const dx = direction && Math.abs(direction.x) + Math.abs(direction.y) > 0.08 ? direction.x : 0;
      const dy = direction && Math.abs(direction.x) + Math.abs(direction.y) > 0.08 ? direction.y : -1;
      const length = Math.hypot(dx, dy) || 1;
      this.ship.playerBullets.push({
        x: ship.x,
        y: ship.y - 36,
        prevX: ship.x,
        prevY: ship.y - 36,
        vx: (dx / length) * SHIP_BULLET_SPEED,
        vy: (dy / length) * SHIP_BULLET_SPEED,
        life: 1.45,
      });
      this.ship.fireCooldown = SHIP_FIRE_RATE;
    }

    shipHitFx(x, y, color) {
      for (let i = 0; i < 12; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(30, 120);
        this.ship.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.45,
          maxLife: 0.45,
          size: Phaser.Math.Between(2, 5),
          color,
        });
      }
    }

    failShip(message) {
      if (this.ship.failed) {
        return;
      }
      this.ship.failed = true;
      this.showMessage(`${message} - press R`);
    }

    drawShip() {
      const state = this.ship;
      if (this.shipBankScrolls) {
        Object.values(this.shipBankScrolls).forEach((image) => {
          image.tilePositionY = -state.scroll;
        });
      }
      if (this.chapterBackgrounds) {
        this.bg.fillStyle(0x052230, 0.12);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(palette.river, 0.14);
        this.bg.fillRoundedRect(292, -28, 376, WORLD.height + 56, 18);
      } else {
        this.bg.fillStyle(0x7fb7ce, 1);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(palette.bank, 1);
        this.bg.fillRect(0, 0, 238, WORLD.height);
        this.bg.fillRect(722, 0, 238, WORLD.height);
        this.bg.fillStyle(0x405336, 1);
        this.bg.fillRect(0, 0, 180, WORLD.height);
        this.bg.fillRect(780, 0, 180, WORLD.height);
        this.bg.fillStyle(palette.river, 1);
        this.bg.fillRoundedRect(238, -20, 484, WORLD.height + 40, 14);
        this.bg.fillStyle(palette.riverDark, 0.28);
        for (let y = -80 + (state.scroll % 96); y < WORLD.height + 90; y += 96) {
          this.bg.fillRoundedRect(468, y, 24, 64, 10);
          this.bg.fillRoundedRect(360, y + 30, 14, 50, 8);
          this.bg.fillRoundedRect(590, y + 12, 14, 50, 8);
        }
      }
      this.drawShipMotionLayer(state);

      for (const gun of state.guns) {
        if (!gun.alive || gun.y < -32 || gun.y > WORLD.height + 32) {
          continue;
        }
        const x = gun.side < 0 ? 190 : 770;
        this.map.fillStyle(0x2d3338, 1);
        this.map.fillRoundedRect(x - 14, gun.y - 12, 28, 24, 4);
        this.map.fillStyle(0x1a2026, 1);
        this.map.fillRect(x + (gun.side < 0 ? 8 : -28), gun.y - 3, 20, 6);
      }

      for (const mine of state.mines) {
        const alert = mine.alert || 0;
        const radius = 5 + alert * 15 + Math.sin(mine.pulse) * (1 + alert * 2);
        this.map.fillStyle(0xff2f2f, 0.18 + alert * 0.72);
        this.map.fillCircle(mine.x, mine.y, radius);
        this.map.lineStyle(1, 0xffb0a0, 0.2 + alert * 0.6);
        this.map.strokeCircle(mine.x, mine.y, radius + 5);
      }

      for (const bullet of state.bullets) {
        this.dynamic.fillStyle(0xffefe0, 1);
        this.dynamic.fillCircle(bullet.x, bullet.y, 4);
      }

      for (const bullet of state.playerBullets) {
        this.dynamic.fillStyle(palette.shock, 1);
        this.dynamic.fillCircle(bullet.x, bullet.y, 3.2);
      }

      const ship = this.shipPosition();
      if (this.firePad.active) {
        const length = Math.hypot(this.firePad.x, this.firePad.y) || 1;
        this.dynamic.lineStyle(2, palette.shock, 0.38);
        this.dynamic.lineBetween(ship.x, ship.y - 36, ship.x + (this.firePad.x / length) * 82, ship.y - 36 + (this.firePad.y / length) * 82);
      }
      this.dynamic.save();
      this.dynamic.translateCanvas(ship.x, ship.y);
      for (let layer = 0; layer < state.armor; layer += 1) {
        this.dynamic.lineStyle(3, [0x9bd5ff, 0xffcc4d, 0x5ee3a2][layer], 0.85);
        this.dynamic.strokeRoundedRect(-28 - layer * 8, -45 - layer * 8, 56 + layer * 16, 90 + layer * 16, 18);
      }
      this.dynamic.fillStyle(0xd9e6ec, 1);
      this.dynamic.fillTriangle(0, -48, -26, 34, 26, 34);
      this.dynamic.fillStyle(0x2d6179, 1);
      this.dynamic.fillRoundedRect(-12, -10, 24, 30, 7);
      this.dynamic.fillStyle(0xff6b5d, 0.9);
      this.dynamic.fillCircle(0, 4, 8);
      this.dynamic.restore();

      for (const particle of state.fx) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        this.fx.fillStyle(particle.color, alpha);
        this.fx.fillCircle(particle.x, particle.y, particle.size * alpha);
      }
    }

    drawShipMotionLayer(state) {
      const offset = state.scroll % 118;
      this.bg.lineStyle(2, 0xdff8ff, 0.2);
      this.bg.fillStyle(0xdff8ff, 0.08);
      for (let y = -120 + offset; y < WORLD.height + 140; y += 118) {
        this.bg.strokeRoundedRect(384, y + 16, 28, 54, 12);
        this.bg.strokeRoundedRect(548, y + 46, 22, 48, 10);
        this.bg.fillRoundedRect(462, y + 74, 34, 6, 4);
      }

      const bankMarks = [
        [66, 0, 58],
        [166, 34, 42],
        [248, 72, 30],
        [742, 18, 34],
        [812, 58, 50],
        [890, 94, 36],
      ];
      for (let y = -128 + offset; y < WORLD.height + 144; y += 118) {
        for (const [x, dy, width] of bankMarks) {
          this.bg.fillStyle(0xa9d36c, 0.18);
          this.bg.fillRoundedRect(x, y + dy, width, 7, 4);
          this.bg.fillStyle(0x315b34, 0.16);
          this.bg.fillCircle(x + width * 0.28, y + dy + 19, 9);
          this.bg.fillCircle(x + width * 0.72, y + dy + 22, 7);
        }
      }
    }

    loadHeliLevel(levelIndex, carryScore, message) {
      this.mode = "heli";
      this.setChapterBackground("heli");
      this.score = carryScore;
      const level = HELI_LEVELS[levelIndex];
      this.showBombingControls(false);
      this.elapsed = 0;
      this.heli = {
        levelIndex,
        level,
        score: carryScore,
        timeLeft: level.duration,
        armor: 3,
        heliX: 0,
        heliY: 0,
        shields: [
          { id: "left", label: "Left", offsetX: -56, alive: true },
          { id: "center", label: "Center", offsetX: 0, alive: true },
          { id: "right", label: "Right", offsetX: 56, alive: true },
        ],
        weapon: "gun",
        holes: [],
        missiles: [],
        shots: [],
        fx: [],
        fireCooldown: 0,
        failed: false,
        finished: false,
        messageUntil: 0,
      };
      const positions = [
        [148, 176, 19],
        [248, 122, 17],
        [356, 258, 16],
        [498, 162, 22],
        [642, 236, 18],
        [782, 142, 19],
        [176, 334, 17],
        [314, 374, 15],
        [462, 318, 18],
        [610, 356, 16],
        [758, 302, 17],
        [840, 404, 15],
      ];
      for (let i = 0; i < level.holes; i += 1) {
        const [x, y, r] = positions[i];
        this.heli.holes.push({
          x,
          y,
          r,
          state: "open",
          timer: Phaser.Math.FloatBetween(0.2, 1.8),
          missileCooldown: level.missileRate,
        });
      }
      this.showMessage(message || `${level.name}: move A/D, click holes and missiles`);
      this.refreshHud(true);
    }

    heliPosition() {
      return { x: HELI_BASE.x + this.heli.heliX, y: HELI_BASE.y + this.heli.heliY };
    }

    setHeliWeapon(weapon) {
      if (this.mode !== "heli") {
        return;
      }
      this.heli.weapon = weapon === "missile" ? "missile" : "gun";
      this.showMessage(this.heli.weapon === "missile" ? "Missile selected" : "Gun selected");
    }

    handlePointer(pointer) {
      if (this.mode === "heli") {
        this.fireHeliWeapon(pointer.x, pointer.y);
      }
    }

    fireHeliWeapon(x, y) {
      const state = this.heli;
      if (!state || state.failed || state.finished) {
        return;
      }
      const isMissile = state.weapon === "missile";
      const radius = isMissile ? 56 : 18;
      const heli = this.heliPosition();
      const fromX = heli.x;
      const fromY = heli.y - 18;
      state.shots.push({
        fromX,
        fromY,
        x,
        y,
        radius,
        life: isMissile ? 0.32 : 0.2,
        maxLife: isMissile ? 0.32 : 0.2,
        missile: isMissile,
      });

      for (const missile of state.missiles) {
        const distance = isMissile
          ? Math.hypot(missile.x - x, missile.y - y)
          : pointSegmentDistance(missile.x, missile.y, fromX, fromY, x, y);
        if (!missile.dead && distance <= radius + missile.size * 0.5) {
          missile.dead = true;
          state.score += 80;
          this.score = state.score;
          this.heliBurst(missile.x, missile.y, palette.shock, 12);
        }
      }

      for (const hole of state.holes) {
        const distance = isMissile
          ? Math.hypot(hole.x - x, hole.y - y)
          : pointSegmentDistance(hole.x, hole.y, fromX, fromY, x, y);
        if (distance <= radius + hole.r * 0.5) {
          if (hole.state === "enemy") {
            state.score += 60;
            this.score = state.score;
          } else if (hole.state === "launcher") {
            state.score += 120;
            this.score = state.score;
            this.heliSplash(hole.x, hole.y, isMissile ? 70 : 42);
          }
          hole.state = "closed";
          hole.timer = isMissile ? 4.2 : 2.2;
          hole.missileCooldown = state.level.missileRate;
          this.heliBurst(hole.x, hole.y, isMissile ? palette.blast : palette.targetDone, isMissile ? 18 : 8);
        }
      }
      state.missiles = state.missiles.filter((missile) => !missile.dead);
    }

    heliSplash(x, y, radius) {
      for (const hole of this.heli.holes) {
        if ((hole.state === "enemy" || hole.state === "launcher") && Math.hypot(hole.x - x, hole.y - y) <= radius) {
          hole.state = "closed";
          hole.timer = 3.2;
          this.heli.score += 45;
          this.score = this.heli.score;
        }
      }
    }

    updateHeli(dt) {
      const state = this.heli;
      if (state.failed || state.finished) {
        return;
      }
      state.timeLeft -= dt;
      const left = this.cursors.left.isDown || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      const down = this.cursors.down.isDown || this.keys.S.isDown;
      const moveX = (right ? 1 : 0) - (left ? 1 : 0) + this.movePad.x;
      const moveY = (down ? 1 : 0) - (up ? 1 : 0) + this.movePad.y;
      if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        state.heliX += (moveX / length) * HELI_MOVE_SPEED * dt;
        state.heliY += (moveY / length) * HELI_MOVE_SPEED * dt;
      }
      state.heliX = clamp(state.heliX, HELI_LIMITS.left - HELI_BASE.x, HELI_LIMITS.right - HELI_BASE.x);
      state.heliY = clamp(state.heliY, HELI_LIMITS.top - HELI_BASE.y, HELI_LIMITS.bottom - HELI_BASE.y);
      state.fireCooldown = Math.max(0, state.fireCooldown - dt);
      if (this.firePad.active && state.fireCooldown <= 0) {
        const heli = this.heliPosition();
        const length = Math.hypot(this.firePad.x, this.firePad.y) || 1;
        this.fireHeliWeapon(heli.x + (this.firePad.x / length) * 520, heli.y - 18 + (this.firePad.y / length) * 520);
        state.fireCooldown = state.weapon === "missile" ? 0.46 : HELI_FIRE_RATE;
      }

      for (const hole of state.holes) {
        hole.timer += dt;
        if (hole.state === "closed") {
          hole.timer -= dt * 2;
          if (hole.timer <= 0) {
            hole.state = "open";
            hole.timer = 0;
          }
          continue;
        }
        if (hole.state === "open" && hole.timer > 1.4) {
          hole.state = "enemy";
          hole.timer = 0;
        } else if (hole.state === "enemy" && hole.timer > 3) {
          hole.state = "launcher";
          hole.timer = 0;
          hole.missileCooldown = state.level.missileRate;
        } else if (hole.state === "launcher") {
          hole.missileCooldown -= dt;
          if (hole.timer > 5 && hole.missileCooldown <= 0) {
            const heli = this.heliPosition();
            state.missiles.push({
              x: hole.x,
              y: hole.y + hole.r * 0.2,
              angle: Math.atan2(heli.y - hole.y, heli.x - hole.x),
              speed: 116 + state.levelIndex * 14,
              size: 10,
              life: 0,
              dead: false,
            });
            hole.missileCooldown = state.level.missileRate;
          }
        }
      }

      for (const missile of state.missiles) {
        missile.life += dt;
        missile.speed += 7 * dt;
        missile.size = Math.min(18, missile.size + 2.4 * dt);
        const heli = this.heliPosition();
        const targetAngle = Math.atan2(heli.y - missile.y, heli.x - missile.x);
        missile.angle = turnToward(missile.angle, targetAngle, 1.45 * dt);
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        const relX = missile.x - heli.x;
        const relY = missile.y - heli.y;
        const hitOval = (relX * relX) / (96 * 96) + (relY * relY) / (34 * 34) <= 1;
        if (hitOval) {
          missile.dead = true;
          this.heliBurst(missile.x, missile.y, palette.blast, 18);
          this.breakHeliShield(relX);
        } else if (missile.y > WORLD.height + 48 || missile.x < -70 || missile.x > WORLD.width + 70) {
          missile.dead = true;
        }
      }
      state.missiles = state.missiles.filter((missile) => !missile.dead);

      for (const shot of state.shots) {
        shot.life -= dt;
      }
      state.shots = state.shots.filter((shot) => shot.life > 0);
      for (const particle of state.fx) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }
      state.fx = state.fx.filter((particle) => particle.life > 0);

      if (state.timeLeft <= 0) {
        state.finished = true;
        this.score += state.armor * 100;
        const next = state.levelIndex + 1;
        if (next < HELI_LEVELS.length) {
          this.loadHeliLevel(next, this.score, `${HELI_LEVELS[next].name}: faster launchers`);
        } else {
          this.showMessage("Campaign complete");
        }
      }
    }

    breakHeliShield(offsetX) {
      const state = this.heli;
      const segmentIndex = offsetX < -32 ? 0 : offsetX > 32 ? 2 : 1;
      const shield = state.shields[segmentIndex];
      if (!shield || !shield.alive) {
        this.failHeli("Shield gap hit");
        return;
      }
      shield.alive = false;
      state.armor = state.shields.filter((item) => item.alive).length;
      this.showMessage(`${shield.label} shield broken`);
      if (state.armor <= 0) {
        this.failHeli("Helicopter shields down");
      }
    }

    failHeli(message) {
      if (this.heli.failed) {
        return;
      }
      this.heli.failed = true;
      this.showMessage(`${message} - press R`);
    }

    heliBurst(x, y, color, count) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(22, 110);
        this.heli.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.48,
          maxLife: 0.48,
          size: Phaser.Math.Between(2, 6),
          color,
        });
      }
    }

    drawHeli() {
      const state = this.heli;
      if (this.chapterBackgrounds) {
        this.bg.fillStyle(0x07150c, 0.1);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
      } else {
        this.bg.fillStyle(0x79906f, 1);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(0x4b5d47, 1);
        this.bg.fillTriangle(0, 0, 280, 0, 0, 540);
        this.bg.fillTriangle(960, 0, 720, 0, 960, 540);
        this.bg.fillStyle(palette.river, 0.92);
        this.bg.fillRoundedRect(410, -20, 138, 580, 34);
        this.bg.fillStyle(0x6c766b, 1);
        this.bg.fillEllipse(260, 230, 270, 170);
        this.bg.fillEllipse(660, 294, 310, 190);
        this.bg.fillEllipse(560, 116, 220, 120);
      }

      for (const hole of state.holes) {
        const closed = hole.state === "closed";
        this.map.fillStyle(closed ? 0x455044 : 0x15191b, 1);
        this.map.fillEllipse(hole.x, hole.y, hole.r * 2.1, hole.r * 1.25);
        this.map.lineStyle(2, closed ? 0x7da16f : 0xa4aeb6, closed ? 0.45 : 0.35);
        this.map.strokeEllipse(hole.x, hole.y, hole.r * 2.1, hole.r * 1.25);
        if (hole.state === "enemy") {
          drawStickFigure(this.map, hole.x, hole.y + hole.r * 0.44, palette.target, 1, 0.32);
        } else if (hole.state === "launcher") {
          this.map.fillStyle(0x2b3136, 1);
          this.map.fillRoundedRect(hole.x - 10, hole.y - 9, 20, 18, 4);
          this.map.fillStyle(palette.target, 1);
          drawStickFigure(this.map, hole.x + 12, hole.y + hole.r * 0.44, palette.target, 1, 0.28);
          this.map.fillStyle(palette.pod, 1);
          this.map.fillTriangle(hole.x - 3, hole.y - 23, hole.x + 7, hole.y - 4, hole.x - 13, hole.y - 4);
        }
      }

      for (const missile of state.missiles) {
        this.dynamic.save();
        this.dynamic.translateCanvas(missile.x, missile.y);
        this.dynamic.rotateCanvas(missile.angle);
        this.dynamic.fillStyle(palette.blast, 0.28);
        this.dynamic.fillTriangle(-14, -9, -14, 9, 10, 0);
        this.dynamic.fillStyle(0xdde8ee, 1);
        this.dynamic.fillRoundedRect(-10, -4, 22, 8, 4);
        this.dynamic.fillStyle(palette.pod, 1);
        this.dynamic.fillTriangle(14, 0, 4, -7, 4, 7);
        this.dynamic.fillStyle(0xff6b5d, 0.85);
        this.dynamic.fillTriangle(-13, 0, -25, -5, -25, 5);
        this.dynamic.restore();
        this.dynamic.lineStyle(1, palette.shock, 0.42);
        this.dynamic.strokeCircle(missile.x, missile.y, missile.size + 5);
      }

      for (const shot of state.shots) {
        const alpha = clamp(shot.life / shot.maxLife, 0, 1);
        const progress = 1 - alpha;
        const bulletX = shot.fromX + (shot.x - shot.fromX) * progress;
        const bulletY = shot.fromY + (shot.y - shot.fromY) * progress;
        this.dynamic.lineStyle(shot.missile ? 3 : 2, shot.missile ? palette.blast : palette.shock, alpha * 0.85);
        this.dynamic.lineBetween(shot.fromX, shot.fromY, bulletX, bulletY);
        this.dynamic.fillStyle(shot.missile ? palette.blast : palette.shock, alpha);
        this.dynamic.fillCircle(bulletX, bulletY, shot.missile ? 5 : 3);
        this.dynamic.lineStyle(shot.missile ? 3 : 2, shot.missile ? palette.blast : palette.shock, alpha * 0.6);
        this.dynamic.strokeCircle(shot.x, shot.y, shot.radius * (1 - alpha * 0.35));
      }

      const heli = this.heliPosition();
      this.dynamic.fillStyle(0x061018, 0.54);
      this.dynamic.fillEllipse(heli.x, heli.y + 8, 156, 58);
      for (const shield of state.shields) {
        const shieldX = heli.x + shield.offsetX;
        if (shield.alive) {
          this.dynamic.lineStyle(4, shield.id === "center" ? 0x5ee3a2 : 0x9bd5ff, 0.78);
          this.dynamic.strokeEllipse(shieldX, heli.y, 62, 36);
        } else {
          this.dynamic.lineStyle(3, palette.target, 0.58);
          this.dynamic.strokeEllipse(shieldX, heli.y, 56, 28);
          this.dynamic.lineBetween(shieldX - 14, heli.y - 12, shieldX + 12, heli.y + 10);
          this.dynamic.lineBetween(shieldX - 8, heli.y + 12, shieldX + 16, heli.y - 8);
        }
      }
      this.dynamic.fillStyle(0xe7eff4, 1);
      this.dynamic.fillRoundedRect(heli.x - 30, heli.y - 13, 60, 26, 10);
      this.dynamic.fillStyle(0x2b4658, 1);
      this.dynamic.fillRect(heli.x - 7, heli.y - 25, 14, 50);
      this.dynamic.lineStyle(3, 0xd9e6ec, 0.9);
      this.dynamic.lineBetween(heli.x - 58, heli.y - 2, heli.x + 58, heli.y - 2);
      this.dynamic.lineBetween(heli.x, heli.y - 35, heli.x, heli.y + 35);
      this.dynamic.fillStyle(palette.target, 0.88);
      this.dynamic.fillCircle(heli.x, heli.y + 4, 6);

      for (const particle of state.fx) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        this.fx.fillStyle(particle.color, alpha);
        this.fx.fillCircle(particle.x, particle.y, particle.size * alpha);
      }
    }

    refreshHud(force) {
      let hud = "";
      if (this.mode === "ship") {
        hud = `ship|${this.ship.levelIndex}|${Math.ceil(this.ship.timeLeft)}|${this.ship.armor}|${this.score}`;
      } else if (this.mode === "heli") {
        const shields = this.heli.shields.map((shield) => (shield.alive ? "1" : "0")).join("");
        hud = `heli|${this.heli.levelIndex}|${Math.ceil(this.heli.timeLeft)}|${this.heli.armor}|${this.heli.weapon}|${Math.round(this.heli.heliX)}|${Math.round(this.heli.heliY)}|${shields}|${this.score}`;
      } else {
        const marked = this.bombing.targets.filter((target) => !target.alive).length;
        hud = `bomb|${this.bombing.levelIndex}|${marked}/${this.bombing.targets.length}|${this.bombing.podsLeft}|${this.bombing.score}`;
      }
      if (!force && hud === this.lastHud) {
        return;
      }
      this.lastHud = hud;

      if (this.mode === "ship") {
        els.stageLabel.textContent = "Canal";
        els.targetsLabel.textContent = "Time";
        els.podsLabel.textContent = "Armor";
        els.scoreLabel.textContent = "Score";
        els.stage.textContent = `C2 ${this.ship.levelIndex + 1}/${SHIP_LEVELS.length}`;
        els.targets.textContent = `${Math.ceil(this.ship.timeLeft)}s`;
        els.pods.textContent = `${this.ship.armor}`;
        els.score.textContent = `${this.score}`;
      } else if (this.mode === "heli") {
        els.stageLabel.textContent = "Heli";
        els.targetsLabel.textContent = "Time";
        els.podsLabel.textContent = "Armor";
        els.scoreLabel.textContent = "Score";
        els.stage.textContent = `C3 ${this.heli.levelIndex + 1}/${HELI_LEVELS.length}`;
        els.targets.textContent = `${Math.ceil(this.heli.timeLeft)}s`;
        els.pods.textContent = `${this.heli.armor}/3 ${this.heli.weapon === "missile" ? "M" : "G"}`;
        els.score.textContent = `${this.score}`;
      } else {
        els.stageLabel.textContent = "Level";
        els.targetsLabel.textContent = "Targets";
        els.podsLabel.textContent = "Pods";
        els.scoreLabel.textContent = "Score";
        const marked = this.bombing.targets.filter((target) => !target.alive).length;
        els.stage.textContent = `C1 ${this.bombing.levelIndex + 1}/${CHAPTER1_LEVELS.length}`;
        els.targets.textContent = `${marked}/${this.bombing.targets.length}`;
        els.pods.textContent = `${this.bombing.podsLeft}`;
        els.score.textContent = `${this.bombing.score}`;
      }
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

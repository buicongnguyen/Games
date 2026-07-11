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
    pathButtons: Array.from(document.querySelectorAll("[data-bomb-path]")),
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
    redo: document.getElementById("redo-button"),
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
    path: "arc",
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

  const BOMB_PATH_LABELS = {
    arc: "Arc",
    drop: "Drop",
    hook: "Hook",
    zigzag: "Z path",
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
    { name: "Chapter 2-1", duration: 34, guns: 8, launchers: 2, mines: 5, bulletRate: 1.45, launcherRate: 1.1, riverSpeed: 76, pickupRate: 6.8 },
    { name: "Chapter 2-2", duration: 42, guns: 10, launchers: 3, mines: 7, bulletRate: 1.15, launcherRate: 1.0, riverSpeed: 88, pickupRate: 5.9 },
    { name: "Chapter 2-3", duration: 50, guns: 12, launchers: 4, mines: 9, bulletRate: 0.95, launcherRate: 0.92, riverSpeed: 102, pickupRate: 5.1 },
  ];

  const SHIP_CENTER = { x: WORLD.width / 2, y: 316 };
  const SHIP_LIMITS = { left: 214, right: 746, top: 130, bottom: 472 };
  const SHIP_MOVE_SPEED = 224;
  const SHIP_ACCEL = 820;
  const SHIP_WATER_DRAG = 3.8;
  const SHIP_FIRE_RATE = 0.22;
  const SHIP_BULLET_SPEED = 980;
  const SHIP_BULLET_LIFE = 2.25;
  const SHIP_SUPPORT_MISSILE_SPEED = 268;
  const SHIP_SUPPORT_MISSILE_FIRE_RATE = 0.58;
  const SHIP_ENEMY_MISSILE_SPEED = 108;
  const SHIP_ENEMY_MISSILE_TURN = 1.05;
  const SHIP_BANK_WIDTH = 224;
  const SHIP_GUN_LEFT_X = 118;
  const SHIP_GUN_RIGHT_X = WORLD.width - SHIP_GUN_LEFT_X;
  const SHIP_LAUNCHER_LEFT_X = 74;
  const SHIP_LAUNCHER_RIGHT_X = WORLD.width - SHIP_LAUNCHER_LEFT_X;
  const SHIP_MINE_SPREAD = 244;
  const SHIP_WATER_LEFT = 204;
  const SHIP_WATER_WIDTH = 552;
  const SHIP_PICKUP_TYPES = ["star", "medal", "health", "smallgun"];
  const SHIP_DUAL_DURATION = 7.5;
  const SHIP_GUIDED_DURATION = 5;

  const HELI_LEVELS = [
    { name: "Chapter 3-1", duration: 42, holes: 12, missileRate: 2.8 },
    { name: "Chapter 3-2", duration: 50, holes: 15, missileRate: 2.25 },
    { name: "Chapter 3-3", duration: 58, holes: 18, missileRate: 1.85 },
  ];

  const HELI_BASE = { x: WORLD.width / 2, y: 462 };
  const HELI_LIMITS = { left: 268, right: 692, top: 350, bottom: 500 };
  const HELI_MOVE_SPEED = 236;
  const HELI_ACCEL = 760;
  const HELI_AIR_DRAG = 4.2;
  const HELI_FIRE_RATE = 0.18;
  const HELI_HOLE_APPEAR_TIME = 1.15;
  const HELI_HOLE_POSITIONS = [
    [118, 154, 16],
    [206, 100, 14],
    [292, 178, 15],
    [382, 254, 14],
    [482, 132, 18],
    [586, 202, 15],
    [692, 118, 16],
    [814, 168, 15],
    [156, 286, 14],
    [246, 360, 13],
    [346, 314, 14],
    [438, 406, 13],
    [542, 286, 15],
    [636, 372, 14],
    [742, 300, 15],
    [846, 406, 13],
    [88, 404, 13],
    [878, 260, 14],
  ];

  function cloneBombConfig(config) {
    return {
      type: config.type,
      path: config.path,
      fuse: config.fuse,
      blastRadius: config.blastRadius,
      drillWalls: config.drillWalls,
      bounceCount: config.bounceCount,
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function approachValue(current, target, amount) {
    return current + (target - current) * clamp(amount, 0, 1);
  }

  function smoothStep01(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function applyQuadraticDrag(body, dt, dragCoefficient, minFactor) {
    const speed = Math.hypot(body.vx, body.vy);
    if (speed < 0.001) {
      return 0;
    }
    const factor = Math.max(minFactor == null ? 0.8 : minFactor, 1 - speed * dragCoefficient * dt);
    body.vx *= factor;
    body.vy *= factor;
    return speed;
  }

  function sampleIslandSurfaceY(x) {
    const local = clamp((x - MAP.x) / MAP.width, 0, 1);
    const crest = Math.sin(local * Math.PI) * 9;
    const dune = Math.sin(local * Math.PI * 2.25 + 0.35) * 4.5 + Math.sin(local * Math.PI * 5.1 - 0.3) * 2.1;
    const leftRise = smoothStep01(clamp((0.17 - local) / 0.17, 0, 1)) * 18;
    const rightRise = smoothStep01(clamp((local - 0.83) / 0.17, 0, 1)) * 16;
    return SURFACE_Y - 8 - crest * 0.58 - dune * 0.72 + leftRise + rightRise;
  }

  function sampleIslandSurfaceNormal(x) {
    const epsilon = 4;
    const y0 = sampleIslandSurfaceY(x - epsilon);
    const y1 = sampleIslandSurfaceY(x + epsilon);
    const slope = (y1 - y0) / (epsilon * 2);
    const length = Math.hypot(slope, -1) || 1;
    return { x: slope / length, y: -1 / length };
  }

  function reflectVelocity(vx, vy, normal, restitution, tangentDamping) {
    const tangent = { x: -normal.y, y: normal.x };
    const normalSpeed = vx * normal.x + vy * normal.y;
    const tangentSpeed = vx * tangent.x + vy * tangent.y;
    const bouncedNormal = normalSpeed < 0 ? -normalSpeed * restitution : normalSpeed;
    const dampedTangent = tangentSpeed * tangentDamping;
    return {
      vx: tangent.x * dampedTangent + normal.x * bouncedNormal,
      vy: tangent.y * dampedTangent + normal.y * bouncedNormal,
    };
  }

  function advanceBodyWithIntent(state, dt, intentX, intentY, accel, drag, maxSpeed, posXKey, posYKey, velXKey, velYKey, bounds) {
    let ax = intentX;
    let ay = intentY;
    const intentLength = Math.hypot(ax, ay);
    const activeIntent = intentLength > 0.001;
    if (activeIntent) {
      ax /= intentLength;
      ay /= intentLength;
      state[velXKey] += ax * accel * dt;
      state[velYKey] += ay * accel * dt;
    }

    const damping = Math.exp(-drag * dt * (activeIntent ? 0.9 : 1.24));
    state[velXKey] *= damping;
    state[velYKey] *= damping;

    const speed = Math.hypot(state[velXKey], state[velYKey]);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      state[velXKey] *= scale;
      state[velYKey] *= scale;
    }

    state[posXKey] += state[velXKey] * dt;
    state[posYKey] += state[velYKey] * dt;

    if (bounds) {
      if (state[posXKey] < bounds.minX) {
        state[posXKey] = bounds.minX;
        state[velXKey] *= 0.35;
      } else if (state[posXKey] > bounds.maxX) {
        state[posXKey] = bounds.maxX;
        state[velXKey] *= 0.35;
      }
      if (state[posYKey] < bounds.minY) {
        state[posYKey] = bounds.minY;
        state[velYKey] *= 0.35;
      } else if (state[posYKey] > bounds.maxY) {
        state[posYKey] = bounds.maxY;
        state[velYKey] *= 0.35;
      }
    }

    return {
      speed: Math.hypot(state[velXKey], state[velYKey]),
      activeIntent,
      dirX: activeIntent ? ax : 0,
      dirY: activeIntent ? ay : 0,
    };
  }

  function pushTrailPoint(entity, maxPoints, extras) {
    if (!entity.trail) {
      entity.trail = [];
    }
    entity.trail.push({
      x: entity.x,
      y: entity.y,
      ...(extras || {}),
    });
    if (entity.trail.length > maxPoints) {
      entity.trail.shift();
    }
  }

  function drawMotionTrail(graphics, points, color, alphaScale, baseRadius, glowColor) {
    if (!points || points.length < 2) {
      return;
    }
    const glow = glowColor || blendColor(color, 0xffffff, 0.24);
    for (let i = 1; i < points.length; i += 1) {
      const point = points[i];
      const prev = points[i - 1];
      const t = i / (points.length - 1);
      const alpha = (alphaScale || 0.2) * t;
      const width = Math.max(0.8, (baseRadius || 2) * (0.42 + t * 0.92));
      graphics.lineStyle(width + 1.2, color, alpha * 0.18);
      graphics.lineBetween(prev.x, prev.y, point.x, point.y);
      graphics.lineStyle(width, glow, alpha * 0.9);
      graphics.lineBetween(prev.x, prev.y, point.x, point.y);
      graphics.fillStyle(glow, alpha * 0.75);
      graphics.fillCircle(point.x, point.y, width * 0.72);
    }
  }

  function createBombMotionState(origin, angleDeg, speed) {
    const radians = Phaser.Math.DegToRad(angleDeg);
    const baseVx = origin.speed + Math.sin(radians) * speed * 0.68;
    const baseVy = Math.cos(radians) * speed;
    const forward = baseVx >= 0 ? 1 : -1;
    const launchSpeed = Math.hypot(baseVx, baseVy);
    return {
      x: origin.x,
      y: origin.y + 18,
      prevX: origin.x,
      prevY: origin.y + 18,
      vx: baseVx,
      vy: baseVy,
      baseVx,
      baseVy,
      forward,
      releaseY: origin.y + 18,
      pathAge: 0,
      pathPhase: 0,
      pathPhaseTime: 0,
      pathCruiseSpeed: Math.max(Math.abs(baseVx) * 1.08, origin.speed + speed * 0.3),
      pathDiveSpeed: Math.max(210, Math.abs(baseVy) * 0.94 + 34),
      launchSpeed,
      speed: launchSpeed,
      roll: Phaser.Math.FloatBetween(-0.35, 0.35),
    };
  }

  function advanceBombPathMotion(pod, dt) {
    const path = BOMB_PATH_LABELS[pod.config.path] ? pod.config.path : "arc";
    const steer = 4.8 * dt;
    pod.pathAge += dt;
    pod.pathPhaseTime += dt;
    if (pod.bounces > 0) {
      pod.vy += GRAVITY * dt;
    } else if (path === "drop") {
      pod.vx = approachValue(pod.vx, pod.forward * Math.max(18, Math.abs(pod.baseVx) * 0.08), steer * 1.25);
      pod.vy += GRAVITY * dt * 1.22;
    } else if (path === "hook") {
      if (pod.pathPhase === 0 && (pod.pathAge >= 0.2 || pod.y >= pod.releaseY + 58)) {
        pod.pathPhase = 1;
        pod.pathPhaseTime = 0;
      }
      if (pod.pathPhase === 0) {
        pod.vx = approachValue(pod.vx, pod.forward * Math.max(42, pod.pathCruiseSpeed * 0.4), steer * 0.72);
        pod.vy += GRAVITY * dt * 1.18;
      } else {
        pod.vx = approachValue(pod.vx, pod.forward * pod.pathCruiseSpeed * 1.08, steer * 1.55);
        pod.vy = approachValue(pod.vy, 14, steer * 1.8);
        pod.vy += 20 * dt;
      }
    } else if (path === "zigzag") {
      if (pod.pathPhase === 0 && (pod.pathAge >= 0.16 || pod.y >= pod.releaseY + 40)) {
        pod.pathPhase = 1;
        pod.pathPhaseTime = 0;
      } else if (pod.pathPhase === 1 && pod.pathPhaseTime >= 0.28) {
        pod.pathPhase = 2;
        pod.pathPhaseTime = 0;
      }
      if (pod.pathPhase === 0) {
        pod.vx = approachValue(pod.vx, pod.forward * pod.pathCruiseSpeed * 0.82, steer * 0.9);
        pod.vy += GRAVITY * dt * 1.14;
      } else if (pod.pathPhase === 1) {
        pod.vx = approachValue(pod.vx, pod.forward * pod.pathCruiseSpeed * 1.16, steer * 1.6);
        pod.vy = approachValue(pod.vy, 8, steer * 2);
        pod.vy += 10 * dt;
      } else {
        pod.vx = approachValue(pod.vx, pod.forward * pod.pathCruiseSpeed * 0.9, steer * 1.1);
        pod.vy = approachValue(pod.vy, pod.pathDiveSpeed * 0.9, steer * 1.3);
        pod.vy += 26 * dt;
      }
    } else {
      pod.vy += GRAVITY * dt;
    }
    const dragCoefficient =
      path === "drop" ? 0.00165 : path === "hook" ? 0.00125 : path === "zigzag" ? 0.00138 : 0.00112;
    pod.speed = applyQuadraticDrag(pod, dt, dragCoefficient, 0.84);
    pod.roll = approachValue(pod.roll || 0, clamp(pod.vy / Math.max(120, pod.launchSpeed), -0.9, 0.9) * 0.42, dt * 4.8);
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
        state: "crawl",
        stateTime: -index * 0.16,
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

  function drawEnemyStanding(graphics, color, alpha, scale) {
    const s = scale || 1;
    const body = blendColor(0x10161d, color, 0.68);
    const armor = blendColor(0x32414d, color, 0.28);
    const accent = blendColor(color, palette.shock, 0.32);
    graphics.fillStyle(0x04080b, alpha * 0.22);
    graphics.fillEllipse(0, 16 * s, 26 * s, 7 * s);
    graphics.fillStyle(body, alpha);
    graphics.fillCircle(0, -19 * s, 6.2 * s);
    graphics.fillStyle(armor, alpha * 0.95);
    graphics.fillEllipse(0, -22.5 * s, 13 * s, 6 * s);
    graphics.fillStyle(body, alpha);
    graphics.fillRoundedRect(-5.2 * s, -13 * s, 10.4 * s, 18 * s, 3.8 * s);
    graphics.fillStyle(armor, alpha * 0.84);
    graphics.fillRoundedRect(-3.4 * s, -10.5 * s, 6.8 * s, 10.5 * s, 2.5 * s);
    graphics.fillStyle(body, alpha * 0.94);
    graphics.fillRect(-7.2 * s, -10.5 * s, 2.5 * s, 12 * s);
    graphics.fillRect(4.7 * s, -9.6 * s, 2.6 * s, 11 * s);
    graphics.fillRect(-4 * s, 4.6 * s, 3.1 * s, 12.8 * s);
    graphics.fillRect(0.9 * s, 4.6 * s, 3.1 * s, 12.8 * s);
    graphics.fillStyle(0x070d11, alpha * 0.5);
    graphics.fillRoundedRect(-8.2 * s, -9.6 * s, 2.6 * s, 9.2 * s, 1.2 * s);
    graphics.fillStyle(accent, alpha * 0.78);
    graphics.fillRoundedRect(3.2 * s, -7.4 * s, 13.2 * s, 2.3 * s, 1.1 * s);
    graphics.fillRect(13.8 * s, -8.8 * s, 1.6 * s, 4.8 * s);
  }

  function drawEnemyCrawling(graphics, color, alpha, scale, progress) {
    const s = scale || 1;
    const t = clamp(progress, 0, 1);
    const body = blendColor(0x0e141a, color, 0.66);
    const armor = blendColor(0x31424c, color, 0.26);
    const accent = blendColor(color, palette.shock, 0.3);
    const baseY = (1 - t) * 10 * s;
    graphics.fillStyle(0x04080b, alpha * 0.18);
    graphics.fillEllipse(0, 12 * s + baseY, 30 * s, 6 * s);
    graphics.fillStyle(body, alpha);
    graphics.fillCircle(-10 * s, -8 * s + baseY, 5.2 * s);
    graphics.fillStyle(armor, alpha * 0.9);
    graphics.fillEllipse(-10 * s, -10.6 * s + baseY, 11 * s, 5 * s);
    graphics.fillStyle(body, alpha);
    graphics.fillRoundedRect(-7 * s, -10 * s + baseY, 20 * s, 8.5 * s, 3 * s);
    graphics.fillStyle(0x070d11, alpha * 0.46);
    graphics.fillRoundedRect(-2 * s, -9.4 * s + baseY, 5 * s, 7 * s, 2 * s);
    graphics.lineStyle(Math.max(1, 1.8 * s), body, alpha * 0.98);
    graphics.beginPath();
    graphics.moveTo(-1 * s, -4 * s + baseY);
    graphics.lineTo(-12 * s, 3 * s + baseY);
    graphics.moveTo(2 * s, -3 * s + baseY);
    graphics.lineTo(13 * s, 3 * s + baseY);
    graphics.moveTo(6 * s, -2 * s + baseY);
    graphics.lineTo(1 * s, 8 * s + baseY);
    graphics.moveTo(-4 * s, -4 * s + baseY);
    graphics.lineTo(-15 * s, -1 * s + baseY);
    graphics.strokePath();
    graphics.fillStyle(accent, alpha * 0.75);
    graphics.fillRoundedRect(6 * s, -5.2 * s + baseY, 10.8 * s, 2 * s, 1 * s);
  }

  function drawEnemyFigure(graphics, x, y, color, alpha, scale, pose, progress) {
    const s = scale || 1;
    const t = clamp(progress || 0, 0, 1);
    if (pose === "explode") {
      const flare = blendColor(palette.blast, palette.shock, 0.42);
      graphics.fillStyle(flare, alpha * (0.14 + 0.34 * (1 - t)));
      graphics.fillCircle(x, y - 10 * s, (9 + 20 * t) * s);
      graphics.lineStyle(Math.max(1, 2 * s), palette.shock, alpha * (1 - t));
      graphics.strokeCircle(x, y - 10 * s, (12 + 24 * t) * s);
      graphics.save();
      graphics.translateCanvas(x, y - 10 * s);
      graphics.rotateCanvas(t * 1.8);
      graphics.lineStyle(Math.max(1, 2.2 * s), color, alpha * (1 - t) * 0.62);
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2;
        const inner = 7 * s;
        const outer = (17 + 15 * t) * s;
        graphics.lineBetween(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
      }
      graphics.restore();
      return;
    }
    graphics.save();
    graphics.translateCanvas(x, y);
    if (pose === "crawl") {
      drawEnemyCrawling(graphics, color, alpha, s, t);
      graphics.restore();
      return;
    }
    if (pose === "fall") {
      graphics.translateCanvas(0, 5 * s * t);
      graphics.rotateCanvas(1.15 * t);
      drawEnemyStanding(graphics, color, alpha * (1 - t * 0.22), s);
      graphics.fillStyle(blendColor(color, palette.shock, 0.18), alpha * (1 - t) * 0.56);
      graphics.fillRoundedRect(-18 * s * t, -4 * s, 12 * s, 2.1 * s, 1 * s);
      graphics.restore();
      return;
    }
    if (pose === "sink") {
      const fade = alpha * (1 - t);
      graphics.translateCanvas(0, 18 * s * t);
      drawEnemyStanding(graphics, color, fade, s);
      graphics.fillStyle(0x24341f, 0.72);
      graphics.fillEllipse(0, 18 * s, 34 * s, 9 * s);
      graphics.fillStyle(0x5f7a3f, 0.5);
      graphics.fillEllipse(2 * s, 18 * s, 24 * s, 5 * s);
      graphics.restore();
      return;
    }
    drawEnemyStanding(graphics, color, alpha, s);
    graphics.restore();
  }

  function updateFxParticles(particles, dt, defaultGravity) {
    const gravity = defaultGravity || 0;
    for (const particle of particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 1 - clamp((particle.drag || 0) * dt, 0, 0.82);
      particle.vy += (particle.gravity == null ? gravity : particle.gravity) * dt;
      particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
    }
    return particles.filter((particle) => particle.life > 0);
  }

  function drawFxParticle(graphics, particle) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    const size = Math.max(0.8, particle.size * (particle.shape === "smoke" ? 0.8 + (1 - alpha) * 0.55 : 1));
    if (particle.shape === "spark") {
      graphics.save();
      graphics.translateCanvas(particle.x, particle.y);
      graphics.rotateCanvas(particle.rotation || 0);
      graphics.fillStyle(particle.color, alpha * 0.9);
      graphics.fillRoundedRect(-size * 1.8, -size * 0.36, size * 3.6, size * 0.72, size * 0.28);
      graphics.fillStyle(particle.glowColor || blendColor(particle.color, 0xffffff, 0.35), alpha * 0.78);
      graphics.fillCircle(size * 1.3, 0, size * 0.45);
      graphics.restore();
      return;
    }
    if (particle.shape === "shard") {
      graphics.save();
      graphics.translateCanvas(particle.x, particle.y);
      graphics.rotateCanvas(particle.rotation || 0);
      graphics.fillStyle(particle.color, alpha * 0.9);
      graphics.fillTriangle(-size * 1.2, -size * 0.55, size * 1.4, 0, -size * 1.2, size * 0.55);
      graphics.restore();
      return;
    }
    graphics.fillStyle(particle.color, particle.shape === "smoke" ? alpha * 0.42 : alpha * 0.95);
    graphics.fillCircle(particle.x, particle.y, size);
    if (particle.shape === "smoke") {
      graphics.lineStyle(1, particle.glowColor || blendColor(particle.color, 0xffffff, 0.18), alpha * 0.18);
      graphics.strokeCircle(particle.x, particle.y, size * (1.12 + (1 - alpha) * 0.4));
    } else {
      graphics.fillStyle(particle.glowColor || blendColor(particle.color, palette.shock, 0.4), alpha * 0.45);
      graphics.fillCircle(particle.x, particle.y, size * 0.52);
    }
  }

  function drawTracerRound(graphics, fromX, fromY, toX, toY, color, alpha, width, headRadius, glowAmount) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const glow = blendColor(color, 0xffffff, glowAmount == null ? 0.3 : glowAmount);
    graphics.lineStyle(width + 2, color, alpha * 0.16);
    graphics.lineBetween(fromX, fromY, toX, toY);
    graphics.lineStyle(width, glow, alpha * 0.84);
    graphics.lineBetween(fromX, fromY, toX, toY);
    graphics.fillStyle(color, alpha * 0.22);
    graphics.fillCircle(toX - nx * width * 1.6, toY - ny * width * 1.6, Math.max(width * 1.25, (headRadius || width) * 0.72));
    graphics.fillStyle(glow, alpha);
    graphics.fillCircle(toX, toY, headRadius || width * 1.2);
  }

  function drawRocketSprite(graphics, x, y, angle, size, colors, pulse, danger) {
    const bodyColor = colors.body;
    const hotColor = colors.hot;
    const glowColor = colors.glow;
    const stripeColor = colors.stripe || blendColor(bodyColor, 0xffffff, 0.18);
    const flameColor = colors.flame || palette.blast;
    const emberColor = colors.ember || palette.shock;
    const pulseScale = 1 + Math.sin(pulse || 0) * 0.04;
    graphics.save();
    graphics.translateCanvas(x, y);
    graphics.rotateCanvas(angle);
    graphics.fillStyle(glowColor, 0.16 + (danger || 0) * 0.18);
    graphics.fillTriangle(-1.1 * size, -0.64 * size, -1.1 * size, 0.64 * size, 0.98 * size, 0);
    graphics.fillStyle(bodyColor, 1);
    graphics.fillRoundedRect(-0.72 * size, -0.29 * size, 1.46 * size, 0.58 * size, 4);
    graphics.fillStyle(stripeColor, 0.95);
    graphics.fillRect(-0.08 * size, -0.22 * size, 0.18 * size, 0.44 * size);
    graphics.fillStyle(hotColor, 1);
    graphics.fillTriangle(0.96 * size, 0, 0.24 * size, -0.47 * size, 0.24 * size, 0.47 * size);
    graphics.fillTriangle(-0.18 * size, -0.3 * size, -0.76 * size, -0.78 * size, -0.52 * size, -0.1 * size);
    graphics.fillTriangle(-0.18 * size, 0.3 * size, -0.76 * size, 0.78 * size, -0.52 * size, 0.1 * size);
    graphics.fillStyle(flameColor, 0.84 + (danger || 0) * 0.12);
    graphics.fillTriangle(-0.74 * size, 0, (-1.7 - (danger || 0) * 0.25) * size * pulseScale, -0.32 * size, (-1.7 - (danger || 0) * 0.25) * size * pulseScale, 0.32 * size);
    graphics.fillStyle(emberColor, 0.72);
    graphics.fillTriangle(-0.74 * size, 0, (-1.28 - (danger || 0) * 0.18) * size * pulseScale, -0.18 * size, (-1.28 - (danger || 0) * 0.18) * size * pulseScale, 0.18 * size);
    graphics.fillStyle(colors.core || 0x1c2834, 0.92);
    graphics.fillRect(-0.34 * size, -0.16 * size, 0.42 * size, 0.32 * size);
    graphics.restore();
  }

  function drawBlastWave(graphics, blast, shockColor) {
    const alpha = clamp(blast.life / blast.maxLife, 0, 1);
    const progress = 1 - alpha;
    const color = blast.color;
    const ringColor = shockColor || blendColor(color, palette.shock, 0.4);
    graphics.fillStyle(color, alpha * 0.12);
    graphics.fillCircle(blast.x, blast.y, blast.radius * (0.16 + progress * 0.44));
    graphics.fillStyle(blendColor(color, palette.shock, 0.5), alpha * 0.18);
    graphics.fillCircle(blast.x, blast.y, blast.radius * (0.08 + progress * 0.22));
    graphics.lineStyle(2.4, ringColor, alpha * 0.72);
    graphics.strokeCircle(blast.x, blast.y, blast.radius * (0.32 + progress * 0.68));
    graphics.lineStyle(1.2, color, alpha * 0.38);
    graphics.strokeCircle(blast.x, blast.y, blast.radius * (0.18 + progress * 0.46));
    graphics.save();
    graphics.translateCanvas(blast.x, blast.y);
    graphics.rotateCanvas(progress * 2.6);
    graphics.lineStyle(1.6, ringColor, alpha * 0.34);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const inner = blast.radius * (0.18 + progress * 0.12);
      const outer = blast.radius * (0.42 + progress * 0.3);
      graphics.lineBetween(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    }
    graphics.restore();
  }

  function blendColor(fromHex, toHex, amount) {
    const t = clamp(amount, 0, 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(fromHex),
      Phaser.Display.Color.ValueToColor(toHex),
      100,
      Math.round(t * 100)
    );
    return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
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
      this.load.image("bg-bombing", "assets/chapter1-bombing-bg.png?v=flow-fix-9");
      this.load.image("bg-ship", "assets/chapter2-canal-bg.png?v=flow-fix-9");
      this.load.image("bg-ship-bank-left", "assets/chapter2-left-bank-scroll.png?v=flow-fix-9");
      this.load.image("bg-ship-bank-right", "assets/chapter2-right-bank-scroll.png?v=flow-fix-9");
      this.load.image("ship-player", "assets/chapter2-player-ship.png?v=flow-fix-9");
      this.load.image("bg-heli", "assets/chapter3-heli-bg.png?v=flow-fix-9");
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
        left: this.add.tileSprite(0, 0, SHIP_BANK_WIDTH, WORLD.height, "bg-ship-bank-left"),
        right: this.add.tileSprite(WORLD.width - SHIP_BANK_WIDTH, 0, SHIP_BANK_WIDTH, WORLD.height, "bg-ship-bank-right"),
      };
      Object.values(this.shipBankScrolls).forEach((image) => {
        image.setOrigin(0, 0);
        image.setDepth(-19);
        image.setAlpha(0.68);
        image.setVisible(false);
      });
      this.setChapterBackground("bombing");
      this.bg = this.add.graphics();
      this.map = this.add.graphics();
      this.shipSprite = this.add.image(-200, -200, "ship-player");
      this.shipSprite.setOrigin(0.5, 0.5);
      this.shipSprite.setDisplaySize(102, 153);
      this.shipSprite.setVisible(false);
      this.shipSprite.setDepth(0);
      this.dynamic = this.add.graphics();
      this.fx = this.add.graphics();
      this.trajectory = this.add.graphics();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D,ONE,TWO");
      this.wireControls();
      this.input.on("pointerdown", (pointer) => this.handlePointer(pointer));
      this.input.on("pointermove", (pointer) => {
        if (pointer.isDown && this.mode === "ship") {
          this.handlePointer(pointer);
        }
      });
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
      if (this.shipSprite) {
        this.shipSprite.setVisible(mode === "ship");
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
      els.redo.addEventListener("click", () => {
        this.toggleStatusPanel(false);
        this.resetCurrentLevel();
      });
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
      els.pathButtons.forEach((button) => {
        button.addEventListener("click", () => this.setBombPath(button.dataset.bombPath));
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

    setBombPath(path) {
      const config = this.getEditableBombConfig();
      config.path = BOMB_PATH_LABELS[path] ? path : "arc";
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
      config.type = BOMB_LABELS[config.type] ? config.type : "drill";
      config.path = BOMB_PATH_LABELS[config.path] ? config.path : "arc";
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
      els.pathButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.bombPath === config.path);
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
      els.bombSummary.textContent = `${scope}: ${BOMB_LABELS[config.type]}, ${BOMB_PATH_LABELS[config.path]}, ${detail}, blast ${config.blastRadius}`;
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
      const level = this.bombing.level;
      const bombConfig = this.getShotBombConfig();
      const motion = createBombMotionState(this.plane, angleDeg, speed);
      const pod = {
        ...motion,
        radius: level.podRadius,
        drillRadius: level.drillRadius,
        energy: speed * 0.92,
        config: bombConfig,
        fuseLeft: bombConfig.fuse,
        piercedWalls: 0,
        bounces: 0,
        groundCooldown: 0,
        dead: false,
        trail: [],
        impactGlow: 0,
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
        pod.impactGlow = Math.max(0, (pod.impactGlow || 0) - dt * 2.8);
        advanceBombPathMotion(pod, dt);
        pod.x += pod.vx * dt;
        pod.y += pod.vy * dt;
        pod.speed = Math.hypot(pod.vx, pod.vy);
        pushTrailPoint(pod, 36, { speed: pod.speed });

        const contact = this.sampleDamage(pod, dt);
        if (pod.dead) {
          continue;
        }
        if (contact.touched && contact.drag > 0) {
          const slow = clamp(contact.drag * 0.016, 0, 0.2);
          pod.vx *= 1 - slow;
          pod.vy *= 1 - slow * 0.82;
          pod.speed = Math.hypot(pod.vx, pod.vy);
        }
        const aerodynamicLoss = 9 * dt + pod.speed * 0.014 * dt;
        pod.energy -= aerodynamicLoss + contact.energyLoss;

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
      this.updateBombingTargets(dt);

      if (!state.finished && state.activePods.length === 0 && state.podsLeft <= 0) {
        if (state.targets.some((target) => target.alive)) {
          state.finished = true;
          this.showMessage(`${state.level.name} failed - press R`);
        }
      }

      state.fx = updateFxParticles(state.fx, dt, 110);
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

    updateBombingTargets(dt) {
      for (const target of this.bombing.targets) {
        target.stateTime += dt;
        if (target.alive) {
          if (target.state === "crawl" && target.stateTime >= 1.15) {
            target.state = "standing";
            target.stateTime = 0;
          }
          continue;
        }
        if (target.state === "fall" && target.stateTime >= 0.34) {
          target.state = "explode";
          target.stateTime = 0;
          this.bombing.blastRings.push({
            x: target.x,
            y: target.y - 12 * target.scale,
            radius: 18 * target.scale,
            life: 0.28,
            maxLife: 0.28,
          });
        } else if (target.state === "explode" && target.stateTime >= 0.36) {
          target.state = "sink";
          target.stateTime = 0;
        } else if (target.state === "sink" && target.stateTime >= 1.05) {
          target.state = "gone";
          target.stateTime = 0;
        }
      }
    }

    sampleDamage(pod, dt) {
      const dx = pod.x - pod.prevX;
      const dy = pod.y - pod.prevY;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const steps = Math.ceil(dist / 7);
      const contact = { touched: false, drag: 0, energyLoss: 0 };
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = pod.prevX + dx * t;
        const y = pod.prevY + dy * t;
        const stepScale = dist / Math.max(1, steps) / 7;
        const drillDamage = (6 + pod.speed * 0.014 + pod.drillRadius * 0.42) * stepScale;
        const hit = this.damageAt(x, y, pod.drillRadius, drillDamage, "drill");
        if (hit.touched) {
          contact.touched = true;
          pod.piercedWalls += hit.destroyed;
          contact.drag += hit.resistance;
          contact.energyLoss += hit.resistance * 0.55;
        }
        const surfaceY = sampleIslandSurfaceY(x);
        if (y >= surfaceY + 4 && x > MAP.x && x < MAP.x + MAP.width) {
          contact.touched = true;
          contact.energyLoss += this.handleLandContact(pod, x, y, dt, surfaceY);
          if (pod.dead) {
            break;
          }
          break;
        }
      }
      return contact;
    }

    damageAt(x, y, radius, damage, source) {
      const contact = { touched: false, destroyed: 0, resistance: 0 };
      for (const building of this.bombing.buildings) {
        for (const block of building.blocks) {
          if (block.destroyed || !circleRectIntersects(x, y, radius, block)) {
            continue;
          }
          contact.touched = true;
          contact.resistance += block.row === block.rows - 1 ? 1.45 : 1;
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

    handleLandContact(pod, x, y, dt, surfaceY) {
      const normal = sampleIslandSurfaceNormal(x);
      const impactSpeed = Math.max(0, -(pod.vx * normal.x + pod.vy * normal.y));
      if (Math.random() < 0.16) {
        this.bombing.fx.push({
          x,
          y: Math.min(y, surfaceY + 52),
          vx: normal.x * Phaser.Math.Between(18, 46) + Phaser.Math.Between(-18, 18),
          vy: normal.y * Phaser.Math.Between(26, 64) + Phaser.Math.Between(-12, 12),
          life: 0.42,
          maxLife: 0.42,
          size: Phaser.Math.Between(2, 4),
          color: palette.islandDark,
        });
      }

      if (pod.config.type === "bounce") {
        if (pod.groundCooldown > 0) {
          return 0;
        }
        const restitution = clamp(0.28 + impactSpeed / 620, 0.24, 0.46);
        const tangentDamping = clamp(0.82 - pod.bounces * 0.08, 0.54, 0.82);
        const reflected = reflectVelocity(pod.vx, pod.vy, normal, restitution, tangentDamping);
        pod.x = x + normal.x * (pod.radius + 2);
        pod.y = surfaceY + normal.y * (pod.radius + 2);
        pod.vx = reflected.vx;
        pod.vy = reflected.vy;
        pod.bounces += 1;
        pod.impactGlow = 1;
        pod.groundCooldown = 0.18;
        if (pod.bounces >= pod.config.bounceCount) {
          pod.fuseLeft = Math.min(pod.fuseLeft, 0.25);
        }
        return 8 + impactSpeed * 0.05;
      }
      pod.x = x + normal.x * Math.max(1.2, pod.radius * 0.18);
      pod.y = surfaceY + normal.y * Math.max(1.2, pod.radius * 0.18);
      pod.impactGlow = clamp(impactSpeed / 240, 0.28, 1);
      pod.vx *= pod.config.type === "drill" ? 0.94 : 0.82;
      pod.vy = Math.max(pod.vy * 0.64, 36);
      if (pod.config.type === "timer") {
        pod.fuseLeft = Math.min(pod.fuseLeft, 0.12);
      }
      return pod.config.type === "drill" ? 7 + impactSpeed * 0.028 : 12 + impactSpeed * 0.05;
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
      target.state = "fall";
      target.stateTime = 0;
      this.bombing.score += 120;
      this.score = this.bombing.score;
      this.makeBurst(this.bombing, target.x, target.y - 14 * target.scale, palette.targetDone, 8, 0.42);
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
        this.bombing.advanceAt = this.elapsed + 2.05;
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
        this.bg.fillStyle(0x0f6e90, 0.14);
        this.bg.fillRoundedRect(MAP.x - 10, MAP.y - 8, MAP.width + 20, MAP.height + 16, 14);
        this.bg.fillStyle(0x365c36, 0.34);
        this.bg.beginPath();
        this.bg.moveTo(MAP.x, WORLD.height);
        this.bg.lineTo(MAP.x, sampleIslandSurfaceY(MAP.x));
        for (let x = MAP.x; x <= MAP.x + MAP.width; x += 12) {
          this.bg.lineTo(x, sampleIslandSurfaceY(x));
        }
        this.bg.lineTo(MAP.x + MAP.width, WORLD.height);
        this.bg.closePath();
        this.bg.fillPath();
        this.bg.fillStyle(0x1f3026, 0.24);
        this.bg.beginPath();
        this.bg.moveTo(MAP.x + 18, WORLD.height);
        this.bg.lineTo(MAP.x + 18, sampleIslandSurfaceY(MAP.x + 18) + 26);
        for (let x = MAP.x + 18; x <= MAP.x + MAP.width - 18; x += 16) {
          this.bg.lineTo(x, sampleIslandSurfaceY(x) + 26 + Math.sin((x - MAP.x) * 0.03) * 2);
        }
        this.bg.lineTo(MAP.x + MAP.width - 18, WORLD.height);
        this.bg.closePath();
        this.bg.fillPath();
        this.bg.lineStyle(2.2, 0xc0f2d5, 0.22);
        this.bg.beginPath();
        this.bg.moveTo(MAP.x, sampleIslandSurfaceY(MAP.x));
        for (let x = MAP.x; x <= MAP.x + MAP.width; x += 10) {
          this.bg.lineTo(x, sampleIslandSurfaceY(x));
        }
        this.bg.strokePath();
        this.bg.lineStyle(1.4, 0x9fe7ff, 0.12);
        for (let y = MAP.y + 34; y < SURFACE_Y - 34; y += 48) {
          this.bg.lineBetween(MAP.x + 28, y, MAP.x + MAP.width - 28, y + 8);
        }
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
      this.bg.beginPath();
      this.bg.moveTo(MAP.x, WORLD.height);
      this.bg.lineTo(MAP.x, sampleIslandSurfaceY(MAP.x));
      for (let x = MAP.x; x <= MAP.x + MAP.width; x += 10) {
        this.bg.lineTo(x, sampleIslandSurfaceY(x));
      }
      this.bg.lineTo(MAP.x + MAP.width, WORLD.height);
      this.bg.closePath();
      this.bg.fillPath();
      this.bg.fillStyle(0x7ecb98, 0.72);
      this.bg.fillEllipse(MAP.x + 128, MAP.y + 102, 180, 90);
      this.bg.fillEllipse(MAP.x + 684, MAP.y + 224, 240, 116);
      this.bg.fillStyle(0x358963, 0.58);
      this.bg.fillEllipse(MAP.x + 720, MAP.y + 88, 170, 72);
      this.bg.lineStyle(2.2, 0xc1f2d4, 0.28);
      this.bg.beginPath();
      this.bg.moveTo(MAP.x, sampleIslandSurfaceY(MAP.x));
      for (let x = MAP.x; x <= MAP.x + MAP.width; x += 10) {
        this.bg.lineTo(x, sampleIslandSurfaceY(x));
      }
      this.bg.strokePath();
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
      const config = this.getEditableBombConfig();
      const preview = {
        ...createBombMotionState({ x: futureX, y: this.plane.y, speed: this.plane.speed }, angleDeg, speed),
        config,
        radius: this.bombing.level.podRadius,
        bounces: 0,
      };
      let x = futureX;
      let y = futureY;
      this.trajectory.lineStyle(1, palette.pod, 0.28);
      this.trajectory.beginPath();
      this.trajectory.moveTo(x, y);
      for (let i = 0; i < 42; i += 1) {
        advanceBombPathMotion(preview, 0.035);
        preview.x += preview.vx * 0.035;
        preview.y += preview.vy * 0.035;
        x = preview.x;
        y = preview.y;
        const surfaceY = x > MAP.x && x < MAP.x + MAP.width ? sampleIslandSurfaceY(x) : WORLD.height + 99;
        if (y >= surfaceY && config.type === "bounce" && preview.bounces < config.bounceCount) {
          const normal = sampleIslandSurfaceNormal(x);
          const reflected = reflectVelocity(preview.vx, preview.vy, normal, 0.34, 0.76);
          preview.vx = reflected.vx;
          preview.vy = reflected.vy;
          preview.x = x + normal.x * (preview.radius + 2);
          preview.y = surfaceY + normal.y * (preview.radius + 2);
          preview.bounces += 1;
          x = preview.x;
          y = preview.y;
        } else if (y >= surfaceY + 4) {
          this.trajectory.lineTo(x, surfaceY);
          break;
        }
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
      this.map.beginPath();
      this.map.moveTo(MAP.x + 112, WORLD.height);
      this.map.lineTo(MAP.x + 112, sampleIslandSurfaceY(MAP.x + 112) - 4);
      for (let x = MAP.x + 112; x <= MAP.x + 806; x += 10) {
        this.map.lineTo(x, sampleIslandSurfaceY(x) - 4);
      }
      this.map.lineTo(MAP.x + 806, WORLD.height);
      this.map.closePath();
      this.map.fillPath();
      this.map.lineStyle(2, 0x9bd29e, 0.25);
      this.map.beginPath();
      this.map.moveTo(MAP.x + 112, sampleIslandSurfaceY(MAP.x + 112) - 4);
      for (let x = MAP.x + 112; x <= MAP.x + 806; x += 10) {
        this.map.lineTo(x, sampleIslandSurfaceY(x) - 4);
      }
      this.map.strokePath();
      this.map.fillStyle(0x0f171b, 0.4);
      for (let x = MAP.x + 150; x < MAP.x + 770; x += 84) {
        this.map.fillRect(x, sampleIslandSurfaceY(x) - 7, 3, 55);
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
        if (target.state === "gone") {
          continue;
        }
        const color = target.alive ? palette.target : palette.targetDone;
        const pose = target.state || (target.alive ? "standing" : "sink");
        const poseDuration =
          pose === "crawl" ? 1.15 : pose === "fall" ? 0.34 : pose === "explode" ? 0.36 : pose === "sink" ? 1.05 : 1;
        const progress = clamp(target.stateTime / poseDuration, 0, 1);
        const alpha = target.alive ? 1 : pose === "sink" ? Math.max(0.1, 1 - progress) : 0.86;
        const s = target.scale;
        if (target.alive) {
          this.map.lineStyle(1, color, 0.42);
          this.map.strokeCircle(target.x, target.y - 8 * s, target.hitRadius);
        }
        drawEnemyFigure(this.map, target.x, target.y, color, alpha, s, pose, progress);
      }
    }

    drawPods() {
      for (const pod of this.bombing.activePods) {
        drawMotionTrail(this.dynamic, pod.trail, palette.pod, 0.22, pod.radius * 0.22, blendColor(palette.pod, palette.shock, 0.4));
        const rotation = Math.atan2(pod.vy, pod.vx);
        const r = pod.radius;
        this.dynamic.save();
        this.dynamic.translateCanvas(pod.x, pod.y);
        this.dynamic.rotateCanvas(rotation + (pod.roll || 0));
        this.dynamic.fillStyle(palette.pod, 0.14 + (pod.impactGlow || 0) * 0.2);
        this.dynamic.fillEllipse(-0.4 * r, 0, 4.2 * r, 2 * r);
        this.dynamic.fillStyle(palette.pod, 1);
        this.dynamic.fillRoundedRect(-1.5 * r, -0.72 * r, 3 * r, 1.44 * r, 3);
        this.dynamic.fillStyle(0xf6f0d8, 0.82);
        this.dynamic.fillRoundedRect(-0.95 * r, -0.44 * r, 1.4 * r, 0.48 * r, 2);
        this.dynamic.fillStyle(0x1a2027, 1);
        this.dynamic.fillTriangle(1.12 * r, -0.88 * r, 2.42 * r, 0, 1.12 * r, 0.88 * r);
        this.dynamic.fillStyle(0x2f3d49, 0.96);
        this.dynamic.fillTriangle(-0.96 * r, -0.64 * r, -1.52 * r, -1.22 * r, -0.82 * r, -0.12 * r);
        this.dynamic.fillTriangle(-0.96 * r, 0.64 * r, -1.52 * r, 1.22 * r, -0.82 * r, 0.12 * r);
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
        drawBlastWave(this.fx, { ...ring, color: palette.blast }, palette.shock);
      }
      for (const particle of this.bombing.fx) {
        drawFxParticle(this.fx, particle);
      }
    }

    makeBurst(state, x, y, color, count, sizeScale) {
      const scale = sizeScale || 1;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(24, 96) * scale;
        const shapeRoll = Math.random();
        const life = Phaser.Math.FloatBetween(0.28, 0.66);
        state.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: Phaser.Math.Between(2, 5) * scale,
          color,
          glowColor: shapeRoll < 0.5 ? blendColor(color, palette.shock, 0.3) : blendColor(color, 0xffffff, 0.12),
          shape: shapeRoll < 0.45 ? "spark" : shapeRoll < 0.75 ? "shard" : "smoke",
          spin: Phaser.Math.FloatBetween(-7.5, 7.5),
          gravity: 78 + Phaser.Math.Between(-12, 36),
          drag: 0.75,
          rotation: angle,
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
        shipVx: 0,
        shipVy: 0,
        roll: 0,
        wakePhase: Math.random() * Math.PI * 2,
        armor: 9,
        shieldHp: [3, 3, 3],
        bullets: [],
        playerBullets: [],
        mines: [],
        guns: [],
        launchers: [],
        pickups: [],
        shots: [],
        blasts: [],
        supportMissiles: [],
        enemyMissiles: [],
        fx: [],
        fireCooldown: 0,
        supportFireCooldown: 0,
        pickupCooldown: level.pickupRate * 0.6,
        dualUntil: 0,
        guidedUntil: 0,
        autoTarget: null,
        failed: false,
        finished: false,
        messageUntil: 0,
      };
      for (let i = 0; i < level.guns; i += 1) {
        this.ship.guns.push(this.createShipGun(i, 118 + (i * 62) % 358));
      }
      for (let i = 0; i < level.launchers; i += 1) {
        this.ship.launchers.push(this.createShipLauncher(i, 152 + (i * 126) % 272));
      }
      for (let i = 0; i < level.mines; i += 1) {
        this.ship.mines.push(this.createMine(-Phaser.Math.Between(40, 520)));
      }
      this.showMessage(message || `${level.name}: manual fire, lucky items unlock auto support`);
      this.refreshHud(true);
    }

    createShipGun(index, y) {
      const side = index % 2 === 0 ? -1 : 1;
      return {
        id: `gun-${index}-${Math.random().toString(36).slice(2, 7)}`,
        side,
        y,
        cooldown: Phaser.Math.FloatBetween(0.3, this.ship.level.bulletRate),
        alive: true,
        enemyAlive: true,
        enemyOffsetY: Phaser.Math.Between(-6, 10),
        crew: this.createShipCrew(side),
      };
    }

    createShipCrew(side) {
      const dir = side < 0 ? 1 : -1;
      return [
        { alive: true, offsetX: 14 * dir, offsetY: -17, pose: "crawl", scale: 0.22 },
        { alive: true, offsetX: 40 * dir, offsetY: 8, pose: "standing", scale: 0.24 },
        { alive: true, offsetX: 62 * dir, offsetY: -4, pose: "standing", scale: 0.21 },
      ];
    }

    createShipLauncher(index, y) {
      const side = index % 2 === 0 ? -1 : 1;
      return {
        id: `launcher-${index}-${Math.random().toString(36).slice(2, 7)}`,
        side,
        y,
        alive: true,
        cooldown: this.ship.level.launcherRate + Phaser.Math.FloatBetween(-0.18, 0.16),
      };
    }

    createMine(y) {
      return {
        x: WORLD.width / 2 + Phaser.Math.Between(-SHIP_MINE_SPREAD, SHIP_MINE_SPREAD),
        y,
        pulse: Math.random() * Math.PI * 2,
        exploded: false,
      };
    }

    createShipPickup(y, forcedType) {
      const type = forcedType || Phaser.Utils.Array.GetRandom(SHIP_PICKUP_TYPES);
      return {
        id: `pickup-${type}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        x: WORLD.width / 2 + Phaser.Math.Between(-214, 214),
        y,
        spin: Math.random() * Math.PI * 2,
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
      const shipMotion = advanceBodyWithIntent(
        state,
        dt,
        moveX,
        moveY,
        SHIP_ACCEL,
        SHIP_WATER_DRAG,
        SHIP_MOVE_SPEED,
        "shipX",
        "shipY",
        "shipVx",
        "shipVy",
        {
          minX: SHIP_LIMITS.left - SHIP_CENTER.x,
          maxX: SHIP_LIMITS.right - SHIP_CENTER.x,
          minY: SHIP_LIMITS.top - SHIP_CENTER.y,
          maxY: SHIP_LIMITS.bottom - SHIP_CENTER.y,
        }
      );
      state.roll = approachValue(state.roll || 0, clamp(state.shipVx / SHIP_MOVE_SPEED, -1, 1) * 0.12, dt * 4.6);
      state.wakePhase += dt * (3 + shipMotion.speed * 0.018);
      const ship = this.shipPosition();
      state.fireCooldown = Math.max(0, state.fireCooldown - dt);
      state.supportFireCooldown = Math.max(0, state.supportFireCooldown - dt);
      state.autoTarget = null;
      const handsFree = this.shipHandsFreeActive();
      const autoTargets = !this.firePad.active && handsFree ? this.pickShipAutoTargets(ship) : [];
      state.autoTarget = autoTargets[0] || null;
      if (state.fireCooldown <= 0) {
        if (this.firePad.active) {
          this.fireShipGun(this.firePad);
        } else if (state.autoTarget) {
          if (state.dualUntil > this.elapsed && autoTargets.length > 1) {
            const opposite =
              autoTargets.find((target) => Math.sign(target.x) !== Math.sign(state.autoTarget.x) && target.kind !== "mine") ||
              autoTargets[1] ||
              state.autoTarget;
            this.fireShipGun([state.autoTarget, opposite]);
          } else {
            this.fireShipGun(state.autoTarget);
          }
        }
      }
      if (state.guidedUntil > this.elapsed && state.supportFireCooldown <= 0 && state.autoTarget) {
        this.launchShipSupportMissile(state.autoTarget);
      }

      for (let i = 0; i < state.guns.length; i += 1) {
        const gun = state.guns[i];
        gun.y += state.level.riverSpeed * dt;
        if (gun.y > WORLD.height + 46) {
          Object.assign(gun, this.createShipGun(i, -Phaser.Math.Between(45, 130)));
        }
        if (!gun.alive) {
          continue;
        }
        gun.cooldown -= dt;
        if (gun.y > 58 && gun.y < WORLD.height - 34 && gun.cooldown <= 0) {
          const x = this.shipGunX(gun);
          const y = gun.y;
          const angle = Math.atan2(ship.y - y, ship.x - x);
          state.bullets.push({ x, y, vx: Math.cos(angle) * 168, vy: Math.sin(angle) * 168, life: 4 });
          gun.cooldown = state.level.bulletRate + Phaser.Math.FloatBetween(-0.25, 0.35);
        }
      }

      for (let i = 0; i < state.launchers.length; i += 1) {
        const launcher = state.launchers[i];
        launcher.y += state.level.riverSpeed * dt;
        if (launcher.y > WORLD.height + 68) {
          Object.assign(launcher, this.createShipLauncher(i, -Phaser.Math.Between(80, 200)));
          continue;
        }
        if (!launcher.alive) {
          continue;
        }
        launcher.cooldown -= dt;
        if (launcher.y > 72 && launcher.y < ship.y - 18 && launcher.cooldown <= 0) {
          const x = this.shipLauncherX(launcher) + (launcher.side < 0 ? 10 : -10);
          const y = launcher.y - 16;
          const baseSize = 8 + state.levelIndex * 0.55 + Phaser.Math.FloatBetween(0, 1.2);
          const maxSize = 16 + state.levelIndex * 1.45 + Phaser.Math.FloatBetween(0.3, 2);
          const angle = Math.atan2(ship.y - y, ship.x - x);
          state.enemyMissiles.push({
            x,
            y,
            angle,
            speed: SHIP_ENEMY_MISSILE_SPEED + state.levelIndex * 10 + Phaser.Math.FloatBetween(-4, 8),
            size: baseSize,
            baseSize,
            maxSize,
            displaySize: baseSize,
            pulse: Math.random() * Math.PI * 2,
            danger: 0,
            life: 0,
            dead: false,
            trail: [],
          });
          state.shots.push({
            fromX: x,
            fromY: y,
            x: x + Math.cos(angle) * 38,
            y: y + Math.sin(angle) * 38,
            life: 0.2,
            maxLife: 0.2,
            missile: true,
            hostile: true,
          });
          launcher.cooldown = state.level.launcherRate + Phaser.Math.FloatBetween(-0.14, 0.18);
        }
      }

      for (const bullet of state.playerBullets) {
        bullet.prevX = bullet.x;
        bullet.prevY = bullet.y;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
        let hitHazard = false;
        for (const launcher of state.launchers) {
          if (!launcher.alive) {
            continue;
          }
          const launcherX = this.shipLauncherX(launcher);
          if (pointSegmentDistance(launcherX, launcher.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < 34) {
            bullet.life = 0;
            hitHazard = this.explodeShipLauncher(launcher);
            break;
          }
        }
        if (hitHazard) {
          continue;
        }
        for (const missile of state.enemyMissiles) {
          const missileRadius = (missile.displaySize || missile.size || 10) * 0.48;
          if (!missile.dead && pointSegmentDistance(missile.x, missile.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < missileRadius + 6) {
            missile.dead = true;
            bullet.life = 0;
            hitHazard = true;
            const reward = 36 + Math.round((missile.displaySize || missile.size || 10) * 1.4 + (missile.danger || 0) * 20);
            state.score += reward;
            this.score = state.score;
            this.shipBlast(missile.x, missile.y, 30 + (missile.danger || 0) * 14, blendColor(palette.shock, palette.blast, missile.danger || 0.35), 10, 0.72);
            break;
          }
        }
        if (hitHazard) {
          continue;
        }
        for (const gun of state.guns) {
          if (!gun.alive) {
            continue;
          }
          for (const enemy of this.shipEnemyTargets(gun)) {
            if (pointSegmentDistance(enemy.x, enemy.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < (enemy.slot === "main" ? 12 : 10)) {
              bullet.life = 0;
              hitHazard = this.killShipEnemy(gun, enemy, enemy.slot === "main" ? 18 : 14, "Enemy down");
              break;
            }
          }
          if (hitHazard) {
            break;
          }
          const gunX = this.shipGunX(gun);
          if (pointSegmentDistance(gunX, gun.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < 42) {
            bullet.life = 0;
            hitHazard = this.killShipGun(gun, gunX, gun.y, 40, "Cannon disabled");
            break;
          }
        }
        if (!hitHazard) {
          for (const mine of state.mines) {
            if (mine.exploded) {
              continue;
            }
            const radius = 14 + (mine.alert || 0) * 13;
            if (pointSegmentDistance(mine.x, mine.y, bullet.prevX, bullet.prevY, bullet.x, bullet.y) < radius) {
              mine.exploded = true;
              bullet.life = 0;
              state.score += 28;
              this.score = state.score;
              this.shipHitFx(mine.x, mine.y, palette.blast, 12, 0.72);
              this.showMessage("Mine detonated");
              break;
            }
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
        if (distance < 14) {
          this.failShip("Controller hit");
          bullet.life = 0;
        } else if (distance < 44) {
          if (state.armor > 0) {
            this.damageShipShield("Gun hit");
          } else {
            this.failShip("Hull hit");
          }
          bullet.life = 0;
          this.shipHitFx(bullet.x, bullet.y, palette.shock);
        }
      }
      state.bullets = state.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -40 && bullet.x < WORLD.width + 40 && bullet.y > -40 && bullet.y < WORLD.height + 40);

      for (const mine of state.mines) {
        mine.y += state.level.riverSpeed * dt;
        mine.pulse += dt * 5;
        const distance = Math.hypot(mine.x - ship.x, mine.y - ship.y);
        mine.alert = clamp(1 - distance / 178, 0, 1);
        if (!mine.exploded && distance < 18) {
          mine.exploded = true;
          this.shipHitFx(mine.x, mine.y, palette.blast);
          this.failShip("Controller hit");
        } else if (!mine.exploded && distance < 38 + mine.alert * 26) {
          mine.exploded = true;
          this.shipHitFx(mine.x, mine.y, palette.blast);
          if (state.armor > 0) {
            this.damageShipShield("Mine hit");
          } else {
            this.failShip("Mine breached hull");
          }
        }
        if (mine.y > WORLD.height + 60 || mine.exploded) {
          Object.assign(mine, this.createMine(-Phaser.Math.Between(80, 420)));
        }
      }

      state.pickupCooldown -= dt;
      if (state.pickupCooldown <= 0 && state.pickups.length < 2) {
        state.pickups.push(this.createShipPickup(-Phaser.Math.Between(50, 220)));
        state.pickupCooldown = state.level.pickupRate + Phaser.Math.FloatBetween(-1.2, 0.8);
      }
      for (const pickup of state.pickups) {
        pickup.y += state.level.riverSpeed * dt;
        pickup.spin += dt * 3.2;
        if (Math.hypot(pickup.x - ship.x, pickup.y - ship.y) < 36) {
          pickup.collected = true;
          this.applyShipPickup(pickup.type);
        }
      }
      state.pickups = state.pickups.filter((pickup) => !pickup.collected && pickup.y < WORLD.height + 44);

      for (const missile of state.supportMissiles) {
        missile.life += dt;
        missile.speed += 12 * dt;
        missile.size = Math.min(14, missile.size + 1.4 * dt);
        pushTrailPoint(missile, 18);
        const target = this.pickShipMissileTarget(missile.x, missile.y);
        if (target) {
          missile.targetKind = target.kind;
          missile.targetX = target.x;
          missile.targetY = target.y;
          const targetAngle = Math.atan2(target.y - missile.y, target.x - missile.x);
          missile.angle = turnToward(missile.angle, targetAngle, 1.65 * dt);
        }
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        if (target && Math.hypot(missile.x - target.x, missile.y - target.y) < 18 + missile.size * 0.45) {
          missile.dead = true;
          if (target.kind === "launcher") {
            const launcher = state.launchers.find((item) => item.alive && Math.abs(this.shipLauncherX(item) - target.x) < 2 && Math.abs(item.y - target.y) < 2);
            if (launcher) {
              this.explodeShipLauncher(launcher, "Launcher house destroyed");
            }
          } else if (target.kind === "enemyMissile") {
            const enemyMissile = state.enemyMissiles.find((item) => !item.dead && Math.abs(item.x - target.x) < 3 && Math.abs(item.y - target.y) < 3);
            if (enemyMissile) {
              enemyMissile.dead = true;
              state.score += 42;
              this.score = state.score;
              this.shipBlast(enemyMissile.x, enemyMissile.y, 34, blendColor(palette.shock, palette.blast, enemyMissile.danger || 0.35), 12, 0.78);
            }
          } else if (target.kind === "gun") {
            const gun = state.guns.find((item) => item.alive && Math.abs(this.shipGunX(item) - target.x) < 2 && Math.abs(item.y - target.y) < 2);
            if (gun) {
              this.killShipGun(gun, target.x, target.y, 44, "Guided strike");
            }
          } else if (target.kind === "enemy") {
            const gun = state.guns.find((item) => item.id === target.gunId);
            if (gun) {
              this.killShipEnemy(gun, { crewIndex: target.crewIndex, targetX: target.x, targetY: target.y }, target.crewIndex < 0 ? 24 : 20);
              this.shipBlast(target.x, target.y, 36, palette.shock, 10, 0.72);
            }
          } else if (target.kind === "mine") {
            const mine = state.mines.find((item) => !item.exploded && Math.abs(item.x - target.x) < 2 && Math.abs(item.y - target.y) < 2);
            if (mine) {
              mine.exploded = true;
              state.score += 34;
              this.score = state.score;
              this.shipBlast(target.x, target.y, 42, palette.blast, 12, 0.82);
            }
          }
        } else if (missile.life > 4 || missile.x < -50 || missile.x > WORLD.width + 50 || missile.y < -50 || missile.y > WORLD.height + 50) {
          missile.dead = true;
        }
      }
      state.supportMissiles = state.supportMissiles.filter((missile) => !missile.dead);

      for (const missile of state.enemyMissiles) {
        missile.life += dt;
        missile.speed += 8 * dt;
        missile.pulse += dt * (5.4 + state.levelIndex * 0.45);
        pushTrailPoint(missile, 16);
        missile.size = Math.min(missile.maxSize || 16, missile.size + (2 + state.levelIndex * 0.24) * dt);
        missile.displaySize = clamp(
          missile.size + Math.sin(missile.pulse) * 1.05,
          (missile.baseSize || missile.size) * 0.92,
          (missile.maxSize || missile.size) + 0.8
        );
        missile.danger = clamp(
          ((missile.displaySize || missile.size) - (missile.baseSize || missile.size)) /
            Math.max(1, (missile.maxSize || missile.size) - (missile.baseSize || missile.size)),
          0,
          1
        );
        const targetAngle = Math.atan2(ship.y - missile.y, ship.x - missile.x);
        missile.angle = turnToward(missile.angle, targetAngle, SHIP_ENEMY_MISSILE_TURN * dt);
        missile.x += Math.cos(missile.angle) * missile.speed * dt;
        missile.y += Math.sin(missile.angle) * missile.speed * dt;
        const distance = Math.hypot(missile.x - ship.x, missile.y - ship.y);
        if (distance < 16) {
          missile.dead = true;
          this.shipBlast(missile.x, missile.y, 44, palette.blast, 16, 1.08);
          this.failShip("Controller hit");
        } else if (distance < 52) {
          missile.dead = true;
          this.shipBlast(missile.x, missile.y, 46, palette.blast, 16, 1.08);
          if (state.armor > 0) {
            this.damageShipShield("Missile hit");
          } else {
            this.failShip("Missile breached hull");
          }
        } else if (missile.y > WORLD.height + 56 || missile.x < -80 || missile.x > WORLD.width + 80 || missile.life > 5.2) {
          missile.dead = true;
        }
      }
      state.enemyMissiles = state.enemyMissiles.filter((missile) => !missile.dead);

      state.fx = updateFxParticles(state.fx, dt, 18);
      for (const shot of state.shots) {
        shot.life -= dt;
      }
      state.shots = state.shots.filter((shot) => shot.life > 0);
      for (const blast of state.blasts) {
        blast.life -= dt;
      }
      state.blasts = state.blasts.filter((blast) => blast.life > 0);

      if (state.timeLeft <= 0) {
        state.finished = true;
        this.score += state.armor * 30;
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

    shipGunX(gun) {
      return gun.side < 0 ? SHIP_GUN_LEFT_X : SHIP_GUN_RIGHT_X;
    }

    shipLauncherX(launcher) {
      return launcher.side < 0 ? SHIP_LAUNCHER_LEFT_X : SHIP_LAUNCHER_RIGHT_X;
    }

    shipEnemyPosition(gun) {
      return {
        x: this.shipGunX(gun) + (gun.side < 0 ? 34 : -34),
        y: gun.y + (gun.enemyOffsetY || 0) + 12,
      };
    }

    shipEnemyTargets(gun) {
      const targets = [];
      if (gun.enemyAlive) {
        const enemy = this.shipEnemyPosition(gun);
        targets.push({ slot: "main", crewIndex: -1, x: enemy.x, y: enemy.y, pose: "standing", scale: 0.28 });
      }
      if (gun.crew) {
        gun.crew.forEach((crew, crewIndex) => {
          if (!crew.alive) {
            return;
          }
          targets.push({
            slot: `crew-${crewIndex}`,
            crewIndex,
            x: this.shipGunX(gun) + crew.offsetX,
            y: gun.y + crew.offsetY,
            pose: crew.pose || "standing",
            scale: crew.scale || 0.23,
          });
        });
      }
      return targets;
    }

    shipHandsFreeActive() {
      return this.ship && (this.ship.dualUntil > this.elapsed || this.ship.guidedUntil > this.elapsed);
    }

    shipShieldTotal() {
      return this.ship ? this.ship.shieldHp.reduce((sum, hp) => sum + hp, 0) : 0;
    }

    damageShipShield(messageBase) {
      if (!this.ship) {
        return false;
      }
      const labels = ["Core", "Mid", "Outer"];
      for (let index = this.ship.shieldHp.length - 1; index >= 0; index -= 1) {
        if (this.ship.shieldHp[index] <= 0) {
          continue;
        }
        this.ship.shieldHp[index] -= 1;
        this.ship.armor = this.shipShieldTotal();
        if (this.ship.shieldHp[index] <= 0) {
          this.showMessage(`${labels[index]} shield down`);
        } else if (messageBase) {
          this.showMessage(`${messageBase} ${labels[index]} ${this.ship.shieldHp[index]}/3`);
        }
        return true;
      }
      return false;
    }

    shipBlast(x, y, radius, color, count, scale) {
      this.ship.blasts.push({
        x,
        y,
        radius,
        color: color || palette.blast,
        life: 0.4,
        maxLife: 0.4,
      });
      this.shipHitFx(x, y, color || palette.blast, count || 16, scale || 1);
    }

    killShipGun(gun, x, y, score, message) {
      if (!gun || !gun.alive) {
        return false;
      }
      gun.alive = false;
      gun.enemyAlive = false;
      if (gun.crew) {
        gun.crew.forEach((crew) => {
          crew.alive = false;
        });
      }
      this.ship.score += score || 40;
      this.score = this.ship.score;
      this.shipBlast(x, y, 26, palette.blast, 10, 0.84);
      if (message) {
        this.showMessage(message);
      }
      return true;
    }

    killShipEnemy(gun, enemy, score, message) {
      if (!gun || !enemy) {
        return false;
      }
      if (enemy.crewIndex == null || enemy.crewIndex < 0) {
        if (!gun.enemyAlive) {
          return false;
        }
        gun.enemyAlive = false;
      } else {
        const crew = gun.crew && gun.crew[enemy.crewIndex];
        if (!crew || !crew.alive) {
          return false;
        }
        crew.alive = false;
      }
      const x = enemy.targetX ?? enemy.x;
      const y = enemy.targetY ?? enemy.y;
      this.ship.score += score || 18;
      this.score = this.ship.score;
      this.shipHitFx(x, y, palette.targetDone, 7, 0.58);
      if (message) {
        this.showMessage(message);
      }
      return true;
    }

    explodeShipLauncher(launcher, sourceMessage) {
      if (!launcher || !launcher.alive) {
        return false;
      }
      launcher.alive = false;
      const x = this.shipLauncherX(launcher);
      const y = launcher.y;
      this.ship.score += 65;
      this.score = this.ship.score;
      this.shipBlast(x, y, 116, palette.blast, 20, 1.35);
      for (const gun of this.ship.guns) {
        if (!gun.alive) {
          continue;
        }
        const gunX = this.shipGunX(gun);
        if (Math.hypot(gunX - x, gun.y - y) <= 118) {
          this.killShipGun(gun, gunX, gun.y, 24);
        } else {
          for (const enemy of this.shipEnemyTargets(gun)) {
            if (Math.hypot(enemy.x - x, enemy.y - y) <= 122) {
              this.killShipEnemy(gun, enemy, enemy.slot === "main" ? 18 : 14);
            }
          }
        }
      }
      for (const other of this.ship.launchers) {
        if (other !== launcher && other.alive) {
          const otherX = this.shipLauncherX(other);
          if (Math.hypot(otherX - x, other.y - y) <= 88) {
            other.alive = false;
            this.shipHitFx(otherX, other.y, palette.blast, 10, 0.8);
          }
        }
      }
      this.showMessage(sourceMessage || "Launcher house destroyed");
      return true;
    }

    pickShipAutoTargets(ship) {
      if (!this.ship) {
        return [];
      }
      const fromY = ship.y - 36;
      const targets = [];
      const consider = (kind, x, y, bias, alert, extra) => {
        if (y < -28 || y > ship.y + 72 || x < 0 || x > WORLD.width) {
          return;
        }
        const distance = Math.hypot(x - ship.x, y - fromY);
        const score = distance + bias - (alert || 0) * 90;
        targets.push({
          kind,
          x: x - ship.x,
          y: y - fromY,
          targetX: x,
          targetY: y,
          score,
          ...(extra || {}),
        });
      };

      for (const launcher of this.ship.launchers) {
        if (!launcher.alive) {
          continue;
        }
        consider("launcher", this.shipLauncherX(launcher), launcher.y, -170, 0);
      }
      for (const missile of this.ship.enemyMissiles) {
        if (!missile.dead) {
          consider("enemyMissile", missile.x, missile.y, -230, missile.danger || 0.3);
        }
      }
      for (const gun of this.ship.guns) {
        if (!gun.alive) {
          continue;
        }
        consider("gun", this.shipGunX(gun), gun.y, -140, 0);
        for (const enemy of this.shipEnemyTargets(gun)) {
          consider("enemy", enemy.x, enemy.y, enemy.slot === "main" ? -110 : -94, 0, { gunId: gun.id, crewIndex: enemy.crewIndex });
        }
      }
      for (const mine of this.ship.mines) {
        if (mine.exploded) {
          continue;
        }
        consider("mine", mine.x, mine.y, mine.y > ship.y - 24 ? -70 : 26, mine.alert || 0);
      }
      targets.sort((a, b) => a.score - b.score);
      return targets;
    }

    pickShipMissileTarget(x, y) {
      const hazards = [];
      for (const launcher of this.ship.launchers) {
        if (launcher.alive) {
          hazards.push({ kind: "launcher", x: this.shipLauncherX(launcher), y: launcher.y });
        }
      }
      for (const missile of this.ship.enemyMissiles) {
        if (!missile.dead) {
          hazards.push({ kind: "enemyMissile", x: missile.x, y: missile.y });
        }
      }
      for (const gun of this.ship.guns) {
        if (gun.alive) {
          hazards.push({ kind: "gun", x: this.shipGunX(gun), y: gun.y });
          for (const enemy of this.shipEnemyTargets(gun)) {
            hazards.push({ kind: "enemy", x: enemy.x, y: enemy.y, gunId: gun.id, crewIndex: enemy.crewIndex });
          }
        }
      }
      for (const mine of this.ship.mines) {
        if (!mine.exploded) {
          hazards.push({ kind: "mine", x: mine.x, y: mine.y });
        }
      }
      hazards.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
      return hazards[0] || null;
    }

    launchShipSupportMissile(target) {
      const ship = this.shipPosition();
      this.ship.supportMissiles.push({
        x: ship.x,
        y: ship.y - 18,
        angle: Math.atan2(target.targetY - (ship.y - 18), target.targetX - ship.x),
        speed: SHIP_SUPPORT_MISSILE_SPEED,
        size: 9,
        life: 0,
        targetKind: target.kind,
        targetX: target.targetX,
        targetY: target.targetY,
        dead: false,
        trail: [],
      });
      this.ship.supportFireCooldown = SHIP_SUPPORT_MISSILE_FIRE_RATE;
      this.ship.shots.push({
        fromX: ship.x,
        fromY: ship.y - 18,
        x: ship.x,
        y: ship.y - 18,
        life: 0.18,
        maxLife: 0.18,
        missile: true,
        guided: true,
      });
    }

    applyShipPickup(type) {
      if (!this.ship) {
        return;
      }
      if (type === "health") {
        this.ship.shieldHp = [3, 3, 3];
        this.ship.armor = this.shipShieldTotal();
        this.shipBlast(this.shipPosition().x, this.shipPosition().y - 4, 42, palette.targetDone, 12, 0.88);
        this.showMessage("Shield restored");
        return;
      }
      if (type === "star") {
        this.ship.dualUntil = Math.max(this.ship.dualUntil, this.elapsed + SHIP_DUAL_DURATION);
        this.ship.score += 60;
        this.score = this.ship.score;
        this.showMessage("Twin guns online");
        return;
      }
      if (type === "smallgun") {
        this.ship.guidedUntil = Math.max(this.ship.guidedUntil, this.elapsed + SHIP_GUIDED_DURATION);
        this.ship.score += 50;
        this.score = this.ship.score;
        this.showMessage("Guided missiles online");
        return;
      }
      this.ship.score += 120;
      this.score = this.ship.score;
      this.showMessage("Medal +120");
    }

    fireShipGun(directions) {
      if (!this.ship || this.ship.failed || this.ship.finished) {
        return;
      }
      const ship = this.shipPosition();
      const list = Array.isArray(directions) ? directions : [directions];
      const dualActive = this.ship.dualUntil > this.elapsed;
      const muzzles = dualActive ? [-16, 16] : [0];
      for (let i = 0; i < muzzles.length; i += 1) {
        const direction = list[Math.min(i, list.length - 1)] || list[0];
        const dx = direction && Math.abs(direction.x) + Math.abs(direction.y) > 0.08 ? direction.x : 0;
        const dy = direction && Math.abs(direction.x) + Math.abs(direction.y) > 0.08 ? direction.y : -1;
        const length = Math.hypot(dx, dy) || 1;
        const fromX = ship.x + muzzles[i];
        const fromY = ship.y - 36;
        const inheritedVx = (this.ship.shipVx || 0) * 0.24;
        const inheritedVy = (this.ship.shipVy || 0) * 0.24;
        this.ship.playerBullets.push({
          x: fromX,
          y: fromY,
          prevX: fromX,
          prevY: fromY,
          vx: (dx / length) * SHIP_BULLET_SPEED + inheritedVx,
          vy: (dy / length) * SHIP_BULLET_SPEED + inheritedVy,
          life: SHIP_BULLET_LIFE,
        });
        this.ship.shots.push({
          fromX,
          fromY,
          x: fromX + (dx / length) * 520,
          y: fromY + (dy / length) * 520,
          life: 0.18,
          maxLife: 0.18,
          missile: false,
        });
      }
      this.ship.fireCooldown = SHIP_FIRE_RATE;
    }

    shipHitFx(x, y, color, count, sizeScale) {
      const total = count || 12;
      const scale = sizeScale || 1;
      for (let i = 0; i < total; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(30, 128) * scale;
        const roll = Math.random();
        const life = Phaser.Math.FloatBetween(0.28, 0.52) + 0.08 * scale;
        this.ship.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: Phaser.Math.Between(2, 5) * scale,
          color,
          glowColor: roll < 0.55 ? blendColor(color, palette.shock, 0.45) : blendColor(color, 0xffffff, 0.18),
          shape: roll < 0.52 ? "spark" : roll < 0.78 ? "shard" : "smoke",
          gravity: Phaser.Math.FloatBetween(4, 36),
          drag: 0.5,
          rotation: angle,
          spin: Phaser.Math.FloatBetween(-8, 8),
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
        this.bg.fillStyle(0x031622, 0.12);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(0x0ca7d8, 0.08);
        this.bg.fillRoundedRect(SHIP_WATER_LEFT, -32, SHIP_WATER_WIDTH, WORLD.height + 64, 26);
        this.bg.fillStyle(0x7ef4ff, 0.05);
        this.bg.fillRoundedRect(SHIP_WATER_LEFT + 42, -18, SHIP_WATER_WIDTH - 84, WORLD.height + 36, 22);
      } else {
        this.bg.fillStyle(0x7fb7ce, 1);
        this.bg.fillRect(0, 0, WORLD.width, WORLD.height);
        this.bg.fillStyle(palette.bank, 1);
        this.bg.fillRect(0, 0, 214, WORLD.height);
        this.bg.fillRect(746, 0, 214, WORLD.height);
        this.bg.fillStyle(0x405336, 1);
        this.bg.fillRect(0, 0, 158, WORLD.height);
        this.bg.fillRect(802, 0, 158, WORLD.height);
        this.bg.fillStyle(palette.river, 1);
        this.bg.fillRoundedRect(SHIP_WATER_LEFT, -20, SHIP_WATER_WIDTH, WORLD.height + 40, 16);
        this.bg.fillStyle(palette.riverDark, 0.28);
        for (let y = -80 + (state.scroll % 96); y < WORLD.height + 90; y += 96) {
          this.bg.fillRoundedRect(468, y, 24, 64, 10);
          this.bg.fillRoundedRect(332, y + 30, 14, 50, 8);
          this.bg.fillRoundedRect(618, y + 12, 14, 50, 8);
        }
      }
      this.drawShipMotionLayer(state);

      for (const launcher of state.launchers) {
        if (!launcher.alive || launcher.y < -42 || launcher.y > WORLD.height + 42) {
          continue;
        }
        const x = this.shipLauncherX(launcher);
        const baseX = x + (launcher.side < 0 ? -26 : -34);
        this.map.fillStyle(0x5f5143, 1);
        this.map.fillRoundedRect(baseX, launcher.y - 20, 60, 38, 6);
        this.map.fillStyle(0x8d6f55, 1);
        this.map.fillTriangle(baseX - 4, launcher.y - 20, baseX + 30, launcher.y - 38, baseX + 64, launcher.y - 20);
        this.map.fillStyle(0x2a3138, 1);
        this.map.fillRoundedRect(baseX + 18, launcher.y - 14, 24, 22, 4);
        this.map.fillStyle(palette.pod, 0.92);
        this.map.fillTriangle(baseX + 28, launcher.y - 28, baseX + 38, launcher.y - 10, baseX + 18, launcher.y - 10);
        this.map.lineStyle(1, 0xfcefb5, 0.2);
        this.map.strokeRoundedRect(baseX, launcher.y - 20, 60, 38, 6);
      }

      for (const gun of state.guns) {
        if (!gun.alive || gun.y < -32 || gun.y > WORLD.height + 32) {
          continue;
        }
        const x = this.shipGunX(gun);
        this.map.fillStyle(0x2d3338, 1);
        this.map.fillRoundedRect(x - 14, gun.y - 12, 28, 24, 4);
        this.map.fillStyle(0x1a2026, 1);
        this.map.fillRect(x + (gun.side < 0 ? 8 : -28), gun.y - 3, 20, 6);
        for (const enemy of this.shipEnemyTargets(gun)) {
          drawEnemyFigure(this.map, enemy.x, enemy.y, palette.target, 1, enemy.scale, enemy.pose, 1);
        }
      }

      for (const mine of state.mines) {
        const alert = mine.alert || 0;
        const radius = 5 + alert * 15 + Math.sin(mine.pulse) * (1 + alert * 2);
        this.map.lineStyle(1.5, 0xffb0a0, 0.18 + alert * 0.68);
        for (let i = 0; i < 8; i += 1) {
          const angle = mine.pulse * 0.22 + (i / 8) * Math.PI * 2;
          this.map.lineBetween(
            mine.x + Math.cos(angle) * radius * 0.72,
            mine.y + Math.sin(angle) * radius * 0.72,
            mine.x + Math.cos(angle) * (radius + 6),
            mine.y + Math.sin(angle) * (radius + 6)
          );
        }
        this.map.fillStyle(0xff2f2f, 0.22 + alert * 0.7);
        this.map.fillCircle(mine.x, mine.y, radius);
        this.map.lineStyle(1, 0xffb0a0, 0.2 + alert * 0.6);
        this.map.strokeCircle(mine.x, mine.y, radius + 5);
      }

      for (const pickup of state.pickups) {
        this.dynamic.save();
        this.dynamic.translateCanvas(pickup.x, pickup.y);
        this.dynamic.rotateCanvas(pickup.spin);
        if (pickup.type === "star") {
          this.dynamic.fillStyle(0xffd55a, 1);
          this.dynamic.beginPath();
          for (let i = 0; i < 5; i += 1) {
            const outer = (-Math.PI / 2) + (i * Math.PI * 2) / 5;
            const inner = outer + Math.PI / 5;
            if (i === 0) {
              this.dynamic.moveTo(Math.cos(outer) * 13, Math.sin(outer) * 13);
            } else {
              this.dynamic.lineTo(Math.cos(outer) * 13, Math.sin(outer) * 13);
            }
            this.dynamic.lineTo(Math.cos(inner) * 6, Math.sin(inner) * 6);
          }
          this.dynamic.closePath();
          this.dynamic.fillPath();
        } else if (pickup.type === "medal") {
          this.dynamic.fillStyle(0xb884ff, 1);
          this.dynamic.fillRect(-5, -14, 4, 11);
          this.dynamic.fillRect(1, -14, 4, 11);
          this.dynamic.fillStyle(0xffd267, 1);
          this.dynamic.fillCircle(0, 3, 11);
          this.dynamic.lineStyle(2, 0xfff0b3, 0.68);
          this.dynamic.strokeCircle(0, 3, 7);
        } else if (pickup.type === "health") {
          this.dynamic.fillStyle(0xe8f5ff, 1);
          this.dynamic.fillRoundedRect(-13, -12, 26, 24, 6);
          this.dynamic.fillStyle(0xff6b5d, 1);
          this.dynamic.fillRect(-4, -8, 8, 16);
          this.dynamic.fillRect(-8, -4, 16, 8);
        } else {
          this.dynamic.fillStyle(0x243341, 1);
          this.dynamic.fillRoundedRect(-12, -9, 24, 18, 5);
          this.dynamic.fillStyle(0x9bd5ff, 1);
          this.dynamic.fillRect(-1, -11, 10, 6);
          this.dynamic.fillRect(-10, -2, 16, 4);
          this.dynamic.fillStyle(0xffcc4d, 0.9);
          this.dynamic.fillCircle(5, -6, 3);
        }
        this.dynamic.restore();
        this.dynamic.lineStyle(1.5, 0xffffff, 0.24);
        this.dynamic.strokeCircle(pickup.x, pickup.y, 16);
      }

      for (const bullet of state.bullets) {
        const tailX = bullet.x - bullet.vx * 0.022;
        const tailY = bullet.y - bullet.vy * 0.022;
        drawTracerRound(this.dynamic, tailX, tailY, bullet.x, bullet.y, 0xffefe0, 0.95, 2.4, 3.4, 0.45);
      }

      for (const shot of state.shots) {
        const alpha = clamp(shot.life / shot.maxLife, 0, 1);
        const color = shot.hostile ? 0xff4f96 : shot.missile ? palette.blast : palette.shock;
        drawTracerRound(
          this.dynamic,
          shot.fromX,
          shot.fromY,
          shot.x,
          shot.y,
          color,
          alpha,
          shot.guided || shot.hostile ? 3.1 : 2.2,
          shot.guided || shot.hostile ? 4.6 : 3.2,
          shot.hostile ? 0.42 : 0.3
        );
      }

      for (const bullet of state.playerBullets) {
        drawTracerRound(this.dynamic, bullet.prevX, bullet.prevY, bullet.x, bullet.y, palette.shock, 0.95, 2.1, 3.1, 0.36);
      }

      for (const missile of state.supportMissiles) {
        drawMotionTrail(this.dynamic, missile.trail, 0x7ec8ff, 0.18, 2.2, 0xffebaa);
        drawRocketSprite(this.dynamic, missile.x, missile.y, missile.angle, Math.max(8, missile.size || 9), {
          body: 0xdde8ee,
          hot: 0xffd058,
          glow: blendColor(palette.blast, palette.shock, 0.26),
          stripe: 0x7ec8ff,
          flame: 0xff7c56,
          ember: palette.shock,
          core: 0x23354a,
        }, missile.life * 8, 0.22);
      }

      for (const missile of state.enemyMissiles) {
        const missileSize = missile.displaySize || missile.size || 10;
        const hotColor = blendColor(0xff69b4, 0xff3f74, missile.danger || 0);
        const bodyColor = blendColor(0x4b153a, 0xffb0d6, (missile.danger || 0) * 0.74);
        const glowColor = blendColor(0xb33b74, 0xff4f96, missile.danger || 0);
        drawMotionTrail(this.dynamic, missile.trail, glowColor, 0.16 + (missile.danger || 0) * 0.1, 2.1, hotColor);
        drawRocketSprite(this.dynamic, missile.x, missile.y, missile.angle, missileSize, {
          body: bodyColor,
          hot: hotColor,
          glow: glowColor,
          stripe: blendColor(bodyColor, 0xffffff, 0.18),
          flame: 0xff7c56,
          ember: blendColor(palette.shock, 0xffd18a, 0.25),
          core: 0x20303e,
        }, missile.pulse, missile.danger || 0);
        this.dynamic.lineStyle(1.6, glowColor, 0.28 + (missile.danger || 0) * 0.28);
        this.dynamic.strokeCircle(missile.x, missile.y, missileSize + 3 + Math.sin(missile.pulse || 0) * 1.2);
      }

      for (const blast of state.blasts) {
        drawBlastWave(this.fx, blast);
      }

      const ship = this.shipPosition();
      const speedRatio = clamp(Math.hypot(state.shipVx, state.shipVy) / SHIP_MOVE_SPEED, 0, 1);
      const wakeAlpha = 0.12 + speedRatio * 0.2;
      this.dynamic.fillStyle(0xdff8ff, wakeAlpha * 0.32);
      this.dynamic.fillEllipse(ship.x - state.shipVx * 0.045, ship.y + 54, 56 + speedRatio * 24, 16 + speedRatio * 6);
      this.dynamic.lineStyle(2, 0xe3fbff, wakeAlpha);
      for (let wave = 0; wave < 3; wave += 1) {
        const waveShift = state.wakePhase * (1.35 + wave * 0.22) + wave * 0.8;
        const waveY = ship.y + 44 + wave * 12;
        const spread = 26 + wave * 13 + speedRatio * 18;
        this.dynamic.beginPath();
        this.dynamic.moveTo(ship.x - 10, waveY);
        this.dynamic.lineTo(ship.x - spread, waveY + Math.sin(waveShift) * (4 + speedRatio * 2));
        this.dynamic.moveTo(ship.x + 10, waveY);
        this.dynamic.lineTo(ship.x + spread, waveY + Math.cos(waveShift) * (4 + speedRatio * 2));
        this.dynamic.strokePath();
      }
      const aimGuide = this.firePad.active ? this.firePad : state.autoTarget;
      if (aimGuide) {
        const length = Math.hypot(aimGuide.x, aimGuide.y) || 1;
        this.dynamic.lineStyle(2, palette.shock, 0.38);
        this.dynamic.lineBetween(ship.x, ship.y - 36, ship.x + (aimGuide.x / length) * 82, ship.y - 36 + (aimGuide.y / length) * 82);
      }
      if (state.autoTarget && !this.firePad.active) {
        this.dynamic.lineStyle(1.5, 0x7ef4ff, 0.26);
        this.dynamic.strokeCircle(state.autoTarget.targetX, state.autoTarget.targetY, state.autoTarget.kind === "launcher" ? 22 : state.autoTarget.kind === "gun" ? 18 : 14);
      }
      this.shipSprite.setPosition(ship.x, ship.y + 6);
      this.shipSprite.setRotation(state.roll || 0);
      this.shipSprite.setScale(1 + Math.abs(state.roll || 0) * 0.08, 1);
      this.dynamic.save();
      this.dynamic.translateCanvas(ship.x, ship.y);
      const shieldColors = [0x9bd5ff, 0xffcc4d, 0x5ee3a2];
      for (let layer = 0; layer < state.shieldHp.length; layer += 1) {
        const hp = state.shieldHp[layer];
        const color = shieldColors[layer];
        const alpha = hp > 0 ? 0.28 + (hp / 3) * 0.55 : 0.18;
        this.dynamic.lineStyle(3, color, alpha);
        this.dynamic.strokeRoundedRect(-28 - layer * 8, -45 - layer * 8, 56 + layer * 16, 90 + layer * 16, 18);
        if (hp <= 0) {
          this.dynamic.lineBetween(-22 - layer * 7, -28 - layer * 8, 18 + layer * 7, 24 + layer * 8);
          this.dynamic.lineBetween(-18 - layer * 7, 30 + layer * 8, 24 + layer * 7, -18 - layer * 8);
        }
      }
      this.dynamic.fillStyle(0x07131d, 0.82);
      this.dynamic.fillRoundedRect(-62, -78, 124, 16, 7);
      for (let layer = 0; layer < state.shieldHp.length; layer += 1) {
        const hp = state.shieldHp[layer];
        const color = shieldColors[layer];
        const x = -58 + layer * 40;
        this.dynamic.fillStyle(color, 0.16);
        this.dynamic.fillRoundedRect(x, -74, 34, 8, 4);
        if (hp > 0) {
          this.dynamic.fillStyle(color, 0.92);
          this.dynamic.fillRoundedRect(x, -74, 34 * (hp / 3), 8, 4);
        }
        this.dynamic.lineStyle(1, color, 0.42);
        this.dynamic.strokeRoundedRect(x, -74, 34, 8, 4);
      }
      this.dynamic.restore();

      for (const particle of state.fx) {
        drawFxParticle(this.fx, particle);
      }
    }

    drawShipMotionLayer(state) {
      const offset = state.scroll % 118;
      this.bg.lineStyle(2, 0xdff8ff, 0.24);
      this.bg.fillStyle(0xdff8ff, 0.08);
      for (let y = -120 + offset; y < WORLD.height + 140; y += 118) {
        this.bg.strokeRoundedRect(332, y + 18, 36, 56, 14);
        this.bg.strokeRoundedRect(430, y + 6, 28, 62, 12);
        this.bg.strokeRoundedRect(560, y + 42, 30, 54, 12);
        this.bg.strokeRoundedRect(644, y + 12, 26, 48, 10);
        this.bg.fillStyle(0x6de9ff, 0.14);
        this.bg.fillRoundedRect(462, y + 74, 42, 7, 4);
        this.bg.fillRoundedRect(386, y + 52, 28, 6, 4);
      }

      this.bg.lineStyle(2, 0xffffff, 0.16);
      for (let y = -90 + (state.scroll % 86); y < WORLD.height + 120; y += 86) {
        this.bg.beginPath();
        this.bg.moveTo(302, y + 10);
        this.bg.lineTo(342, y + 24);
        this.bg.lineTo(384, y + 16);
        this.bg.lineTo(430, y + 34);
        this.bg.lineTo(486, y + 18);
        this.bg.lineTo(548, y + 36);
        this.bg.lineTo(602, y + 22);
        this.bg.lineTo(660, y + 42);
        this.bg.strokePath();
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
        heliVx: 0,
        heliVy: 0,
        bank: 0,
        rotor: 0,
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
      const immediateHoles = Math.ceil(level.holes * 0.58);
      for (let i = 0; i < level.holes; i += 1) {
        const [x, y, r] = HELI_HOLE_POSITIONS[i % HELI_HOLE_POSITIONS.length];
        const spawnDelay = i < immediateHoles ? 0 : (i - immediateHoles + 1) * 1.25 + Phaser.Math.FloatBetween(0.1, 0.55);
        this.heli.holes.push({
          x,
          y,
          r,
          state: spawnDelay > 0 ? "hidden" : "open",
          timer: spawnDelay > 0 ? -spawnDelay : Phaser.Math.FloatBetween(0.2, 1.8),
          appearDuration: HELI_HOLE_APPEAR_TIME + Phaser.Math.FloatBetween(-0.12, 0.18),
          missileCooldown: level.missileRate,
        });
      }
      this.showMessage(message || `${level.name}: move, fire holes and missiles`);
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
      if (this.mode === "ship") {
        const state = this.ship;
        if (!state || state.failed || state.finished || state.fireCooldown > 0) {
          return;
        }
        const ship = this.shipPosition();
        this.fireShipGun({ x: pointer.x - ship.x, y: pointer.y - (ship.y - 36) });
        return;
      }
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
        const missileRadius = (missile.displaySize || missile.size || 12) * 0.5;
        const distance = isMissile
          ? Math.hypot(missile.x - x, missile.y - y)
          : pointSegmentDistance(missile.x, missile.y, fromX, fromY, x, y);
        if (!missile.dead && distance <= radius + missileRadius) {
          missile.dead = true;
          const reward = 55 + Math.round((missile.displaySize || missile.size || 12) * 3 + (missile.danger || 0) * 40);
          state.score += reward;
          this.score = state.score;
          this.heliBurst(missile.x, missile.y, blendColor(palette.shock, palette.blast, missile.danger || 0.45), 12);
          this.showMessage(`Missile down +${reward}`);
        }
      }

      for (const hole of state.holes) {
        if (hole.state === "hidden") {
          continue;
        }
        const holeScale =
          hole.state === "appearing" ? clamp(hole.timer / (hole.appearDuration || HELI_HOLE_APPEAR_TIME), 0.25, 1) : 1;
        const distance = isMissile
          ? Math.hypot(hole.x - x, hole.y - y)
          : pointSegmentDistance(hole.x, hole.y, fromX, fromY, x, y);
        if (distance <= radius + hole.r * holeScale * 0.5) {
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
      const heliMotion = advanceBodyWithIntent(
        state,
        dt,
        moveX,
        moveY,
        HELI_ACCEL,
        HELI_AIR_DRAG,
        HELI_MOVE_SPEED,
        "heliX",
        "heliY",
        "heliVx",
        "heliVy",
        {
          minX: HELI_LIMITS.left - HELI_BASE.x,
          maxX: HELI_LIMITS.right - HELI_BASE.x,
          minY: HELI_LIMITS.top - HELI_BASE.y,
          maxY: HELI_LIMITS.bottom - HELI_BASE.y,
        }
      );
      state.bank = approachValue(state.bank || 0, clamp(state.heliVx / HELI_MOVE_SPEED, -1, 1) * 0.18, dt * 4.4);
      state.rotor += dt * (14 + heliMotion.speed * 0.025);
      state.fireCooldown = Math.max(0, state.fireCooldown - dt);
      if (this.firePad.active && state.fireCooldown <= 0) {
        const heli = this.heliPosition();
        const length = Math.hypot(this.firePad.x, this.firePad.y) || 1;
        this.fireHeliWeapon(heli.x + (this.firePad.x / length) * 520, heli.y - 18 + (this.firePad.y / length) * 520);
        state.fireCooldown = state.weapon === "missile" ? 0.46 : HELI_FIRE_RATE;
      }

      for (const hole of state.holes) {
        if (hole.state === "hidden") {
          hole.timer += dt;
          if (hole.timer >= 0) {
            hole.state = "appearing";
            hole.timer = 0;
          }
          continue;
        }
        if (hole.state === "appearing") {
          hole.timer += dt;
          if (hole.timer >= (hole.appearDuration || HELI_HOLE_APPEAR_TIME)) {
            hole.state = "open";
            hole.timer = 0;
          }
          continue;
        }
        if (hole.state === "closed") {
          hole.timer -= dt;
          if (hole.timer <= 0) {
            hole.state = "appearing";
            hole.timer = 0;
          }
          continue;
        }
        hole.timer += dt;
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
            const baseSize = 9 + state.levelIndex * 0.7 + Phaser.Math.FloatBetween(0, 1.6);
            const maxSize = 18 + state.levelIndex * 1.6 + Phaser.Math.FloatBetween(0.4, 2.6);
            state.missiles.push({
              x: hole.x,
              y: hole.y + hole.r * 0.2,
              angle: Math.atan2(heli.y - hole.y, heli.x - hole.x),
              speed: 116 + state.levelIndex * 14,
              size: baseSize,
              baseSize,
              maxSize,
              displaySize: baseSize,
              pulse: Math.random() * Math.PI * 2,
              danger: 0,
              life: 0,
              dead: false,
              trail: [],
            });
            hole.missileCooldown = state.level.missileRate;
          }
        }
      }

      for (const missile of state.missiles) {
        missile.life += dt;
        missile.speed += 7 * dt;
        missile.pulse += dt * (5.8 + state.levelIndex * 0.5);
        pushTrailPoint(missile, 18);
        missile.size = Math.min(missile.maxSize || 18, missile.size + (2.25 + state.levelIndex * 0.22) * dt);
        missile.displaySize = clamp(
          missile.size + Math.sin(missile.pulse) * 1.15,
          (missile.baseSize || missile.size) * 0.92,
          (missile.maxSize || missile.size) + 0.9
        );
        missile.danger = clamp(
          ((missile.displaySize || missile.size) - (missile.baseSize || missile.size)) / Math.max(1, (missile.maxSize || missile.size) - (missile.baseSize || missile.size)),
          0,
          1
        );
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
      state.fx = updateFxParticles(state.fx, dt, 10);

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
        const speed = Phaser.Math.Between(22, 118);
        const roll = Math.random();
        const life = Phaser.Math.FloatBetween(0.32, 0.56);
        this.heli.fx.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: Phaser.Math.Between(2, 6),
          color,
          glowColor: roll < 0.58 ? blendColor(color, palette.shock, 0.45) : blendColor(color, 0xffffff, 0.18),
          shape: roll < 0.52 ? "spark" : roll < 0.78 ? "shard" : "smoke",
          gravity: Phaser.Math.FloatBetween(0, 28),
          drag: 0.52,
          rotation: angle,
          spin: Phaser.Math.FloatBetween(-7, 7),
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
        if (hole.state === "hidden") {
          continue;
        }
        const closed = hole.state === "closed";
        const appearing = hole.state === "appearing";
        const appearProgress = appearing ? clamp(hole.timer / (hole.appearDuration || HELI_HOLE_APPEAR_TIME), 0, 1) : 1;
        const drawR = hole.r * (appearing ? 0.28 + appearProgress * 0.72 : 1);
        const holeAlpha = appearing ? 0.35 + appearProgress * 0.65 : 1;
        this.map.fillStyle(closed ? 0x455044 : 0x15191b, holeAlpha);
        this.map.fillEllipse(hole.x, hole.y, drawR * 2.1, drawR * 1.25);
        this.map.lineStyle(2, closed ? 0x7da16f : 0xa4aeb6, (closed ? 0.45 : 0.35) * holeAlpha);
        this.map.strokeEllipse(hole.x, hole.y, drawR * 2.1, drawR * 1.25);
        if (appearing) {
          this.map.lineStyle(1, 0xd1ddbd, 0.3 * appearProgress);
          this.map.strokeEllipse(hole.x, hole.y, drawR * 2.7, drawR * 1.55);
        }
        if (hole.state === "enemy") {
          const emerge = clamp(hole.timer / 0.9, 0, 1);
          drawEnemyFigure(this.map, hole.x, hole.y + hole.r * 0.44, palette.target, 1, 0.26, emerge < 1 ? "crawl" : "standing", emerge);
        } else if (hole.state === "launcher") {
          this.map.fillStyle(0x2b3136, 1);
          this.map.fillRoundedRect(hole.x - 10, hole.y - 9, 20, 18, 4);
          this.map.fillStyle(palette.target, 1);
          drawEnemyFigure(this.map, hole.x + 12, hole.y + hole.r * 0.44, palette.target, 1, 0.24, "standing", 1);
          this.map.fillStyle(palette.pod, 1);
          this.map.fillTriangle(hole.x - 3, hole.y - 23, hole.x + 7, hole.y - 4, hole.x - 13, hole.y - 4);
        }
      }

      for (const missile of state.missiles) {
        const missileSize = missile.displaySize || missile.size || 12;
        const hotColor = blendColor(0xffc94b, 0xff5a42, missile.danger || 0);
        const bodyColor = blendColor(0xdde8ee, 0xffb16a, (missile.danger || 0) * 0.78);
        const glowColor = blendColor(palette.shock, palette.blast, missile.danger || 0);
        drawMotionTrail(this.dynamic, missile.trail, glowColor, 0.18 + (missile.danger || 0) * 0.1, 2.2, hotColor);
        drawRocketSprite(this.dynamic, missile.x, missile.y, missile.angle, missileSize, {
          body: bodyColor,
          hot: hotColor,
          glow: glowColor,
          stripe: blendColor(bodyColor, 0xffffff, 0.2),
          flame: 0xff7c56,
          ember: palette.shock,
          core: 0x253847,
        }, missile.pulse, missile.danger || 0);
        this.dynamic.lineStyle(1.5, glowColor, 0.35 + (missile.danger || 0) * 0.3);
        this.dynamic.strokeCircle(missile.x, missile.y, missileSize + 4 + Math.sin(missile.pulse || 0) * 1.4);
      }

      for (const shot of state.shots) {
        const alpha = clamp(shot.life / shot.maxLife, 0, 1);
        const progress = 1 - alpha;
        const bulletX = shot.fromX + (shot.x - shot.fromX) * progress;
        const bulletY = shot.fromY + (shot.y - shot.fromY) * progress;
        const color = shot.missile ? palette.blast : palette.shock;
        drawTracerRound(this.dynamic, shot.fromX, shot.fromY, bulletX, bulletY, color, alpha, shot.missile ? 3.2 : 2.1, shot.missile ? 4.8 : 3.1, shot.missile ? 0.36 : 0.26);
        this.dynamic.lineStyle(1.4, color, alpha * 0.38);
        this.dynamic.strokeCircle(shot.x, shot.y, shot.radius * (1 - alpha * 0.35));
      }

      const heli = this.heliPosition();
      const heliSpeedRatio = clamp(Math.hypot(state.heliVx, state.heliVy) / HELI_MOVE_SPEED, 0, 1);
      this.dynamic.fillStyle(0x061018, 0.54);
      this.dynamic.fillEllipse(heli.x, heli.y + 8, 156, 58);
      this.dynamic.fillStyle(0xd9f6ff, 0.08 + heliSpeedRatio * 0.08);
      this.dynamic.fillEllipse(heli.x - state.heliVx * 0.035, heli.y + 22, 104 + heliSpeedRatio * 34, 18 + heliSpeedRatio * 6);
      this.dynamic.save();
      this.dynamic.translateCanvas(heli.x, heli.y);
      this.dynamic.rotateCanvas(state.bank || 0);
      for (const shield of state.shields) {
        const shieldX = shield.offsetX;
        if (shield.alive) {
          this.dynamic.lineStyle(4, shield.id === "center" ? 0x5ee3a2 : 0x9bd5ff, 0.78);
          this.dynamic.strokeEllipse(shieldX, 0, 62, 36);
        } else {
          this.dynamic.lineStyle(3, palette.target, 0.58);
          this.dynamic.strokeEllipse(shieldX, 0, 56, 28);
          this.dynamic.lineBetween(shieldX - 14, -12, shieldX + 12, 10);
          this.dynamic.lineBetween(shieldX - 8, 12, shieldX + 16, -8);
        }
      }
      const rotorGlow = 0.3 + Math.abs(Math.sin(state.rotor || 0)) * 0.14;
      this.dynamic.lineStyle(8, 0xcde6ef, rotorGlow * 0.22);
      this.dynamic.lineBetween(-72, -6, 72, -6);
      this.dynamic.lineStyle(4, 0xd9e6ec, 0.9);
      this.dynamic.lineBetween(-58, -2, 58, -2);
      this.dynamic.lineStyle(2, 0xeff8ff, 0.58);
      this.dynamic.lineBetween(-34, -12, 34, 8);
      this.dynamic.fillStyle(0xe7eff4, 1);
      this.dynamic.fillRoundedRect(-32, -14, 64, 28, 11);
      this.dynamic.fillStyle(0x8eb6cf, 0.96);
      this.dynamic.fillEllipse(10, -2, 22, 16);
      this.dynamic.fillStyle(0x2b4658, 1);
      this.dynamic.fillRoundedRect(-10, -26, 20, 52, 6);
      this.dynamic.fillStyle(0x1c2833, 1);
      this.dynamic.fillRect(18, -5, 54, 8);
      this.dynamic.fillRect(-6, 18, 60, 4);
      this.dynamic.fillStyle(0x7fc6ff, 0.82);
      this.dynamic.fillRoundedRect(2, -10, 20, 12, 6);
      this.dynamic.fillStyle(palette.target, 0.88);
      this.dynamic.fillCircle(0, 4, 6);
      this.dynamic.fillStyle(0xf3f7fb, 0.92);
      this.dynamic.fillCircle(-52, -2, 4);
      this.dynamic.restore();

      for (const particle of state.fx) {
        drawFxParticle(this.fx, particle);
      }
    }

    refreshHud(force) {
      let hud = "";
      if (this.mode === "ship") {
        const shipFlags = [
          this.ship.dualUntil > this.elapsed ? "dual" : "",
          this.ship.guidedUntil > this.elapsed ? "guided" : "",
        ]
          .filter(Boolean)
          .join("-");
        hud = `ship|${this.ship.levelIndex}|${Math.ceil(this.ship.timeLeft)}|${this.ship.shieldHp.join("-")}|${this.ship.armor}|${shipFlags}|${this.score}`;
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
        els.podsLabel.textContent = "Shield";
        els.scoreLabel.textContent = "Score";
        els.stage.textContent = `C2 ${this.ship.levelIndex + 1}/${SHIP_LEVELS.length}`;
        els.targets.textContent = `${Math.ceil(this.ship.timeLeft)}s`;
        const shipModes = [];
        if (this.ship.dualUntil > this.elapsed) {
          shipModes.push("2x");
        }
        if (this.ship.guidedUntil > this.elapsed) {
          shipModes.push("GM");
        }
        els.pods.textContent = `${this.ship.shieldHp.join("/")} ${shipModes.join(" ")}`.trim();
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

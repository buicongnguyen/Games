/* Sky Drill 2 — data.js
 * World constants, physics tuning, level definitions, story content.
 * Loaded first; defines the global SD namespace.
 */
(function () {
  "use strict";

  const SD = (window.SD = window.SD || {});

  SD.VERSION = "2.0.0";
  SD.SAVE_KEY = "skydrill2.v1";

  SD.WORLD = { width: 960, height: 540 };
  SD.MAP = { x: 56, y: 112, width: 848, height: 344 };
  SD.SURFACE_Y = 394;

  /* ------------------------------------------------------------------ *
   * Physics tuning.
   * World scale: ~10 px = 1 m, so g = 9.81 m/s^2 -> ~480 px/s^2 reads
   * naturally at this zoom. All bodies integrate with semi-implicit
   * Euler at a fixed 120 Hz substep (see core.js).
   * ------------------------------------------------------------------ */
  SD.PHYS = {
    DT: 1 / 120,            // fixed physics substep
    GRAVITY: 480,           // px/s^2
    POD_DRAG_K: 0.00026,    // quadratic drag; terminal vel = sqrt(g/k) ~ 1350 px/s (cap, rarely hit)
    POD_WIND_COUPLE: 0.55,  // linear coupling of pod fins to horizontal wind (1/s)
    POD_STUCK_SPEED: 46,    // below this speed inside material the drill jams -> detonates
    RESIST_WALL: 950,       // decel px/s^2 while drilling regular blocks
    RESIST_FOUNDATION: 1900,// decel px/s^2 while drilling foundation row
    RESIST_GROUND: 2700,    // decel px/s^2 while burrowing into the island
    RESTITUTION_POD: 0.52,  // bounce-pod energy retention (vertical)
    BOUNCE_FRICTION: 0.78,  // horizontal speed kept per ground bounce
    RESTITUTION_TIMER: 0.26,// timer pods barely bounce, then roll
    ROLL_FRICTION: 2.6,     // 1/s horizontal damping while a timer pod rolls
    BLAST_DMG_CENTER: 150,  // blast damage at center
    BLAST_DMG_EDGE: 32,     // blast damage at radius edge
    BLOCK_FALL_GRAVITY: 540,// collapsing masonry acceleration
    BLOCK_IMPACT_SAFE: 230, // impact speed below which a landing block takes no damage
    CRATE_TERMINAL: 64,     // parachute crate terminal fall speed (px/s)
  };

  SD.PALETTE = {
    skyTop: 0x9ed9f2,
    sea: 0x1f7594,
    island: 0x5dae7d,
    islandDark: 0x2f7b55,
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
    bank: 0x536a42,
    dark: 0x101820,
    hudCyan: 0x7ef4ff,
    hostile: 0xff4f96,
  };

  /* ------------------------------------------------------------------ *
   * Bomb (pod) configuration space — Chapter 1.
   * ------------------------------------------------------------------ */
  SD.BOMB = {
    DEFAULT: { type: "drill", path: "arc", fuse: 1.35, blastRadius: 42, drillWalls: 5, bounceCount: 1 },
    TYPES: { drill: "Drill", bounce: "Bounce", timer: "Timer" },
    PATHS: { arc: "Arc", drop: "Brake", hook: "Hook", zigzag: "Zigzag" },
    TYPE_HINT: {
      drill: "Drills N floors deep, then detonates",
      bounce: "Detonates on the Nth ground bounce",
      timer: "Detonates when the fuse runs out",
    },
    PATH_HINT: {
      arc: "Pure ballistic arc",
      drop: "Air brake kills forward speed",
      hook: "Thruster glide, then a steep dive",
      zigzag: "Lateral thrusters weave the descent",
    },
  };

  /* ------------------------------------------------------------------ *
   * Chapter 1 — Operation Sky Drill (bombing levels)
   * ------------------------------------------------------------------ */
  SD.LEVELS = {};

  SD.LEVELS.bombing = [
    {
      name: "C1-1", sub: "First Crack",
      pods: 1, planeSpeed: 92, wind: 0,
      podRadius: 6, drillRadius: 10.5, targetScale: 0.58, targetHitRadius: 5, bonusPerPod: 45,
      buildings: [{ id: "A", x: 418, y: 226, width: 120, height: 168, cols: 4, rows: 5 }],
      targets: [{ x: 478, y: 384 }],
    },
    {
      name: "C1-2", sub: "Crosswind",
      pods: 1, planeSpeed: 98, wind: -26,
      podRadius: 6, drillRadius: 10, targetScale: 0.56, targetHitRadius: 4.8, bonusPerPod: 50,
      buildings: [{ id: "A", x: 346, y: 202, width: 142, height: 192, cols: 5, rows: 5 }],
      targets: [{ x: 418, y: 382 }],
    },
    {
      name: "C1-3", sub: "Tail Gust",
      pods: 1, planeSpeed: 104, wind: 32,
      podRadius: 5.8, drillRadius: 9.5, targetScale: 0.54, targetHitRadius: 4.5, bonusPerPod: 55,
      buildings: [{ id: "A", x: 566, y: 216, width: 128, height: 178, cols: 4, rows: 5 }],
      targets: [{ x: 628, y: 382 }],
    },
    {
      name: "C1-4", sub: "Triple Nest",
      pods: 2, planeSpeed: 108, wind: -34,
      podRadius: 5.6, drillRadius: 9.2, targetScale: 0.52, targetHitRadius: 4.2, bonusPerPod: 60,
      buildings: [{ id: "A", x: 362, y: 196, width: 176, height: 198, cols: 6, rows: 5 }],
      targets: [
        { x: 405, y: 382 },
        { x: 456, y: 382 },
        { x: 508, y: 382 },
      ],
    },
    {
      name: "C1-5", sub: "Deep Hive",
      pods: 3, planeSpeed: 114, wind: 38,
      podRadius: 5.2, drillRadius: 8.8, targetScale: 0.5, targetHitRadius: 4, bonusPerPod: 70,
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
      name: "C1-6", sub: "The Citadel",
      pods: 5, planeSpeed: 122, wind: -46,
      podRadius: 5, drillRadius: 8.5, targetScale: 0.48, targetHitRadius: 3.8, bonusPerPod: 85,
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

  /* ------------------------------------------------------------------ *
   * Chapter 2 — The Canal Run (top-down survival)
   * distance is in meters; 1 px = 0.5 m at this zoom, so travel time =
   * distance / (riverSpeed * 0.5).
   * ------------------------------------------------------------------ */
  SD.LEVELS.canal = [
    {
      name: "C2-1", sub: "Into the Gauntlet",
      distance: 1290, riverSpeed: 76,
      guns: 6, launchers: 2, mines: 5,
      bulletRate: 1.7, bulletSpeed: 196, aimLead: 0.3,
      launcherRate: 1.15, pickupRate: 6.2,
    },
    {
      name: "C2-2", sub: "Narrowing Banks",
      distance: 1850, riverSpeed: 88,
      guns: 8, launchers: 3, mines: 6,
      bulletRate: 1.45, bulletSpeed: 206, aimLead: 0.5,
      launcherRate: 1.05, pickupRate: 5.0,
    },
    {
      name: "C2-3", sub: "Uplink Approach",
      distance: 2550, riverSpeed: 102,
      guns: 10, launchers: 4, mines: 8,
      bulletRate: 1.15, bulletSpeed: 218, aimLead: 0.72,
      launcherRate: 0.95, pickupRate: 4.6,
    },
  ];

  SD.SHIP = {
    CENTER: { x: SD.WORLD.width / 2, y: 316 },
    LIMITS: { left: 214, right: 746, top: 130, bottom: 472 },
    THRUST: 560,           // px/s^2 water-jet thrust
    WATER_DRAG: 2.4,       // 1/s linear water drag -> vmax ~ 233 px/s
    HULL_RX: 30,           // hull collision ellipse
    HULL_RY: 52,
    CORE_R: 11,            // bridge core: direct hit when shields down = mission over
    HULL_HP: 3,            // hull integrity after all shields are gone
    FIRE_RATE: 0.22,
    FIRE_RATE_DUAL: 0.13,
    BULLET_SPEED: 980,
    BULLET_LIFE: 2.25,
    SUPPORT_MISSILE_SPEED: 290,
    SUPPORT_MISSILE_RATE: 0.58,
    ENEMY_MISSILE_SPEED: 108,
    ENEMY_MISSILE_TURN: 1.05,
    ENEMY_MISSILE_ACCEL: 26,
    WATER_LEFT: 204,
    WATER_WIDTH: 552,
    GUN_LEFT_X: 118,
    GUN_RIGHT_X: SD.WORLD.width - 118,
    LAUNCHER_LEFT_X: 74,
    LAUNCHER_RIGHT_X: SD.WORLD.width - 74,
    MINE_SPREAD: 244,
    PICKUP_TYPES: ["star", "medal", "health", "smallgun"],
    DUAL_DURATION: 8,
    GUIDED_DURATION: 6,
    PX_TO_M: 0.5,
  };

  /* ------------------------------------------------------------------ *
   * Chapter 3 — Last Uplink (helicopter defense)
   * duration = seconds for the virus upload to complete.
   * ------------------------------------------------------------------ */
  SD.LEVELS.defense = [
    { name: "C3-1", sub: "Breach Perimeter", duration: 42, holes: 12, missileRate: 2.8 },
    { name: "C3-2", sub: "Swarm Rising", duration: 50, holes: 15, missileRate: 2.25 },
    { name: "C3-3", sub: "Core Meltdown", duration: 58, holes: 18, missileRate: 1.85 },
  ];

  SD.HELI = {
    BASE: { x: SD.WORLD.width / 2, y: 462 },
    LIMITS: { left: 268, right: 692, top: 350, bottom: 500 },
    THRUST: 640,            // rotor cyclic thrust px/s^2
    AIR_DRAG: 3.1,          // 1/s -> vmax ~ 206 px/s
    FIRE_RATE_GUN: 0.16,
    FIRE_RATE_MISSILE: 0.5,
    GUN_SPEED: 820,
    ROCKET_SPEED: 430,
    ROCKET_SPLASH: 58,
    SHIELD_OFFSETS: [-58, 0, 58],
    SHIELD_RX: 32,
    SHIELD_RY: 19,
    SHIELD_HP: 2,           // each shield oval takes 2 hits
    BODY_RX: 30,
    BODY_RY: 16,
    HOLE_APPEAR_TIME: 1.15,
    CRATE_INTERVAL: 14,     // seconds between supply crate drops
    HOLE_POSITIONS: [
      [118, 154, 16], [206, 100, 14], [292, 178, 15], [382, 254, 14],
      [482, 132, 18], [586, 202, 15], [692, 118, 16], [814, 168, 15],
      [156, 286, 14], [246, 360, 13], [346, 314, 14], [438, 406, 13],
      [542, 286, 15], [636, 372, 14], [742, 300, 15], [846, 406, 13],
      [88, 404, 13], [878, 260, 14],
    ],
  };

  /* ------------------------------------------------------------------ *
   * Story.
   * One coherent campaign: a rogue machine network ("the Hive") has
   * seized the Vantar Archipelago. Each chapter is one leg of the same
   * counter-strike, so the gameplay shifts have in-fiction reasons.
   * ------------------------------------------------------------------ */
  SD.STORY = {
    title: {
      game: "SKY DRILL 2",
      tag: "The Hive took the archipelago. Take it back.",
      blurb:
        "A rogue machine network — the Hive — has seized the Vantar Archipelago. " +
        "Its crawlers nest inside fortified towers and its core sleeps under the mountain. " +
        "You are the last Skybreaker pilot.",
    },
    chapters: [
      {
        id: "bombing",
        num: "CHAPTER 1",
        name: "Operation Sky Drill",
        brief:
          "The Hive's crawlers nest at the base of fortified towers. Your drill pods " +
          "punch through masonry and detonate inside — set drill depth, fuse and " +
          "trajectory before each drop. Pods are limited: mark every nest.",
        objective: "Destroy every crawler nest. Pods are limited.",
        controls: "Set Angle / Launch speed / Drop delay, tune the pod in Bomb setup, then DROP. R restarts.",
        accent: "#ffcc4d",
      },
      {
        id: "canal",
        num: "CHAPTER 2",
        name: "The Canal Run",
        brief:
          "The towers are down, and the Hive is blind. Run the canal gauntlet and " +
          "carry the virus core upriver to the uplink site. Bank guns, seeker drones " +
          "and proximity mines stand between you and the mountain.",
        objective: "Reach the uplink site. Don't lose the core.",
        controls: "WASD / left pad to steer. Click / right pad to shoot. Grab supply crates for upgrades.",
        accent: "#7ef4ff",
      },
      {
        id: "defense",
        num: "CHAPTER 3",
        name: "Last Uplink",
        brief:
          "The virus is uploading into the Hive's mountain core. Burrowers are surfacing " +
          "from bolt-holes with rocket rigs. Hold the LZ in your gunship until the " +
          "upload completes — lose the gunship and the archipelago is lost.",
        objective: "Survive until the upload hits 100%.",
        controls: "WASD / left pad to fly. Click / right pad to fire. 1 = gun, 2 = rockets. Catch supply crates.",
        accent: "#5ee3a2",
      },
    ],
    epilogue: {
      title: "THE HIVE FALLS SILENT",
      body:
        "The upload completes. Across the archipelago, crawlers freeze mid-step and " +
        "tower lights gutter out. The mountain core exhales one last burst of static — " +
        "then nothing. Vantar sleeps again, and for the first time in years, so can you.",
      sign: "— CAMPAIGN COMPLETE —",
    },
    fail: {
      bombing: "The nests survive. The Hive rebuilds by dawn.",
      canal: "The virus core sinks into the canal. The Hive endures.",
      defense: "The uplink is cut. The mountain keeps humming.",
    },
  };
})();

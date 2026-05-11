const GAME_VERSION = 1;
const SAVE_DB_NAME = "sidewalk-iced-tea-planb";
const SAVE_STORE_NAME = "saves";
const SAVE_SLOT_KEY = "slot-1";
const ACTIVE_SLOT_POINTER = "sidewalk-iced-tea:active-slot";
const FALLBACK_SAVE_KEY = "sidewalk-iced-tea:save-fallback";
const SAVE_BACKUP_KEY = "sidewalk-iced-tea:save-backup";
const FIXED_STEP = 0.1;
const MAX_CATCH_UP_SECONDS = 30;
const MAX_IDLE_SECONDS = 600;
const IDLE_EFFICIENCY = 0.25;
const MAX_WAIT_SECONDS = 18;
const BASE_SERVE_TIME = 2.5;
const FAST_SERVE_TIME = 1.5;
const BASE_SPAWN_INTERVAL = 6.0;
const SPAWN_VARIANCE = 1.5;
const WEATHER_WINDOW = [45, 75];
const RAIN_DURATION = 20;
const WIND_WINDOW = [28, 52];
const WIND_DURATION = 9;
const DOG_WINDOW = [22, 38];
const CAT_WINDOW = [26, 44];
const TABLE_ROWS = 2;
const TABLE_COLUMNS = 4;
const BOARD_WIDTH = 960;
const BOARD_HEIGHT = 540;
const DOOR_OUTSIDE_X = -24;
const DOOR_INSIDE_X = 104;
const DOOR_Y = 280;
const AISLE_X = 236;
const DEFAULT_LANGUAGE = "vi";

const CUSTOMER_TYPES = [
  {
    id: "man",
    assetId: "customer_man",
    label: "Man",
    labelVi: "Khách nam",
    skin: "#e8bc9a",
    hair: "#2d211a",
    top: "#6285d8",
    bottom: "#4b3b32",
    accent: "#cfddd4",
    hairStyle: "short",
    silhouette: "broad",
    speechTemplates: [
      "Cho mình một ly {drink} nha.",
      "Cho mình xin một ly {drink} nhé.",
    ],
  },
  {
    id: "woman",
    assetId: "customer_woman",
    label: "Woman",
    labelVi: "Khách nữ",
    skin: "#efc6a8",
    hair: "#523124",
    top: "#d86f7a",
    bottom: "#6f4c83",
    accent: "#f4d8cc",
    hairStyle: "long",
    silhouette: "soft",
    speechTemplates: [
      "Cho mình một ly {drink} nhé.",
      "Cho mình xin một ly {drink} nha.",
    ],
  },
  {
    id: "old_man",
    assetId: "customer_old_man",
    label: "Old man",
    labelVi: "Chú khách",
    skin: "#e5b89a",
    hair: "#d8d1cb",
    top: "#7da1b8",
    bottom: "#655447",
    accent: "#eadcae",
    hairStyle: "thin",
    silhouette: "narrow",
    speechTemplates: [
      "Cho chú một ly {drink} nhé.",
      "Cho chú xin một ly {drink} nha.",
    ],
  },
  {
    id: "old_woman",
    assetId: "customer_old_woman",
    label: "Old woman",
    labelVi: "Cô khách",
    skin: "#ebbf9f",
    hair: "#cfd0d5",
    top: "#6fa89f",
    bottom: "#765a85",
    accent: "#f2dbbd",
    hairStyle: "bun",
    silhouette: "soft",
    speechTemplates: [
      "Cho cô một ly {drink} nhé.",
      "Cho cô xin một ly {drink} nha.",
    ],
  },
  {
    id: "young_boy",
    assetId: "customer_young_boy",
    label: "Young boy",
    labelVi: "Bé trai",
    skin: "#f0c69c",
    hair: "#3f2617",
    top: "#6da65f",
    bottom: "#516cb4",
    accent: "#f4d66c",
    hairStyle: "cap",
    silhouette: "compact",
    speechTemplates: [
      "Cho cháu xin một ly {drink} ạ.",
      "Cho cháu một ly {drink} nhé.",
    ],
  },
  {
    id: "young_girl",
    assetId: "customer_young_girl",
    label: "Young girl",
    labelVi: "Bé gái",
    skin: "#f2cba9",
    hair: "#452819",
    top: "#f0c15f",
    bottom: "#d97872",
    accent: "#8fc8d2",
    hairStyle: "puff",
    silhouette: "compact",
    speechTemplates: [
      "Cho cháu xin một ly {drink} ạ.",
      "Cho cháu một ly {drink} nha.",
    ],
  },
];

const DRINK_TYPES = [
  {
    id: "thai_tea",
    label: "Thai Tea",
    shortLabel: "Thai",
    labelVi: "trà Thái",
    shortLabelVi: "Thái",
    orderLabelVi: "trà Thái",
    liquid: "#d67e3d",
    cup: "#ffe1af",
    straw: "#f45a52",
    garnish: "#f6d89c",
  },
  {
    id: "lemon_tea",
    label: "Lemon Tea",
    shortLabel: "Lemon",
    labelVi: "trà chanh",
    shortLabelVi: "Chanh",
    orderLabelVi: "trà chanh",
    liquid: "#caa642",
    cup: "#f5edd0",
    straw: "#4fa06e",
    garnish: "#f5e26d",
  },
  {
    id: "peach_fizz",
    label: "Peach Fizz",
    shortLabel: "Peach",
    labelVi: "trà đào",
    shortLabelVi: "Đào",
    orderLabelVi: "trà đào",
    liquid: "#ef9a7b",
    cup: "#ffe8df",
    straw: "#5db7d0",
    garnish: "#f5c2ab",
  },
  {
    id: "matcha_latte",
    label: "Matcha Latte",
    shortLabel: "Matcha",
    labelVi: "matcha sữa",
    shortLabelVi: "Matcha",
    orderLabelVi: "matcha sữa",
    liquid: "#84b06a",
    cup: "#edf5e0",
    straw: "#e5c657",
    garnish: "#badc8f",
  },
  {
    id: "berry_soda",
    label: "Berry Soda",
    shortLabel: "Berry",
    labelVi: "soda dâu",
    shortLabelVi: "Dâu",
    orderLabelVi: "soda dâu",
    liquid: "#9a64c0",
    cup: "#f1e7ff",
    straw: "#efb0d2",
    garnish: "#d58eff",
  },
  {
    id: "milk_tea",
    label: "Milk Tea",
    shortLabel: "Milk",
    labelVi: "trà sữa",
    shortLabelVi: "Sữa",
    orderLabelVi: "trà sữa",
    liquid: "#a66c46",
    cup: "#f1d8b7",
    straw: "#dd634f",
    garnish: "#e7c39d",
  },
];

const CUSTOMER_TYPE_BY_ID = new Map(CUSTOMER_TYPES.map((entry) => [entry.id, entry]));
const DRINK_TYPE_BY_ID = new Map(DRINK_TYPES.map((entry) => [entry.id, entry]));

document.documentElement.lang = DEFAULT_LANGUAGE;

const ASSET_PATHS = {
  bg_room: "./public/assets/placeholder/bg-room.svg",
  stall_counter: "./public/assets/placeholder/stall-counter.svg",
  table_slot: "./public/assets/placeholder/table-slot.svg",
  customer_man: "./public/assets/placeholder/customer-man.svg",
  customer_woman: "./public/assets/placeholder/customer-woman.svg",
  customer_old_man: "./public/assets/placeholder/customer-old-man.svg",
  customer_old_woman: "./public/assets/placeholder/customer-old-woman.svg",
  customer_young_boy: "./public/assets/placeholder/customer-young-boy.svg",
  customer_young_girl: "./public/assets/placeholder/customer-young-girl.svg",
};

const ui = {
  canvas: document.getElementById("game-canvas"),
  coinsValue: document.getElementById("coins-value"),
  scoreValue: document.getElementById("score-value"),
  servedValue: document.getElementById("served-value"),
  tipsValue: document.getElementById("tips-value"),
  weatherValue: document.getElementById("weather-value"),
  tablesValue: document.getElementById("tables-value"),
  flowValue: document.getElementById("flow-value"),
  incidentValue: document.getElementById("incident-value"),
  saveValue: document.getElementById("save-value"),
  sessionValue: document.getElementById("session-value"),
  titleOverlay: document.getElementById("title-overlay"),
  overlayCopy: document.getElementById("overlay-copy"),
  startButton: document.getElementById("start-button"),
  installButton: document.getElementById("install-button"),
  upgradeServe: document.getElementById("upgrade-serve"),
  upgradeUmbrella: document.getElementById("upgrade-umbrella"),
  pauseButton: document.getElementById("pause-button"),
  resetButton: document.getElementById("reset-button"),
  offlineBadge: document.getElementById("offline-badge"),
  toast: document.getElementById("toast"),
};

const ctx = ui.canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const TABLE_LAYOUT = buildTableLayout();

const runtime = {
  mode: "title",
  assets: new Map(),
  db: null,
  storageMode: "indexeddb",
  sessionStartedAt: Date.now(),
  lastFrame: 0,
  accumulator: 0,
  autoSaveTimer: 0,
  toastUntil: 0,
  installPrompt: null,
  isOnline: navigator.onLine,
  hiddenStartedAt: null,
  saveStatus: "booting",
  saveInFlight: false,
  audio: createAudioEngine(),
  floatingTexts: [],
};

let gameState = createDefaultState();

init().catch((error) => {
  console.error(error);
  showToast("Mở game chưa xong, tải lại giúp mình nhé.");
});

async function init() {
  bindEvents();
  await loadAssets();
  await initStorage();
  const loadedState = await loadGameState();
  if (loadedState) {
    gameState = restoreState(loadedState);
  }

  updateOverlay();
  updateHud();
  updateOnlineState();
  exposeDebugState();
  registerServiceWorker();
  requestAnimationFrame(frameLoop);
}

function bindEvents() {
  ui.canvas.addEventListener("pointerdown", handleCanvasPointer);
  ui.startButton.addEventListener("click", handleStartButton);
  ui.installButton.addEventListener("click", handleInstallButton);
  ui.upgradeServe.addEventListener("click", () => buyUpgrade("faster_serve"));
  ui.upgradeUmbrella.addEventListener("click", () => buyUpgrade("umbrella"));
  ui.pauseButton.addEventListener("click", togglePause);
  ui.resetButton.addEventListener("click", resetSave);

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", () => {
    void persistGameState("pagehide");
  });
  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    runtime.installPrompt = event;
    ui.installButton.classList.remove("hidden");
  });
  window.addEventListener("appinstalled", () => {
    runtime.installPrompt = null;
    ui.installButton.classList.add("hidden");
    showToast("Cài xong rồi, giờ có thể mở như ứng dụng.");
  });
}

function buildTableLayout() {
  const layout = [];
  const startX = 280;
  const startY = 120;
  const gapX = 150;
  const gapY = 185;
  const width = 128;
  const height = 96;

  for (let row = 0; row < TABLE_ROWS; row += 1) {
    for (let column = 0; column < TABLE_COLUMNS; column += 1) {
      const id = `table-${row}-${column}`;
      const x = startX + column * gapX;
      const y = startY + row * gapY;
      layout.push({
        id,
        index: layout.length,
        row,
        column,
        x,
        y,
        width,
        height,
        approachX: Math.max(AISLE_X, x - 28),
        approachY: y + height + 12,
        seatX: x + width / 2,
        seatY: y + height + 16,
      });
    }
  }

  return layout;
}

function createDefaultState() {
  const now = Date.now();

  return {
    version: GAME_VERSION,
    coins: 0,
    score: 0,
    tipCoins: 0,
    totalServed: 0,
    totalMissed: 0,
    serveLevel: 0,
    umbrellaOwned: false,
    weatherState: "clear",
    weatherRemaining: 0,
    nextWeatherRollIn: randomInRange(...WEATHER_WINDOW),
    windRemaining: 0,
    nextWindRollIn: randomInRange(...WIND_WINDOW),
    nextWandererId: 1,
    nextDogRollIn: randomInRange(...DOG_WINDOW),
    nextCatRollIn: randomInRange(...CAT_WINDOW),
    lastSavedAt: now,
    lastSimulatedAt: now,
    audioUnlocked: false,
    nextCustomerId: 1,
    spawnTimer: randomSpawnInterval(1),
    tables: TABLE_LAYOUT.map((table) => ({
      id: table.id,
      status: "empty",
      customerId: null,
      waitElapsed: 0,
      serviceElapsed: 0,
      enjoyElapsed: 0,
      lastOutcome: null,
    })),
    customers: [],
    wanderers: [],
    stats: {
      dropped: 0,
      windEvents: 0,
      dogVisits: 0,
      catVisits: 0,
    },
  };
}

function restoreState(saved) {
  const base = createDefaultState();

  if (!saved || typeof saved !== "object") {
    return base;
  }

  const restored = {
    ...base,
    version: GAME_VERSION,
    coins: asNumber(saved.coins, base.coins),
    score: asNumber(saved.score, base.score),
    tipCoins: asNumber(saved.tipCoins, base.tipCoins),
    totalServed: asNumber(saved.totalServed, base.totalServed),
    totalMissed: asNumber(saved.totalMissed, base.totalMissed),
    serveLevel: asNumber(saved.serveLevel, base.serveLevel),
    umbrellaOwned: Boolean(saved.umbrellaOwned),
    weatherState: saved.weatherState === "rain" ? "rain" : "clear",
    weatherRemaining: asNumber(saved.weatherRemaining, base.weatherRemaining),
    nextWeatherRollIn: asNumber(saved.nextWeatherRollIn, base.nextWeatherRollIn),
    windRemaining: asNumber(saved.windRemaining, base.windRemaining),
    nextWindRollIn: asNumber(saved.nextWindRollIn, base.nextWindRollIn),
    nextWandererId: asNumber(saved.nextWandererId, base.nextWandererId),
    nextDogRollIn: asNumber(saved.nextDogRollIn, base.nextDogRollIn),
    nextCatRollIn: asNumber(saved.nextCatRollIn, base.nextCatRollIn),
    lastSavedAt: asNumber(saved.lastSavedAt, base.lastSavedAt),
    lastSimulatedAt: Date.now(),
    audioUnlocked: Boolean(saved.audioUnlocked),
    nextCustomerId: asNumber(saved.nextCustomerId, base.nextCustomerId),
    spawnTimer: asNumber(saved.spawnTimer, base.spawnTimer),
    stats: {
      dropped: asNumber(saved?.stats?.dropped, base.stats.dropped),
      windEvents: asNumber(saved?.stats?.windEvents, base.stats.windEvents),
      dogVisits: asNumber(saved?.stats?.dogVisits, base.stats.dogVisits),
      catVisits: asNumber(saved?.stats?.catVisits, base.stats.catVisits),
    },
  };

  restored.tables = TABLE_LAYOUT.map((table) => {
    const incoming = Array.isArray(saved.tables)
      ? saved.tables.find((entry) => entry.id === table.id)
      : null;

    return {
      id: table.id,
      status: incoming?.status ?? "empty",
      customerId: incoming?.customerId ?? null,
      waitElapsed: asNumber(incoming?.waitElapsed, 0),
      serviceElapsed: asNumber(incoming?.serviceElapsed, 0),
      enjoyElapsed: asNumber(incoming?.enjoyElapsed, 0),
      lastOutcome: incoming?.lastOutcome ?? null,
    };
  });

  restored.customers = Array.isArray(saved.customers)
    ? saved.customers
        .map((customer) => normalizeCustomer(customer))
        .filter(Boolean)
    : [];
  restored.wanderers = Array.isArray(saved.wanderers)
    ? saved.wanderers
        .map((wanderer) => normalizeWanderer(wanderer))
        .filter(Boolean)
    : [];

  return restored;
}

function normalizeCustomer(customer) {
  if (!customer || typeof customer !== "object") {
    return null;
  }

  const tableLayout = getTableLayout(customer.tableId);
  const customerType = getCustomerType(customer.type);
  const normalizedDrinkId = getDrinkType(customer.drinkId)?.id ?? pickDrinkId();

  if (!customerType || !tableLayout) {
    return null;
  }

  return {
    id: asNumber(customer.id, 0),
    type: customerType.id,
    phase: customer.phase ?? "waiting",
    x: asNumber(customer.x, tableLayout.seatX),
    y: asNumber(customer.y, tableLayout.seatY),
    targetX: asNumber(customer.targetX, tableLayout.seatX),
    targetY: asNumber(customer.targetY, tableLayout.seatY),
    waypoints: normalizeWaypoints(customer.waypoints, tableLayout, customer.phase),
    tableId: tableLayout.id,
    speed: asNumber(customer.speed, 140),
    waitElapsed: asNumber(customer.waitElapsed, 0),
    serveElapsed: asNumber(customer.serveElapsed, 0),
    enjoyElapsed: asNumber(customer.enjoyElapsed, 0),
    drinkId: normalizedDrinkId,
    orderText: normalizeOrderText(customer.orderText, customerType.id, normalizedDrinkId),
    rewardGranted: Boolean(customer.rewardGranted),
    tipReward: asNumber(customer.tipReward, 0),
  };
}

function normalizeWanderer(wanderer) {
  if (!wanderer || typeof wanderer !== "object") {
    return null;
  }

  const kind = wanderer.kind === "dog" ? "dog" : wanderer.kind === "cat" ? "cat" : null;
  if (!kind) {
    return null;
  }

  return {
    id: asNumber(wanderer.id, 0),
    kind,
    x: asNumber(wanderer.x, -40),
    y: asNumber(wanderer.y, kind === "dog" ? 438 : 402),
    targetX: asNumber(wanderer.targetX, BOARD_WIDTH + 40),
    targetY: asNumber(wanderer.targetY, kind === "dog" ? 438 : 402),
    waypoints: normalizePointList(wanderer.waypoints),
    speed: asNumber(wanderer.speed, kind === "dog" ? 82 : 92),
    facing: Number(wanderer.facing) < 0 ? -1 : 1,
  };
}

async function loadAssets() {
  const entries = Object.entries(ASSET_PATHS);
  await Promise.all(
    entries.map(async ([assetId, path]) => {
      const image = await loadImage(path);
      runtime.assets.set(assetId, image);
    }),
  );
}

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = path;
  });
}

async function initStorage() {
  localStorage.setItem(ACTIVE_SLOT_POINTER, SAVE_SLOT_KEY);

  try {
    runtime.db = await openDatabase();
    runtime.storageMode = "indexeddb";
    runtime.saveStatus = "ready";
  } catch (error) {
    console.warn("IndexedDB unavailable, falling back to localStorage.", error);
    runtime.storageMode = "localstorage";
    runtime.saveStatus = "fallback";
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = indexedDB.open(SAVE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVE_STORE_NAME)) {
        db.createObjectStore(SAVE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadGameState() {
  try {
    let data = null;

    if (runtime.storageMode === "indexeddb" && runtime.db) {
      data = await idbGet(runtime.db, SAVE_SLOT_KEY);
    }

    if (!data) {
      const raw = localStorage.getItem(FALLBACK_SAVE_KEY);
      const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
      data = parseSaveSource(raw, backupRaw);
    }

    runtime.saveStatus = data ? "loaded" : "ready";
    return data;
  } catch (error) {
    console.warn("Save load failed. Starting from a clean slot.", error);
    runtime.saveStatus = "recovered";
    return null;
  }
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE_NAME, "readonly");
    const store = tx.objectStore(SAVE_STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE_NAME, "readwrite");
    const store = tx.objectStore(SAVE_STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function persistGameState(reason = "autosave") {
  if (runtime.saveInFlight) {
    return;
  }

  runtime.saveInFlight = true;
  gameState.lastSavedAt = Date.now();

  try {
    const serializableState = structuredClone(gameState);

    if (runtime.storageMode === "indexeddb" && runtime.db) {
      await idbPut(runtime.db, SAVE_SLOT_KEY, serializableState);
    }

    localStorage.setItem(FALLBACK_SAVE_KEY, JSON.stringify(serializableState));
    localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify(serializableState));
    runtime.saveStatus = reason === "autosave" ? "saved" : reason;
    updateHud();
  } catch (error) {
    console.error("Failed to save the game state.", error);
    runtime.saveStatus = "save error";
  } finally {
    runtime.saveInFlight = false;
  }
}

function frameLoop(timestamp) {
  if (!runtime.lastFrame) {
    runtime.lastFrame = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - runtime.lastFrame) / 1000, 0.25);
  runtime.lastFrame = timestamp;

  if (runtime.mode === "playing" && !document.hidden) {
    runtime.accumulator += deltaSeconds;
    runtime.autoSaveTimer += deltaSeconds;

    while (runtime.accumulator >= FIXED_STEP) {
      updateLogic(FIXED_STEP);
      runtime.accumulator -= FIXED_STEP;
    }

    if (runtime.autoSaveTimer >= 10) {
      runtime.autoSaveTimer = 0;
      void persistGameState("autosave");
    }
  }

  renderScene(timestamp);
  requestAnimationFrame(frameLoop);
}

function updateLogic(deltaSeconds) {
  gameState.lastSimulatedAt = Date.now();

  updateWeather(deltaSeconds);
  updateStreetLife(deltaSeconds);
  updateSpawning(deltaSeconds);
  updateCustomers(deltaSeconds);
  syncTablesFromCustomers();
  updateFloatingTexts(deltaSeconds);
  updateHud();
}

function updateWeather(deltaSeconds) {
  if (gameState.weatherState === "rain") {
    gameState.weatherRemaining = Math.max(0, gameState.weatherRemaining - deltaSeconds);
    if (gameState.weatherRemaining <= 0) {
      gameState.weatherState = "clear";
      gameState.nextWeatherRollIn = randomInRange(...WEATHER_WINDOW);
      showToast("Hết mưa rồi, khách lại đông hơn.");
    }
    return;
  }

  gameState.nextWeatherRollIn -= deltaSeconds;
  if (gameState.nextWeatherRollIn <= 0) {
    gameState.weatherState = "rain";
    gameState.weatherRemaining = RAIN_DURATION;
    gameState.nextWeatherRollIn = randomInRange(...WEATHER_WINDOW);
    runtime.audio.beep("rain");
    showToast(gameState.umbrellaOwned ? "Mưa nhẹ thôi, ô che vẫn ổn." : "Mưa làm khách thưa đi một chút.");
  }
}

function updateStreetLife(deltaSeconds) {
  updateWind(deltaSeconds);
  updateWandererTimers(deltaSeconds);
  updateWanderers(deltaSeconds);
}

function updateWind(deltaSeconds) {
  if (gameState.windRemaining > 0) {
    gameState.windRemaining = Math.max(0, gameState.windRemaining - deltaSeconds);
    if (gameState.windRemaining <= 0) {
      showToast("Gió lớn qua rồi.");
    }
    return;
  }

  gameState.nextWindRollIn -= deltaSeconds;
  if (gameState.nextWindRollIn <= 0) {
    startWindEvent();
  }
}

function startWindEvent() {
  gameState.windRemaining = WIND_DURATION;
  gameState.nextWindRollIn = randomInRange(...WIND_WINDOW);
  gameState.stats.windEvents += 1;
  runtime.audio.beep("rain");
  showToast("Có đợt gió lớn vừa quét ngang quán.");
}

function updateWandererTimers(deltaSeconds) {
  if (!hasWanderer("dog")) {
    gameState.nextDogRollIn -= deltaSeconds;
    if (gameState.nextDogRollIn <= 0) {
      spawnWanderer("dog");
      gameState.nextDogRollIn = randomInRange(...DOG_WINDOW);
    }
  }

  if (!hasWanderer("cat")) {
    gameState.nextCatRollIn -= deltaSeconds;
    if (gameState.nextCatRollIn <= 0) {
      spawnWanderer("cat");
      gameState.nextCatRollIn = randomInRange(...CAT_WINDOW);
    }
  }
}

function spawnWanderer(kind) {
  const fromLeft = Math.random() < 0.5;
  const entryX = fromLeft ? -48 : BOARD_WIDTH + 48;
  const exitX = fromLeft ? BOARD_WIDTH + 48 : -48;
  const laneY = kind === "dog" ? randomInRange(404, 448) : randomInRange(368, 420);
  const midX = fromLeft
    ? randomInRange(180, 420)
    : randomInRange(BOARD_WIDTH - 420, BOARD_WIDTH - 180);
  const secondX = fromLeft
    ? randomInRange(BOARD_WIDTH - 300, BOARD_WIDTH - 120)
    : randomInRange(120, 300);
  const wanderer = {
    id: gameState.nextWandererId,
    kind,
    x: entryX,
    y: laneY,
    targetX: exitX,
    targetY: laneY,
    waypoints: [
      { x: midX, y: laneY + randomInRange(-14, 14) },
      { x: secondX, y: laneY + randomInRange(-10, 10) },
      { x: exitX, y: laneY + randomInRange(-4, 4) },
    ],
    speed: kind === "dog" ? 84 : 96,
    facing: fromLeft ? 1 : -1,
  };

  gameState.nextWandererId += 1;
  gameState.wanderers.push(wanderer);

  if (kind === "dog") {
    gameState.stats.dogVisits += 1;
    showToast("Có chú chó đi ngang qua quán.");
  } else {
    gameState.stats.catVisits += 1;
    showToast("Có mèo lững thững ngang quán.");
  }
}

function hasWanderer(kind) {
  return gameState.wanderers.some((wanderer) => wanderer.kind === kind);
}

function updateWanderers(deltaSeconds) {
  const toRemove = new Set();

  for (const wanderer of gameState.wanderers) {
    const reachedExit = moveAlongWaypoints(wanderer, deltaSeconds);
    if (reachedExit) {
      toRemove.add(wanderer.id);
    }
  }

  if (toRemove.size > 0) {
    gameState.wanderers = gameState.wanderers.filter((wanderer) => !toRemove.has(wanderer.id));
  }
}

function updateSpawning(deltaSeconds) {
  gameState.spawnTimer -= deltaSeconds;

  if (gameState.spawnTimer > 0) {
    return;
  }

  if (!findFreeTableLayout()) {
    gameState.stats.dropped += 1;
    gameState.spawnTimer = randomSpawnInterval(getSpawnRateMultiplier());
    return;
  }

  spawnCustomer();
  gameState.spawnTimer = randomSpawnInterval(getSpawnRateMultiplier());
}

function updateCustomers(deltaSeconds) {
  const customersToRemove = new Set();

  for (const customer of gameState.customers) {
    const table = getTableState(customer.tableId);
    const tableLayout = getTableLayout(customer.tableId);

    if (!table || !tableLayout) {
      customersToRemove.add(customer.id);
      continue;
    }

    if (customer.phase === "walking_to_table") {
      const reachedSeat = moveAlongWaypoints(
        customer,
        deltaSeconds,
        currentWalkSpeedMultiplier(),
      );
      if (reachedSeat) {
        customer.phase = "waiting";
        customer.x = tableLayout.seatX;
        customer.y = tableLayout.seatY;
        table.status = "waiting";
        table.waitElapsed = customer.waitElapsed;
      }
      continue;
    }

    if (customer.phase === "waiting") {
      customer.waitElapsed += deltaSeconds;
      table.status = "waiting";
      table.waitElapsed = customer.waitElapsed;
      if (customer.waitElapsed >= MAX_WAIT_SECONDS) {
        table.lastOutcome = "missed";
        beginExit(customer, table);
        gameState.totalMissed += 1;
        gameState.score = Math.max(0, gameState.score - 1);
        spawnFloatingText({
          text: "Trễ rồi",
          x: tableLayout.seatX,
          y: tableLayout.y - 10,
          color: "#ffd5d5",
        });
        showToast(`${customerLabel(customer.type)} chờ lâu quá nên đi mất rồi.`);
      }
      continue;
    }

    if (customer.phase === "being_served") {
      customer.serveElapsed += deltaSeconds;
      table.status = "serving";
      table.serviceElapsed = customer.serveElapsed;
      if (customer.serveElapsed >= currentServeTime()) {
        finishService(customer, table);
      }
      continue;
    }

    if (customer.phase === "enjoying") {
      customer.enjoyElapsed += deltaSeconds;
      table.status = "enjoying";
      table.enjoyElapsed = customer.enjoyElapsed;
      if (customer.enjoyElapsed >= 2.4) {
        beginExit(customer, table);
      }
      continue;
    }

    if (customer.phase === "walking_out") {
      const reachedDoor = moveAlongWaypoints(
        customer,
        deltaSeconds,
        currentWalkSpeedMultiplier(),
      );
      if (reachedDoor) {
        customersToRemove.add(customer.id);
      }
    }
  }

  if (customersToRemove.size > 0) {
    gameState.customers = gameState.customers.filter(
      (customer) => !customersToRemove.has(customer.id),
    );
  }
}

function syncTablesFromCustomers() {
  for (const table of gameState.tables) {
    const customer = gameState.customers.find((entry) => entry.id === table.customerId);

    if (!customer) {
      if (table.status !== "empty") {
        table.status = "empty";
      }
      table.customerId = null;
      table.waitElapsed = 0;
      table.serviceElapsed = 0;
      table.enjoyElapsed = 0;
      continue;
    }

    table.customerId = customer.id;

    if (customer.phase === "walking_to_table") {
      table.status = "reserved";
      table.waitElapsed = 0;
      table.serviceElapsed = 0;
      table.enjoyElapsed = 0;
      continue;
    }

    if (customer.phase === "waiting") {
      table.status = "waiting";
      table.waitElapsed = customer.waitElapsed;
      continue;
    }

    if (customer.phase === "being_served") {
      table.status = "serving";
      table.serviceElapsed = customer.serveElapsed;
      continue;
    }

    if (customer.phase === "enjoying") {
      table.status = "enjoying";
      table.enjoyElapsed = customer.enjoyElapsed;
      continue;
    }

    if (customer.phase === "walking_out") {
      table.status = "empty";
      table.customerId = null;
      table.waitElapsed = 0;
      table.serviceElapsed = 0;
      table.enjoyElapsed = 0;
    }
  }
}

function spawnCustomer() {
  const freeTable = findFreeTableLayout();
  if (!freeTable) {
    return;
  }

  const customerType = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
  const customerId = gameState.nextCustomerId;
  gameState.nextCustomerId += 1;

  const customer = {
    id: customerId,
    type: customerType.id,
    drinkId: pickDrinkId(),
    phase: "walking_to_table",
    x: DOOR_OUTSIDE_X,
    y: DOOR_Y,
    targetX: freeTable.seatX,
    targetY: freeTable.seatY,
    waypoints: buildEntryWaypoints(freeTable),
    tableId: freeTable.id,
    speed: 140,
    waitElapsed: 0,
    serveElapsed: 0,
    enjoyElapsed: 0,
    rewardGranted: false,
    tipReward: 0,
  };
  customer.orderText = buildCustomerOrderText(customer.type, customer.drinkId);

  const table = getTableState(freeTable.id);
  table.status = "reserved";
  table.customerId = customerId;
  table.lastOutcome = null;
  gameState.customers.push(customer);
}

function beginExit(customer, table) {
  const tableLayout = getTableLayout(customer.tableId);
  customer.phase = "walking_out";
  customer.targetX = DOOR_OUTSIDE_X;
  customer.targetY = DOOR_Y;
  customer.waypoints = tableLayout ? buildExitWaypoints(tableLayout) : [];
  customer.serveElapsed = 0;
  customer.enjoyElapsed = 0;
  table.status = "empty";
  table.customerId = null;
  table.waitElapsed = 0;
  table.serviceElapsed = 0;
  table.enjoyElapsed = 0;
}

function finishService(customer, table) {
  const waitTime = customer.waitElapsed;
  const tableLayout = getTableLayout(customer.tableId);
  const drink = getDrinkType(customer.drinkId);
  let scoreGain = 0;
  let tipGain = 0;

  if (waitTime <= 5) {
    scoreGain = 2;
    tipGain = 1;
  } else if (waitTime <= 10) {
    scoreGain = 1;
  }

  gameState.coins += 1 + tipGain;
  gameState.tipCoins += tipGain;
  gameState.score += 1 + scoreGain;
  gameState.totalServed += 1;
  customer.rewardGranted = true;
  customer.tipReward = tipGain;
  customer.phase = "enjoying";
  customer.enjoyElapsed = 0;
  table.lastOutcome = tipGain > 0 ? "tipped" : "served";
  runtime.audio.beep(tipGain > 0 ? "tip" : "serve");

  if (tableLayout) {
    spawnFloatingText({
      text: tipGain > 0 ? `+${1 + tipGain} xu / +${1 + scoreGain} điểm` : `+1 xu / +${1 + scoreGain} điểm`,
      x: tableLayout.seatX,
      y: tableLayout.y - 14,
      color: tipGain > 0 ? "#fff2a8" : "#dcffe1",
    });
  }

  const toastMessage =
    tipGain > 0
      ? `${customerLabel(customer.type)} rất ưng ly ${drinkLabel(drink)} nên boa thêm.`
      : `${customerLabel(customer.type)} đã nhận ly ${drinkLabel(drink)}.`;
  showToast(toastMessage);
}

function handleCanvasPointer(event) {
  if (runtime.mode === "title") {
    handleStartButton();
    return;
  }

  if (runtime.mode !== "playing") {
    return;
  }

  const point = getCanvasPoint(event);
  if (!point) {
    return;
  }

  const tableLayout = TABLE_LAYOUT.find((table) =>
    point.x >= table.x &&
    point.x <= table.x + table.width &&
    point.y >= table.y &&
    point.y <= table.y + table.height + 70,
  );

  if (!tableLayout) {
    return;
  }

  const table = getTableState(tableLayout.id);
  if (!table || table.status !== "waiting") {
    showToast("Bàn này chưa sẵn để phục vụ.");
    return;
  }

  const customer = gameState.customers.find((entry) => entry.id === table.customerId);
  if (!customer) {
    return;
  }

  customer.phase = "being_served";
  customer.serveElapsed = 0;
  table.status = "serving";
  table.serviceElapsed = 0;
  runtime.audio.beep("tap");
  showToast(`Đang pha ${drinkLabel(getDrinkType(customer.drinkId))}.`);
}

function getCanvasPoint(event) {
  const bounds = ui.canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    return null;
  }

  const scaleX = BOARD_WIDTH / bounds.width;
  const scaleY = BOARD_HEIGHT / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY,
  };
}

function handleStartButton() {
  if (runtime.mode === "playing") {
    return;
  }

  if (runtime.mode === "title") {
    runtime.sessionStartedAt = Date.now();
  }

  runtime.mode = "playing";
  runtime.lastFrame = 0;
  runtime.accumulator = 0;
  gameState.audioUnlocked = true;
  runtime.audio.unlock();
  ui.titleOverlay.classList.add("hidden");
  updateOverlay();
  updateHud();
  void persistGameState("start");
}

async function handleInstallButton() {
  if (!runtime.installPrompt) {
    return;
  }

  runtime.installPrompt.prompt();
  await runtime.installPrompt.userChoice;
  runtime.installPrompt = null;
  ui.installButton.classList.add("hidden");
}

function buyUpgrade(kind) {
  if (runtime.mode === "title") {
    handleStartButton();
  }

  if (kind === "faster_serve") {
    if (gameState.serveLevel > 0) {
      showToast("Đã mua Pha nhanh rồi.");
      return;
    }

    if (gameState.coins < 10) {
      showToast("Cần 10 xu để mua Pha nhanh.");
      return;
    }

    gameState.coins -= 10;
    gameState.serveLevel = 1;
    runtime.audio.beep("upgrade");
    showToast("Đã mở Pha nhanh.");
    void persistGameState("upgrade");
    updateHud();
    return;
  }

  if (kind === "umbrella") {
    if (gameState.umbrellaOwned) {
      showToast("Quán đã có ô che rồi.");
      return;
    }

    if (gameState.coins < 20) {
      showToast("Cần 20 xu để mua ô che.");
      return;
    }

    gameState.coins -= 20;
    gameState.umbrellaOwned = true;
    runtime.audio.beep("upgrade");
    showToast("Ô che đã sẵn sàng. Mưa sẽ đỡ ảnh hưởng hơn.");
    void persistGameState("upgrade");
    updateHud();
  }
}

function togglePause() {
  if (runtime.mode === "title") {
    return;
  }

  if (runtime.mode === "paused") {
    runtime.mode = "playing";
    runtime.lastFrame = 0;
    ui.titleOverlay.classList.add("hidden");
    showToast("Bán tiếp thôi.");
  } else {
    runtime.mode = "paused";
    updateOverlay();
    showToast("Tạm nghỉ một chút.");
  }

  updateOverlay();
  updateHud();
}

async function resetSave() {
  const confirmed = window.confirm("Xóa dữ liệu lưu cục bộ của quán này nhé?");
  if (!confirmed) {
    return;
  }

  gameState = createDefaultState();
  runtime.sessionStartedAt = Date.now();
  runtime.mode = "title";
  runtime.lastFrame = 0;
  runtime.accumulator = 0;
  updateOverlay();
  updateHud();
  await persistGameState("reset");
  showToast("Đã xóa dữ liệu. Quán quay về từ đầu rồi.");
}

async function handleVisibilityChange() {
  if (document.hidden) {
    runtime.hiddenStartedAt = Date.now();
    runtime.lastFrame = 0;
    runtime.accumulator = 0;
    await persistGameState("hidden");
    return;
  }

  if (!runtime.hiddenStartedAt || runtime.mode !== "playing") {
    runtime.hiddenStartedAt = null;
    runtime.lastFrame = 0;
    return;
  }

  const elapsedSeconds = (Date.now() - runtime.hiddenStartedAt) / 1000;
  runtime.hiddenStartedAt = null;
  applyResumeSimulation(elapsedSeconds);
  runtime.lastFrame = 0;
  updateHud();
}

function applyResumeSimulation(elapsedSeconds) {
  const catchUp = Math.min(elapsedSeconds, MAX_CATCH_UP_SECONDS);
  const extraIdle = Math.max(0, Math.min(elapsedSeconds - catchUp, MAX_IDLE_SECONDS));

  if (catchUp > 0) {
    let remaining = catchUp;
    while (remaining > 0) {
      const step = Math.min(FIXED_STEP, remaining);
      updateWeather(step);
      updateStreetLife(step);
      updateSpawning(step);
      updateCustomers(step);
      syncTablesFromCustomers();
      updateFloatingTexts(step);
      remaining -= step;
    }
  }

  if (extraIdle > 0) {
    const estimatedCoins = Math.floor(
      (extraIdle / BASE_SPAWN_INTERVAL) * IDLE_EFFICIENCY,
    );
    if (estimatedCoins > 0) {
      gameState.coins += estimatedCoins;
      gameState.score += estimatedCoins;
      showToast(`Cộng dồn lúc vắng: +${estimatedCoins} xu.`);
    }
  }

  updateHud();
  void persistGameState("resume");
}

function renderScene(timestamp) {
  ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  drawRoom();
  drawTables();
  drawWanderers(timestamp);
  drawCustomers(timestamp);
  drawFloatingTexts();

  if (gameState.weatherState === "rain") {
    drawRainOverlay(timestamp);
  }

  if (gameState.windRemaining > 0) {
    drawWindOverlay(timestamp);
  }

  if (runtime.mode === "paused") {
    drawPauseHint();
  }

  renderToast();
}

function drawRoom() {
  const wallGradient = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
  wallGradient.addColorStop(0, "#f6dfb1");
  wallGradient.addColorStop(0.55, "#d9a46f");
  wallGradient.addColorStop(1, "#7f4a2d");
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  ctx.fillStyle = "#8290a3";
  ctx.fillRect(0, 290, 176, BOARD_HEIGHT - 290);
  ctx.fillStyle = "#a3afbe";
  ctx.fillRect(0, 320, 176, 14);
  ctx.fillStyle = "#5a6170";
  ctx.fillRect(0, 334, 176, BOARD_HEIGHT - 334);

  ctx.fillStyle = "#ebd4a8";
  ctx.fillRect(176, 88, BOARD_WIDTH - 176, 92);

  ctx.fillStyle = "#9a6a44";
  ctx.fillRect(176, 180, BOARD_WIDTH - 176, BOARD_HEIGHT - 180);

  ctx.strokeStyle = "rgba(255, 234, 202, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 190; x < BOARD_WIDTH; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x, BOARD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 202; y < BOARD_HEIGHT; y += 34) {
    ctx.beginPath();
    ctx.moveTo(176, y);
    ctx.lineTo(BOARD_WIDTH, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#4b2918";
  ctx.fillRect(38, 102, 54, 196);
  ctx.fillStyle = "#1f130c";
  roundedRectPath(ctx, 50, 118, 30, 156, 12);
  ctx.fill();
  ctx.fillStyle = "#ffd77b";
  roundedRectPath(ctx, 69, 188, 8, 10, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(252, 244, 213, 0.22)";
  ctx.fillRect(102, 248, 142, 60);
  ctx.fillRect(224, 116, 36, 304);

  ctx.fillStyle = "#6c3e23";
  roundedRectPath(ctx, 102, 70, 198, 120, 26);
  ctx.fill();
  ctx.fillStyle = "#8f5630";
  roundedRectPath(ctx, 114, 82, 174, 98, 22);
  ctx.fill();
  ctx.fillStyle = "#fff4d2";
  roundedRectPath(ctx, 132, 96, 138, 42, 14);
  ctx.fill();
  ctx.fillStyle = "#734125";
  ctx.font = '700 15px "Trebuchet MS", sans-serif';
  ctx.fillText("THỰC ĐƠN", 162, 121);
  ctx.fillStyle = "#5e341e";
  ctx.font = '600 12px "Trebuchet MS", sans-serif';
  ctx.fillText("Thái  Chanh  Matcha", 124, 143);
  ctx.fillText("Dâu  Đào  Sữa", 138, 160);

  ctx.fillStyle = "#d46f45";
  roundedRectPath(ctx, 88, 54, 226, 28, 10);
  ctx.fill();
  ctx.fillStyle = "#f6d59a";
  for (let stripe = 0; stripe < 6; stripe += 1) {
    ctx.fillRect(100 + stripe * 34, 54, 18, 28);
  }

  ctx.fillStyle = "#f3dfb4";
  ctx.font = '700 24px "Trebuchet MS", sans-serif';
  ctx.fillText("Quầy trà", 134, 210);
  ctx.font = '700 20px "Trebuchet MS", sans-serif';
  ctx.fillText("Cửa vào", 18, 322);

  drawStringLights();
  drawCounterDisplay();
  drawPlant(146, 320, 1.1);
  drawPlant(270, 232, 0.85);
}

function drawTables() {
  for (const layout of TABLE_LAYOUT) {
    const table = getTableState(layout.id);
    const customer = table?.customerId
      ? gameState.customers.find((entry) => entry.id === table.customerId)
      : null;

    ctx.save();
    ctx.fillStyle = "rgba(39, 20, 11, 0.22)";
    ctx.beginPath();
    ctx.ellipse(
      layout.x + layout.width / 2,
      layout.y + layout.height / 2 + 26,
      54,
      16,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#5e3922";
    roundedRectPath(ctx, layout.x + 16, layout.y + 70, layout.width - 32, 18, 8);
    ctx.fill();
    ctx.fillStyle = "#6b4028";
    roundedRectPath(ctx, layout.x + 42, layout.y + 24, 14, 52, 6);
    ctx.fill();
    roundedRectPath(ctx, layout.x + layout.width - 56, layout.y + 24, 14, 52, 6);
    ctx.fill();
    ctx.fillStyle = "#8d5b37";
    roundedRectPath(ctx, layout.x + 8, layout.y + 10, layout.width - 16, 56, 18);
    ctx.fill();
    ctx.fillStyle = "#aa744a";
    roundedRectPath(ctx, layout.x + 14, layout.y + 16, layout.width - 28, 22, 10);
    ctx.fill();
    drawTableStatusHalo(layout, table);
    drawTableDrinkMarker(layout, customer);
    drawTableLabel(layout);
    drawTableTimer(layout, table);
    drawServeHint(layout, table);
    ctx.restore();
  }
}

function drawTableStatusHalo(layout, table) {
  if (table.status === "empty") {
    return;
  }

  const centerX = layout.x + layout.width / 2;
  const centerY = layout.y + layout.height / 2;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 64, 34, 0, 0, Math.PI * 2);

  if (table.status === "serving") {
    ctx.fillStyle = "rgba(255, 166, 83, 0.28)";
  } else if (table.status === "enjoying") {
    ctx.fillStyle = "rgba(112, 196, 151, 0.26)";
  } else {
    ctx.fillStyle = "rgba(112, 158, 215, 0.22)";
  }

  ctx.fill();
}

function drawTableLabel(layout) {
  ctx.fillStyle = "#472a19";
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText(`T${layout.index + 1}`, layout.x + 10, layout.y + 18);
}

function drawTableTimer(layout, table) {
  if (table.status === "empty" || table.status === "reserved") {
    return;
  }

  const timerX = layout.x + layout.width / 2;
  const timerY = layout.y - 6;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = '700 26px "Courier New", monospace';

  if (table.status === "waiting") {
    const remaining = Math.max(0, Math.ceil(MAX_WAIT_SECONDS - table.waitElapsed));
    const ratio = remaining / MAX_WAIT_SECONDS;
    ctx.fillStyle = ratio > 0.55 ? "#174d2e" : ratio > 0.3 ? "#915c13" : "#9b2626";
    ctx.fillRect(timerX - 26, timerY - 24, 52, 28);
    ctx.fillStyle = "#fff7ea";
    ctx.fillText(String(remaining), timerX, timerY - 2);
  } else if (table.status === "serving") {
    const progress = Math.min(1, table.serviceElapsed / currentServeTime());
    ctx.fillStyle = "#22507d";
    ctx.fillRect(timerX - 32, timerY - 24, 64, 28);
    ctx.fillStyle = "#fff7ea";
    ctx.fillText(`${Math.round(progress * 100)}%`, timerX, timerY - 2);
  } else if (table.status === "enjoying") {
    ctx.fillStyle = "#2a683d";
    ctx.fillRect(timerX - 30, timerY - 24, 60, 28);
    ctx.fillStyle = "#fff7ea";
    ctx.fillText("Xong", timerX, timerY - 2);
  }

  ctx.restore();
}

function drawServeHint(layout, table) {
  if (table.status !== "waiting") {
    return;
  }

  const centerX = layout.x + layout.width / 2;
  const centerY = layout.y + layout.height / 2;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 248, 214, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX - 6, centerY);
  ctx.lineTo(centerX + 6, centerY);
  ctx.moveTo(centerX, centerY - 6);
  ctx.lineTo(centerX, centerY + 6);
  ctx.stroke();
  const customer = table.customerId
    ? gameState.customers.find((entry) => entry.id === table.customerId)
    : null;
  const drink = customer ? getDrinkType(customer.drinkId) : null;
  if (drink) {
    ctx.fillStyle = "rgba(255, 247, 226, 0.95)";
    roundedRectPath(ctx, centerX - 28, centerY + 20, 56, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#60351d";
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(drinkShortLabel(drink), centerX, centerY + 34);
  }
  ctx.restore();
}

function drawCustomers(timestamp) {
  const sorted = [...gameState.customers].sort((left, right) => left.y - right.y);

  for (const customer of sorted) {
    const style = getCustomerType(customer.type);
    const drink = getDrinkType(customer.drinkId);
    if (!style || !drink) {
      continue;
    }

    const walking = customer.phase === "walking_to_table" || customer.phase === "walking_out";
    const bob = Math.sin((timestamp / 150) + customer.id) * (walking ? 1.6 : 0.7);
    const baseY = customer.y + bob;

    drawCharacterShadow(customer.x, baseY, walking ? 17 : 15);
    drawCustomerFigure(customer, style, drink, timestamp, baseY);
    drawCustomerStageDecor(customer, drink, timestamp, baseY);
  }
}

function drawWanderers(timestamp) {
  const sorted = [...gameState.wanderers].sort((left, right) => left.y - right.y);

  for (const wanderer of sorted) {
    const bob = Math.sin((timestamp / 180) + wanderer.id * 0.7) * 0.8;
    const baseY = wanderer.y + bob;

    drawCharacterShadow(wanderer.x, baseY + 2, wanderer.kind === "dog" ? 20 : 18);
    ctx.save();
    ctx.translate(wanderer.x, baseY);
    if (wanderer.facing < 0) {
      ctx.scale(-1, 1);
    }

    if (wanderer.kind === "dog") {
      drawDog();
    } else {
      drawCat();
    }
    ctx.restore();
  }
}

function drawFloatingTexts() {
  for (const item of runtime.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - (item.age / item.lifetime));
    ctx.fillStyle = item.color;
    ctx.textAlign = "center";
    ctx.font = '700 18px "Trebuchet MS", sans-serif';
    ctx.fillText(item.text, item.x, item.y - (item.age * 22));
    ctx.restore();
  }
}

function drawRainOverlay(timestamp) {
  ctx.save();
  ctx.fillStyle = "rgba(55, 102, 153, 0.10)";
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  ctx.strokeStyle = "rgba(222, 244, 255, 0.44)";
  ctx.lineWidth = 2;
  const windTilt = gameState.windRemaining > 0 ? 12 : 0;

  for (let index = 0; index < 44; index += 1) {
    const x = (index * 34 + (timestamp / 3)) % (BOARD_WIDTH + 40);
    const y = ((index * 21) + (timestamp / 7)) % (BOARD_HEIGHT + 60);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8 - windTilt, y + 16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWindOverlay(timestamp) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 245, 211, 0.34)";
  ctx.lineWidth = 3;

  for (let index = 0; index < 16; index += 1) {
    const originX = ((timestamp / 2) + index * 78) % (BOARD_WIDTH + 160) - 80;
    const originY = 110 + ((index * 29) % 310);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.bezierCurveTo(
      originX + 26,
      originY - 8,
      originX + 58,
      originY + 8,
      originX + 86,
      originY - 2,
    );
    ctx.stroke();
  }

  for (let leaf = 0; leaf < 12; leaf += 1) {
    const x = ((timestamp / 1.6) + leaf * 96) % (BOARD_WIDTH + 200) - 100;
    const y = 100 + ((leaf * 37) % 320);
    const rotation = (timestamp / 180) + leaf;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = leaf % 2 === 0 ? "#d2b45f" : "#9ec46b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawPauseHint() {
  ctx.save();
  ctx.fillStyle = "rgba(23, 12, 8, 0.56)";
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  ctx.fillStyle = "#fff7ea";
  ctx.textAlign = "center";
  ctx.font = '700 36px "Trebuchet MS", sans-serif';
  ctx.fillText("Tạm dừng", BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
  ctx.font = '600 18px "Trebuchet MS", sans-serif';
  ctx.fillText("Nhấn Bán tiếp để mở quán lại.", BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 32);
  ctx.restore();
}

function renderToast() {
  if (runtime.toastUntil <= performance.now()) {
    ui.toast.classList.add("hidden");
  }
}

function updateHud() {
  const busyTables = gameState.tables.filter((table) => table.status !== "empty").length;

  ui.coinsValue.textContent = String(gameState.coins);
  ui.scoreValue.textContent = String(gameState.score);
  ui.servedValue.textContent = String(gameState.totalServed);
  ui.tipsValue.textContent = String(gameState.tipCoins);
  ui.weatherValue.textContent =
    gameState.weatherState === "rain"
      ? `mưa ${Math.ceil(gameState.weatherRemaining)}s`
      : "nắng ráo";
  ui.tablesValue.textContent = `${busyTables} / ${TABLE_LAYOUT.length}`;
  ui.flowValue.textContent = `${gameState.totalServed} phục vụ / ${gameState.totalMissed} lỡ`;
  ui.incidentValue.textContent = currentIncidentLabel();
  ui.saveValue.textContent = formatSaveStatus(runtime.saveStatus);
  ui.sessionValue.textContent = formatElapsed(Date.now() - runtime.sessionStartedAt);
  ui.pauseButton.innerHTML =
    runtime.mode === "paused"
      ? 'Bán tiếp<small>quay lại phục vụ</small>'
      : 'Tạm dừng<small>ngưng phục vụ</small>';

  ui.upgradeServe.disabled = gameState.serveLevel > 0 || gameState.coins < 10;
  ui.upgradeServe.innerHTML =
    gameState.serveLevel > 0
      ? 'Pha nhanh<small>đã mua</small>'
      : 'Pha nhanh<small>10 xu</small>';

  ui.upgradeUmbrella.disabled = gameState.umbrellaOwned || gameState.coins < 20;
  ui.upgradeUmbrella.innerHTML =
    gameState.umbrellaOwned
      ? 'Ô che<small>đã mua</small>'
      : 'Ô che<small>20 xu</small>';

  updateOverlay();
}

function updateOverlay() {
  if (runtime.mode === "title") {
    ui.titleOverlay.classList.remove("hidden");
    ui.startButton.textContent =
      gameState.totalServed > 0 || gameState.coins > 0 ? "Tiếp tục bán" : "Mở quán";
    ui.overlayCopy.textContent =
      "Chạm vào bàn trước khi hết giờ chờ. Khách sẽ gọi món bằng tiếng Việt, còn ngoài đường có thể đổi sang mưa, gió lớn, chó và mèo đi ngang.";
    return;
  }

  if (runtime.mode === "paused") {
    ui.titleOverlay.classList.remove("hidden");
    ui.startButton.textContent = "Tiếp tục ca";
    ui.overlayCopy.textContent =
      "Quán đang tạm dừng. Khi sẵn sàng thì mở lại để khách tiếp tục vào bàn.";
    return;
  }

  ui.titleOverlay.classList.add("hidden");
}

function updateOnlineState() {
  runtime.isOnline = navigator.onLine;
  ui.offlineBadge.classList.toggle("hidden", runtime.isOnline);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker
    .register("./sw.js", { scope: "./" })
    .catch((error) => console.warn("Service worker registration failed.", error));
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove("hidden");
  runtime.toastUntil = performance.now() + 2200;
}

function moveEntityToward(entity, targetX, targetY, deltaSeconds, speedMultiplier = 1) {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    entity.x = targetX;
    entity.y = targetY;
    return true;
  }

  const maxStep = entity.speed * deltaSeconds * speedMultiplier;
  if (distance <= maxStep) {
    entity.x = targetX;
    entity.y = targetY;
    return true;
  }

  entity.x += (dx / distance) * maxStep;
  entity.y += (dy / distance) * maxStep;
  return false;
}

function moveAlongWaypoints(entity, deltaSeconds, speedMultiplier = 1) {
  if (!Array.isArray(entity.waypoints) || entity.waypoints.length === 0) {
    return moveEntityToward(entity, entity.targetX, entity.targetY, deltaSeconds, speedMultiplier);
  }

  const currentWaypoint = entity.waypoints[0];
  const reached = moveEntityToward(
    entity,
    currentWaypoint.x,
    currentWaypoint.y,
    deltaSeconds,
    speedMultiplier,
  );

  if (!reached) {
    return false;
  }

  entity.waypoints.shift();
  if (entity.waypoints.length === 0) {
    entity.targetX = currentWaypoint.x;
    entity.targetY = currentWaypoint.y;
    return true;
  }

  return false;
}

function getTableLayout(id) {
  return TABLE_LAYOUT.find((table) => table.id === id) ?? null;
}

function getTableState(id) {
  return gameState.tables.find((table) => table.id === id) ?? null;
}

function getCustomerType(typeId) {
  return CUSTOMER_TYPE_BY_ID.get(typeId) ?? null;
}

function getDrinkType(drinkId) {
  return DRINK_TYPE_BY_ID.get(drinkId) ?? null;
}

function pickDrinkId() {
  return DRINK_TYPES[Math.floor(Math.random() * DRINK_TYPES.length)].id;
}

function drinkLabel(drink) {
  return drink?.labelVi ?? drink?.label ?? "trà";
}

function drinkShortLabel(drink) {
  return drink?.shortLabelVi ?? drink?.shortLabel ?? "Trà";
}

function drinkOrderLabel(drink) {
  return drink?.orderLabelVi ?? drinkLabel(drink);
}

function buildCustomerOrderText(typeId, drinkId) {
  const customerType = getCustomerType(typeId);
  const drink = getDrinkType(drinkId);
  const templates = Array.isArray(customerType?.speechTemplates) && customerType.speechTemplates.length > 0
    ? customerType.speechTemplates
    : ["Cho mình một ly {drink} nhé."];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace("{drink}", drinkOrderLabel(drink));
}

function normalizeOrderText(orderText, typeId, drinkId) {
  return typeof orderText === "string" && orderText.trim().length > 0
    ? orderText.trim()
    : buildCustomerOrderText(typeId, drinkId);
}

function currentWalkSpeedMultiplier() {
  return gameState.windRemaining > 0 ? 0.82 : 1;
}

function findFreeTableLayout() {
  const freeTables = TABLE_LAYOUT.filter((layout) => {
    const table = getTableState(layout.id);
    return table && table.status === "empty";
  });

  if (freeTables.length === 0) {
    return null;
  }

  return freeTables[Math.floor(Math.random() * freeTables.length)];
}

function currentServeTime() {
  return gameState.serveLevel > 0 ? FAST_SERVE_TIME : BASE_SERVE_TIME;
}

function getSpawnRateMultiplier() {
  if (gameState.weatherState !== "rain") {
    return 1;
  }

  return gameState.umbrellaOwned ? 0.8 : 0.5;
}

function randomSpawnInterval(rateMultiplier) {
  const base = BASE_SPAWN_INTERVAL + randomInRange(-SPAWN_VARIANCE, SPAWN_VARIANCE);
  return Math.max(2.4, base / Math.max(rateMultiplier, 0.2));
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function asNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function customerLabel(type) {
  return getCustomerType(type)?.labelVi ?? "Khách";
}

function formatSaveStatus(status) {
  switch (status) {
    case "booting":
      return "đang mở";
    case "ready":
      return "sẵn sàng";
    case "loaded":
      return "đã tải";
    case "recovered":
      return "đã khôi phục";
    case "saved":
      return "đã lưu";
    case "fallback":
      return "lưu dự phòng";
    case "save error":
      return "lỗi lưu";
    case "start":
      return "bắt đầu";
    case "upgrade":
      return "nâng cấp";
    case "hidden":
      return "ẩn nền";
    case "resume":
      return "trở lại";
    case "pagehide":
      return "rời trang";
    case "reset":
      return "đã xóa";
    default:
      return status;
  }
}

function splitOrderText(orderText, maxChars = 18) {
  if (typeof orderText !== "string" || orderText.trim().length === 0) {
    return [];
  }

  const words = orderText.trim().split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars || currentLine.length === 0) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
    if (lines.length === 1) {
      continue;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= 2) {
    return lines;
  }

  const firstLine = lines[0];
  const remainder = lines.slice(1).join(" ");
  return [firstLine, remainder];
}

function currentIncidentLabel() {
  const pieces = [];
  if (gameState.windRemaining > 0) {
    pieces.push("gió lớn");
  }
  if (hasWanderer("dog")) {
    pieces.push("chó");
  }
  if (hasWanderer("cat")) {
    pieces.push("mèo");
  }

  return pieces.length > 0 ? pieces.join(" / ") : "yên ắng";
}

function parseSaveSource(primaryRaw, backupRaw) {
  if (primaryRaw) {
    try {
      return JSON.parse(primaryRaw);
    } catch (error) {
      console.warn("Primary fallback save is unreadable, trying backup.", error);
    }
  }

  if (backupRaw) {
    try {
      return JSON.parse(backupRaw);
    } catch (error) {
      console.warn("Backup save is unreadable.", error);
    }
  }

  return null;
}

function buildEntryWaypoints(tableLayout) {
  return [
    { x: DOOR_INSIDE_X, y: DOOR_Y },
    { x: tableLayout.approachX, y: tableLayout.approachY },
    { x: tableLayout.seatX, y: tableLayout.seatY },
  ];
}

function buildExitWaypoints(tableLayout) {
  return [
    { x: tableLayout.approachX, y: tableLayout.approachY },
    { x: DOOR_INSIDE_X, y: DOOR_Y },
    { x: DOOR_OUTSIDE_X, y: DOOR_Y },
  ];
}

function normalizePointList(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  return points
    .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }));
}

function normalizeWaypoints(waypoints, tableLayout, phase) {
  const normalized = normalizePointList(waypoints);
  if (normalized.length > 0) {
    return normalized;
  }

  if (phase === "walking_out") {
    return buildExitWaypoints(tableLayout);
  }

  if (phase === "walking_to_table") {
    return buildEntryWaypoints(tableLayout);
  }

  return [];
}

function spawnFloatingText({ text, x, y, color }) {
  runtime.floatingTexts.push({
    text,
    x,
    y,
    color,
    age: 0,
    lifetime: 1.4,
  });
}

function updateFloatingTexts(deltaSeconds) {
  runtime.floatingTexts = runtime.floatingTexts
    .map((item) => ({
      ...item,
      age: item.age + deltaSeconds,
    }))
    .filter((item) => item.age < item.lifetime);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawStringLights() {
  ctx.save();
  ctx.strokeStyle = "rgba(97, 57, 30, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, 96);
  ctx.quadraticCurveTo(328, 44, 480, 90);
  ctx.quadraticCurveTo(648, 140, 812, 96);
  ctx.stroke();

  for (let bulb = 0; bulb < 10; bulb += 1) {
    const x = 176 + bulb * 70;
    const y = 90 + Math.sin(bulb * 0.85) * 11;
    ctx.strokeStyle = "rgba(97, 57, 30, 0.45)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
    ctx.fillStyle = bulb % 2 === 0 ? "#ffe389" : "#f6d2a2";
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCounterDisplay() {
  ctx.save();
  ctx.fillStyle = "#77462a";
  roundedRectPath(ctx, 110, 214, 162, 86, 18);
  ctx.fill();
  ctx.fillStyle = "#cc8c58";
  roundedRectPath(ctx, 122, 226, 138, 28, 12);
  ctx.fill();
  ctx.fillStyle = "rgba(240, 248, 255, 0.16)";
  roundedRectPath(ctx, 122, 232, 138, 48, 12);
  ctx.fill();

  const displayDrinks = [DRINK_TYPES[0], DRINK_TYPES[3], DRINK_TYPES[4]];
  displayDrinks.forEach((drink, index) => {
    drawDrinkGlass(drink, 146 + index * 36, 274, 0.78);
  });

  ctx.fillStyle = "#f6ddbb";
  roundedRectPath(ctx, 174, 246, 46, 12, 6);
  ctx.fill();
  ctx.fillStyle = "#6c3e23";
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("bán chạy", 197, 255);
  ctx.restore();
}

function drawPlant(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#8d5d34";
  roundedRectPath(ctx, -18, -12, 36, 26, 10);
  ctx.fill();
  ctx.fillStyle = "#6fa35e";
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.ellipse(-10 + index * 5, -18 - (index % 2) * 7, 9, 16, index * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTableDrinkMarker(layout, customer) {
  if (!customer) {
    return;
  }

  const drink = getDrinkType(customer.drinkId);
  if (!drink) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(255, 245, 221, 0.96)";
  roundedRectPath(ctx, layout.x + layout.width - 52, layout.y + 8, 40, 18, 8);
  ctx.fill();
  ctx.fillStyle = "#61361d";
  ctx.textAlign = "center";
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.fillText(drinkShortLabel(drink), layout.x + layout.width - 32, layout.y + 20);

  if (customer.phase === "being_served" || customer.phase === "enjoying") {
    drawDrinkGlass(drink, layout.x + layout.width - 28, layout.y + 56, 0.72);
  }
  ctx.restore();
}

function drawCharacterShadow(x, y, width) {
  ctx.save();
  ctx.fillStyle = "rgba(30, 18, 10, 0.24)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, width, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCustomerFigure(customer, style, drink, timestamp, baseY) {
  const walking = customer.phase === "walking_to_table" || customer.phase === "walking_out";
  const seated = !walking;
  const serving = customer.phase === "being_served";
  const enjoying = customer.phase === "enjoying";
  const direction = walking ? getFacingDirection(customer) : 1;
  const stride = walking ? Math.sin((timestamp / 95) + customer.id) * 0.42 : 0;
  const backStride = walking ? -stride : seated ? -0.2 : 0;
  const frontStride = walking ? stride : seated ? 0.28 : 0;
  const armSwing = walking ? stride * 0.7 : 0;
  const torsoWidth = style.silhouette === "broad" ? 25 : style.silhouette === "compact" ? 20 : 22;
  const torsoHeight = style.silhouette === "compact" ? 22 : 24;
  const legTopY = seated ? -24 : -34;
  const legLength = seated ? 24 : 34;
  const shoulderY = legTopY - torsoHeight + 5;
  const headY = shoulderY - 17;

  ctx.save();
  ctx.translate(customer.x, baseY);
  if (direction < 0) {
    ctx.scale(-1, 1);
  }

  drawLimbSegment(-6, legTopY, 8, legLength, backStride, style.bottom);
  drawLimbSegment(6, legTopY, 8, legLength, frontStride, style.bottom);

  ctx.fillStyle = "#f7f0e6";
  ctx.beginPath();
  ctx.ellipse(-7 + backStride * 8, 0, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(7 + frontStride * 8, 0, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLimbSegment(
    -torsoWidth / 2 - 4,
    shoulderY,
    7,
    20,
    serving ? -0.55 : -0.28 - armSwing,
    style.skin,
  );
  drawLimbSegment(
    torsoWidth / 2 + 4,
    shoulderY,
    7,
    20,
    enjoying ? -0.85 : serving ? -1.05 : 0.32 + armSwing,
    style.skin,
  );

  ctx.fillStyle = style.top;
  roundedRectPath(ctx, -torsoWidth / 2, legTopY - torsoHeight, torsoWidth, torsoHeight, 9);
  ctx.fill();
  ctx.fillStyle = style.accent;
  roundedRectPath(ctx, -torsoWidth / 2 + 4, legTopY - torsoHeight + 4, torsoWidth - 8, 7, 4);
  ctx.fill();

  ctx.fillStyle = style.skin;
  ctx.beginPath();
  ctx.ellipse(0, headY, 12, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  drawHair(style, headY);
  drawFace(customer.phase, headY);

  if (enjoying) {
    drawDrinkGlass(drink, 16, headY + 12, 0.78);
  }

  ctx.restore();
}

function drawCustomerStageDecor(customer, drink, timestamp, baseY) {
  if (customer.phase === "waiting" || customer.phase === "being_served") {
    drawOrderBubble(
      customer.x + 2,
      baseY - 82,
      drink,
      customer.orderText,
      customer.phase === "being_served" ? "Đang pha" : "Gọi món",
    );
  }

  if (customer.phase === "enjoying") {
    const sparkleX = customer.x + 24;
    const sparkleY = baseY - 74 + Math.sin((timestamp / 160) + customer.id) * 2;
    drawSparkle(sparkleX, sparkleY, 6, "#fff1a6");
    drawSparkle(sparkleX + 12, sparkleY + 10, 4, "#ffe4d1");
  }
}

function drawOrderBubble(x, y, drink, orderText, statusText) {
  const orderLines = splitOrderText(orderText);
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 230, 0.96)";
  roundedRectPath(ctx, x - 62, y - 22, 124, 46, 16);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 24);
  ctx.lineTo(x, y + 34);
  ctx.lineTo(x + 10, y + 24);
  ctx.closePath();
  ctx.fill();
  drawDrinkGlass(drink, x - 44, y + 14, 0.56);
  ctx.fillStyle = "#5f351c";
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(drinkShortLabel(drink), x - 28, y - 7);
  ctx.font = '600 8px "Trebuchet MS", sans-serif';
  ctx.fillStyle = "#8d6040";
  ctx.fillText(statusText, x + 18, y - 7);
  ctx.font = '600 8.5px "Trebuchet MS", sans-serif';
  ctx.fillStyle = "#5f351c";
  if (orderLines[0]) {
    ctx.fillText(orderLines[0], x - 28, y + 6);
  }
  if (orderLines[1]) {
    ctx.fillText(orderLines[1], x - 28, y + 17);
  }
  ctx.restore();
}

function drawSparkle(x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawDrinkGlass(drink, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(30, 16, 8, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = drink.cup;
  roundedRectPath(ctx, -8, -22, 16, 22, 5);
  ctx.fill();

  ctx.fillStyle = drink.liquid;
  roundedRectPath(ctx, -6, -17, 12, 15, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
  for (let ice = 0; ice < 3; ice += 1) {
    roundedRectPath(ctx, -5 + ice * 4, -16 + (ice % 2), 3, 3, 1);
    ctx.fill();
  }

  ctx.strokeStyle = drink.straw;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(3, -24);
  ctx.lineTo(7, -34);
  ctx.stroke();

  ctx.fillStyle = drink.garnish;
  ctx.beginPath();
  ctx.ellipse(-6, -23, 4, 2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLimbSegment(x, y, width, length, rotation, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  roundedRectPath(ctx, -width / 2, 0, width, length, width / 2);
  ctx.fill();
  ctx.restore();
}

function drawHair(style, headY) {
  ctx.save();
  ctx.fillStyle = style.hair;

  if (style.hairStyle === "long") {
    roundedRectPath(ctx, -13, headY - 13, 26, 18, 8);
    ctx.fill();
    roundedRectPath(ctx, -13, headY - 4, 8, 16, 4);
    ctx.fill();
    roundedRectPath(ctx, 5, headY - 4, 8, 16, 4);
    ctx.fill();
  } else if (style.hairStyle === "bun") {
    roundedRectPath(ctx, -13, headY - 13, 26, 14, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, headY - 15, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.hairStyle === "cap") {
    roundedRectPath(ctx, -13, headY - 13, 26, 12, 8);
    ctx.fill();
    roundedRectPath(ctx, 2, headY - 4, 10, 4, 2);
    ctx.fill();
  } else if (style.hairStyle === "puff") {
    ctx.beginPath();
    ctx.arc(-9, headY - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9, headY - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    roundedRectPath(ctx, -11, headY - 10, 22, 12, 7);
    ctx.fill();
  } else if (style.hairStyle === "thin") {
    roundedRectPath(ctx, -11, headY - 12, 22, 8, 5);
    ctx.fill();
  } else {
    roundedRectPath(ctx, -12, headY - 13, 24, 12, 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawFace(phase, headY) {
  ctx.save();
  ctx.fillStyle = "#5b341f";
  ctx.beginPath();
  ctx.arc(-4, headY - 1, 1.4, 0, Math.PI * 2);
  ctx.arc(4, headY - 1, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6e3f25";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (phase === "enjoying") {
    ctx.arc(0, headY + 5, 4, 0.1, Math.PI - 0.1);
  } else if (phase === "being_served") {
    ctx.moveTo(-3, headY + 6);
    ctx.lineTo(3, headY + 6);
  } else {
    ctx.arc(0, headY + 4, 3.5, 0.25, Math.PI - 0.25);
  }
  ctx.stroke();
  ctx.restore();
}

function getFacingDirection(entity) {
  const nextPoint = Array.isArray(entity.waypoints) && entity.waypoints.length > 0
    ? entity.waypoints[0]
    : { x: entity.targetX, y: entity.targetY };
  return nextPoint.x >= entity.x ? 1 : -1;
}

function drawDog() {
  ctx.fillStyle = "#7e5737";
  roundedRectPath(ctx, -18, -18, 36, 18, 8);
  ctx.fill();
  roundedRectPath(ctx, 10, -26, 16, 14, 7);
  ctx.fill();
  ctx.fillStyle = "#5f3b25";
  roundedRectPath(ctx, -20, -18, 7, 16, 3);
  ctx.fill();
  roundedRectPath(ctx, -7, -18, 7, 16, 3);
  ctx.fill();
  roundedRectPath(ctx, 5, -18, 7, 16, 3);
  ctx.fill();
  roundedRectPath(ctx, 16, -18, 7, 16, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-18, -16);
  ctx.lineTo(-28, -24);
  ctx.lineTo(-24, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d44d44";
  roundedRectPath(ctx, 12, -14, 9, 4, 2);
  ctx.fill();
  ctx.fillStyle = "#20130d";
  ctx.beginPath();
  ctx.arc(20, -21, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCat() {
  ctx.fillStyle = "#d7c3a3";
  roundedRectPath(ctx, -16, -16, 30, 16, 8);
  ctx.fill();
  roundedRectPath(ctx, 9, -24, 14, 12, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -24);
  ctx.lineTo(16, -31);
  ctx.lineTo(18, -23);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -24);
  ctx.lineTo(24, -31);
  ctx.lineTo(26, -23);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#b59f80";
  roundedRectPath(ctx, -14, -16, 6, 15, 3);
  ctx.fill();
  roundedRectPath(ctx, -2, -16, 6, 15, 3);
  ctx.fill();
  roundedRectPath(ctx, 8, -16, 6, 15, 3);
  ctx.fill();
  roundedRectPath(ctx, 18, -16, 6, 15, 3);
  ctx.fill();
  ctx.strokeStyle = "#b59f80";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.quadraticCurveTo(-28, -28, -10, -34);
  ctx.stroke();
  ctx.fillStyle = "#1f140e";
  ctx.beginPath();
  ctx.arc(20, -19, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

function exposeDebugState() {
  window.__planBGame = {
    getSnapshot() {
      return {
        mode: runtime.mode,
        saveStatus: runtime.saveStatus,
        tables: structuredClone(gameState.tables),
        customers: structuredClone(gameState.customers),
        wanderers: structuredClone(gameState.wanderers),
        stats: structuredClone(gameState.stats),
        coins: gameState.coins,
        score: gameState.score,
        totalServed: gameState.totalServed,
        totalMissed: gameState.totalMissed,
        umbrellaOwned: gameState.umbrellaOwned,
        serveLevel: gameState.serveLevel,
        weatherState: gameState.weatherState,
        weatherRemaining: gameState.weatherRemaining,
        windRemaining: gameState.windRemaining,
        incidentLabel: currentIncidentLabel(),
        drinkMenu: structuredClone(DRINK_TYPES),
        layout: structuredClone(TABLE_LAYOUT),
      };
    },
    debug: {
      startWind() {
        startWindEvent();
        updateHud();
      },
      spawnWanderer(kind) {
        if (kind === "dog" || kind === "cat") {
          spawnWanderer(kind);
          updateHud();
        }
      },
    },
  };
}

function createAudioEngine() {
  let audioContext = null;

  function ensureContext() {
    if (audioContext) {
      return audioContext;
    }

    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }

    audioContext = new Context();
    return audioContext;
  }

  function pulse({ frequency, duration, type = "square", gain = 0.02 }) {
    const context = ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.value = gain;
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    const now = context.currentTime;
    envelope.gain.setValueAtTime(gain, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  return {
    unlock() {
      ensureContext();
    },
    beep(kind) {
      if (kind === "tip") {
        pulse({ frequency: 780, duration: 0.12, gain: 0.03 });
        setTimeout(() => pulse({ frequency: 920, duration: 0.1, gain: 0.025 }), 80);
        return;
      }

      if (kind === "upgrade") {
        pulse({ frequency: 620, duration: 0.16, gain: 0.028 });
        setTimeout(() => pulse({ frequency: 830, duration: 0.12, gain: 0.022 }), 120);
        return;
      }

      if (kind === "rain") {
        pulse({ frequency: 240, duration: 0.22, type: "triangle", gain: 0.02 });
        return;
      }

      if (kind === "tap") {
        pulse({ frequency: 460, duration: 0.08, gain: 0.018 });
        return;
      }

      pulse({ frequency: 540, duration: 0.12, gain: 0.02 });
    },
  };
}

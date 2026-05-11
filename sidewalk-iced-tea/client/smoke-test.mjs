import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "playwright";

const SERVER_READY_PATTERN =
  /Sidewalk Iced Tea Plan B available at (http:\/\/[^\s]+)/;

let serverProcess;

try {
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const serverUrl = await waitForServer(serverProcess);
  const summary = await runSmoke(serverUrl);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

async function waitForServer(child) {
  return await new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      child.stdout.off("data", onStdout);
      child.stderr.off("data", onStderr);
      child.off("exit", onExit);
    };

    const resolveOnce = (serverUrl) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(serverUrl);
      }
    };

    const rejectOnce = (error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    };

    let stdoutBuffer = "";

    const onStdout = (chunk) => {
      stdoutBuffer += chunk.toString();
      const match = stdoutBuffer.match(SERVER_READY_PATTERN);
      if (match) {
        resolveOnce(match[1]);
      }
    };

    const onStderr = (chunk) => {
      process.stderr.write(chunk);
    };

    const onExit = (code) => {
      rejectOnce(
        new Error(`Static server exited before smoke test could start (code ${code}).`),
      );
    };

    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.on("exit", onExit);

    setTimeout(() => {
      rejectOnce(new Error("Timed out waiting for the static server."));
    }, 12000);
  });
}

async function runSmoke(serverUrl) {
  const missingAssetSummary = await verifyMissingAsset(serverUrl);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  try {
    await page.goto(serverUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("#title-overlay", { state: "visible" });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("#title-overlay", { state: "visible" });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    const documentLanguage = await page.evaluate(() => document.documentElement.lang);
    if (documentLanguage !== "vi") {
      throw new Error(`Expected default document language to be vi, got ${documentLanguage}.`);
    }

    const initial = await page.evaluate(() => window.__planBGame.getSnapshot());
    if (!Array.isArray(initial.drinkMenu) || initial.drinkMenu.length < 6) {
      throw new Error("Drink menu did not expose the expected variety.");
    }
    const cacheSummary = await verifyServiceWorkerCache(page, serverUrl);

    await page.click("#start-button");
    await page.waitForFunction(() => window.__planBGame.getSnapshot().mode === "playing");
    await page.waitForFunction(
      () => window.__planBGame.getSnapshot().customers.length > 0,
      null,
      { timeout: 12000 },
    );
    await page.waitForFunction(
      () => window.__planBGame.getSnapshot().tables.some((table) => table.status === "waiting"),
      null,
      { timeout: 12000 },
    );
    const waitingCustomer = await page.evaluate(() => {
      const snapshot = window.__planBGame.getSnapshot();
      return snapshot.customers.find((customer) => customer.phase === "waiting") || null;
    });
    if (!waitingCustomer?.drinkId) {
      throw new Error("Waiting customer is missing a drink order.");
    }
    if (!waitingCustomer?.orderText) {
      throw new Error("Waiting customer is missing Vietnamese order text.");
    }

    const waitingTable = await page.evaluate(() => {
      const snapshot = window.__planBGame.getSnapshot();
      const table = snapshot.tables.find((entry) => entry.status === "waiting");
      const layout = snapshot.layout.find((entry) => entry.id === table.id);
      return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 };
    });

    const canvasBox = await page.locator("#game-canvas").boundingBox();
    if (!canvasBox) {
      throw new Error("Canvas was not laid out.");
    }

    const clickX = canvasBox.x + (waitingTable.x / 960) * canvasBox.width;
    const clickY = canvasBox.y + (waitingTable.y / 540) * canvasBox.height;
    await page.mouse.click(clickX, clickY);

    await page.waitForFunction(
      () => window.__planBGame.getSnapshot().totalServed > 0,
      null,
      { timeout: 12000 },
    );

    await page.evaluate(() => {
      window.__planBGame.debug.startWind();
      window.__planBGame.debug.spawnWanderer("dog");
      window.__planBGame.debug.spawnWanderer("cat");
    });
    await page.waitForFunction(() => {
      const snapshot = window.__planBGame.getSnapshot();
      const kinds = snapshot.wanderers.map((wanderer) => wanderer.kind);
      return snapshot.windRemaining > 0 && kinds.includes("dog") && kinds.includes("cat");
    });

    const finalState = await page.evaluate(() => window.__planBGame.getSnapshot());
    await page.waitForTimeout(1400);
    const sessionBeforeReload = await readSessionSeconds(page);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("#title-overlay", { state: "visible" });
    await page.click("#start-button");
    await page.waitForFunction(() => window.__planBGame.getSnapshot().mode === "playing");
    await page.waitForTimeout(250);
    const sessionAfterReload = await readSessionSeconds(page);
    if (sessionAfterReload > 1) {
      throw new Error(`Session timer did not reset after reload (saw ${sessionAfterReload}s).`);
    }

    return {
      initialMode: initial.mode,
      finalMode: finalState.mode,
      customers: finalState.customers.length,
      totalServed: finalState.totalServed,
      coins: finalState.coins,
      score: finalState.score,
      language: documentLanguage,
      weather: finalState.weatherState,
      incidentLabel: finalState.incidentLabel,
      drinkMenuSize: finalState.drinkMenu.length,
      wanderers: finalState.wanderers.map((wanderer) => wanderer.kind).sort(),
      firstOrder: waitingCustomer.drinkId,
      firstOrderText: waitingCustomer.orderText,
      missingAssetStatus: missingAssetSummary.status,
      missingAssetContentType: missingAssetSummary.contentType,
      missingAssetCached: cacheSummary.cachedAfterFetch,
      sessionBeforeReload,
      sessionAfterReload,
    };
  } finally {
    await browser.close();
  }
}

async function verifyMissingAsset(serverUrl) {
  const missingAssetUrl = new URL(
    "./public/assets/placeholder/does-not-exist.svg",
    serverUrl,
  );
  const response = await fetch(missingAssetUrl);
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 404) {
    throw new Error(`Missing asset should return 404, got ${response.status}.`);
  }

  if (!contentType.includes("text/plain")) {
    throw new Error(`Missing asset should return text/plain, got ${contentType || "none"}.`);
  }

  return {
    status: response.status,
    contentType,
  };
}

async function verifyServiceWorkerCache(page, serverUrl) {
  const missingAssetUrl = new URL(
    "./public/assets/placeholder/does-not-exist.svg",
    serverUrl,
  ).toString();
  const summary = await page.evaluate(async (assetUrl) => {
    const before = await caches.match(assetUrl);
    const response = await fetch(assetUrl);
    const after = await caches.match(assetUrl);
    return {
      status: response.status,
      wasCachedBefore: Boolean(before),
      cachedAfterFetch: Boolean(after),
    };
  }, missingAssetUrl);

  if (summary.status !== 404) {
    throw new Error(`Service worker should surface 404 for a missing asset, got ${summary.status}.`);
  }

  if (summary.cachedAfterFetch) {
    throw new Error("Service worker cached a missing asset response.");
  }

  return summary;
}

async function readSessionSeconds(page) {
  const label = await page.locator("#session-value").textContent();
  const [minutes, seconds] = (label || "0:00").trim().split(":");
  return (Number(minutes) * 60) + Number(seconds);
}

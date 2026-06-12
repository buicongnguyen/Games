/* Sky Drill 2 — main.js
 * Scene orchestration: campaign flow (title → briefings → levels →
 * epilogue), pause, persistence, input routing, score, juice, and the
 * debug/self-test API (window.SkyDrill.debug).
 */
(function () {
  "use strict";

  const SD = window.SD;
  const U = SD.U;
  const WORLD = SD.WORLD;

  const CHAPTERS = ["bombing", "canal", "defense"];

  function loadSave() {
    try {
      const raw = localStorage.getItem(SD.SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          best: Number(parsed.best) || 0,
          reached: {
            c: U.clamp(Number(parsed.reached && parsed.reached.c) || 0, 0, CHAPTERS.length - 1),
            l: Math.max(0, Number(parsed.reached && parsed.reached.l) || 0),
          },
          muted: !!parsed.muted,
        };
      }
    } catch (err) { /* corrupted save — start fresh */ }
    return { best: 0, reached: { c: 0, l: 0 }, muted: false };
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
      this.flow = "boot"; // boot | title | briefing | playing | failed | epilogue
      this.paused = false;
      this.score = 0;
      this.retries = 0;
      this.chapterIdx = 0;
      this.levelIdx = 0;
      this.advanceAt = null;
      this.failAt = null;
      this.failInfo = null;
      this.save = loadSave();
    }

    /* ------------------------------ assets ----------------------------- */

    preload() {
      this.load.image("bg-bombing", "assets/chapter1-bombing-bg.png");
      this.load.image("bg-canal", "assets/chapter2-canal-bg.png");
      this.load.image("bank-left", "assets/chapter2-left-bank-scroll.png");
      this.load.image("bank-right", "assets/chapter2-right-bank-scroll.png");
      this.load.image("ship-player", "assets/chapter2-player-ship.png");
      this.load.image("bg-defense", "assets/chapter3-heli-bg.png");
      this.load.on("loaderror", (file) => console.warn("Sky Drill 2: asset failed to load:", file.key));
    }

    create() {
      this.backgrounds = {
        bombing: this.add.image(0, 0, "bg-bombing"),
        canal: this.add.image(0, 0, "bg-canal"),
        defense: this.add.image(0, 0, "bg-defense"),
      };
      Object.values(this.backgrounds).forEach((image) => {
        image.setOrigin(0, 0);
        image.setDisplaySize(WORLD.width, WORLD.height);
        image.setDepth(-20);
        image.setVisible(false);
      });
      this.bankScrolls = {
        left: this.add.tileSprite(0, 0, 224, WORLD.height, "bank-left"),
        right: this.add.tileSprite(WORLD.width - 224, 0, 224, WORLD.height, "bank-right"),
      };
      Object.values(this.bankScrolls).forEach((image) => {
        image.setOrigin(0, 0);
        image.setDepth(-19);
        image.setAlpha(0.68);
        image.setVisible(false);
      });
      this.shipSprite = this.add.image(-200, -200, "ship-player");
      this.shipSprite.setOrigin(0.5, 0.5);
      this.shipSprite.setDisplaySize(102, 153);
      this.shipSprite.setVisible(false);

      this.g = {
        bg: this.add.graphics().setDepth(-10),
        map: this.add.graphics().setDepth(0),
        dyn: this.add.graphics().setDepth(10),
        fx: this.add.graphics().setDepth(20),
        traj: this.add.graphics().setDepth(30),
      };

      this.juice = new SD.Juice(this);
      this.floatText = new SD.FloatTextPool(this, 14);

      this.modes = {
        bombing: new SD.Chapter1(this),
        canal: new SD.Chapter2(this),
        defense: new SD.Chapter3(this),
      };
      this.mode = null;

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D");
      this.wireInput();

      SD.UI.init({
        onDrop: () => this.mode && this.mode.id === "bombing" && this.flow === "playing" && this.mode.queueDrop(),
        onPause: () => this.togglePause(),
        onMute: () => this.toggleMute(),
        onRedo: () => this.restartLevel(),
        onSkip: () => this.skipLevel(),
        onQuit: () => this.gotoTitle(),
      });
      SD.Audio.setMuted(this.save.muted);
      SD.UI.setMuteIcon(this.save.muted);

      this.gotoTitle();
    }

    /* ------------------------------ input ------------------------------ */

    wireInput() {
      const kb = this.input.keyboard;
      kb.on("keydown-SPACE", (event) => {
        event.preventDefault();
        if (this.flow === "playing" && this.mode && this.mode.primaryAction) this.mode.primaryAction();
      });
      kb.on("keydown-R", () => {
        if (this.flow === "playing") this.restartLevel();
      });
      kb.on("keydown-N", () => {
        if (this.flow === "playing") this.skipLevel();
      });
      kb.on("keydown-M", () => this.toggleMute());
      kb.on("keydown-ESC", () => this.togglePause());
      kb.on("keydown-ONE", () => {
        if (this.flow === "playing" && this.mode && this.mode.id === "defense") this.mode.setWeapon("gun");
      });
      kb.on("keydown-TWO", () => {
        if (this.flow === "playing" && this.mode && this.mode.id === "defense") this.mode.setWeapon("missile");
      });
      this.input.on("pointerdown", (pointer) => this.routePointer(pointer));
      this.input.on("pointermove", (pointer) => {
        if (pointer.isDown && this.mode && this.mode.id === "canal") this.routePointer(pointer);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.flow === "playing" && !this.paused) this.togglePause();
      });
    }

    routePointer(pointer) {
      if (this.flow !== "playing" || this.paused || !this.mode || !this.mode.onPointer) return;
      this.mode.onPointer({ x: pointer.worldX, y: pointer.worldY });
    }

    moveInput() {
      const left = this.cursors.left.isDown || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      const down = this.cursors.down.isDown || this.keys.S.isDown;
      return {
        x: U.clamp((right ? 1 : 0) - (left ? 1 : 0) + SD.UI.pads.move.x, -1, 1),
        y: U.clamp((down ? 1 : 0) - (up ? 1 : 0) + SD.UI.pads.move.y, -1, 1),
      };
    }

    firePad() {
      return SD.UI.pads.fire;
    }

    /* --------------------------- scene helpers ------------------------- */

    setChapterVisual(id) {
      Object.entries(this.backgrounds).forEach(([key, image]) => image.setVisible(key === id));
      Object.values(this.bankScrolls).forEach((image) => image.setVisible(id === "canal"));
      this.shipSprite.setVisible(false);
    }

    setBankScroll(scroll) {
      Object.values(this.bankScrolls).forEach((image) => {
        image.tilePositionY = -scroll;
      });
    }

    setShipVisible(visible) {
      this.shipSprite.setVisible(visible && this.mode && this.mode.id === "canal");
    }

    setShipPosition(x, y, tilt) {
      this.shipSprite.setPosition(x, y);
      this.shipSprite.setRotation(tilt || 0);
    }

    addScore(points, x, y, cssColor) {
      this.score += points;
      if (x != null && y != null) this.floatText.spawn(x, y, `+${points}`, cssColor);
    }

    /* ---------------------------- campaign flow ------------------------ */

    persist() {
      try {
        localStorage.setItem(SD.SAVE_KEY, JSON.stringify(this.save));
      } catch (err) { /* private mode — fine */ }
    }

    gotoTitle() {
      this.flow = "title";
      this.paused = false;
      this.advanceAt = null;
      this.failAt = null;
      if (this.mode) {
        this.mode.exit();
        this.mode = null;
      }
      this.clearLayers();
      this.setChapterVisual("bombing");
      SD.UI.setMode("none");
      SD.UI.hint("");
      SD.UI.setChapterChip("VANTAR ARCHIPELAGO", "#ffcc4d");
      SD.UI.setStats([]);
      SD.UI.overlay.title(
        this.save,
        () => this.startCampaign(0, 0, true),
        () => this.startCampaign(this.save.reached.c, this.save.reached.l, true),
        () => SD.UI.overlay.help(() => this.gotoTitle())
      );
    }

    startCampaign(chapterIdx, levelIdx, fresh) {
      if (fresh) {
        this.score = 0;
        this.retries = 0;
      }
      this.showBriefing(chapterIdx, levelIdx);
    }

    showBriefing(chapterIdx, levelIdx) {
      this.flow = "briefing";
      const chapter = SD.STORY.chapters[chapterIdx];
      SD.UI.overlay.briefing(chapter, () => {
        SD.UI.overlay.hide();
        this.startLevel(chapterIdx, levelIdx);
      });
    }

    levelCount(chapterIdx) {
      return SD.LEVELS[CHAPTERS[chapterIdx] === "bombing" ? "bombing" : CHAPTERS[chapterIdx]].length;
    }

    startLevel(chapterIdx, levelIdx) {
      SD.UI.overlay.hide();
      this.chapterIdx = chapterIdx;
      this.levelIdx = levelIdx;
      this.advanceAt = null;
      this.failAt = null;
      if (this.mode) this.mode.exit();
      this.clearLayers();
      const id = CHAPTERS[chapterIdx];
      this.mode = this.modes[id];
      this.setChapterVisual(id);
      const chapter = SD.STORY.chapters[chapterIdx];
      SD.UI.setChapterChip(`${chapter.num} · ${chapter.name}`, chapter.accent);
      this.mode.enter(levelIdx);
      this.flow = "playing";
      // progression save (furthest point reached)
      const r = this.save.reached;
      if (chapterIdx > r.c || (chapterIdx === r.c && levelIdx > r.l)) {
        r.c = chapterIdx;
        r.l = levelIdx;
        this.persist();
      }
    }

    restartLevel() {
      if (this.flow !== "playing" && this.flow !== "failed") return;
      this.retries += 1;
      this.startLevel(this.chapterIdx, this.levelIdx);
      SD.UI.toast("Level restarted");
    }

    skipLevel() {
      if (this.flow !== "playing") return;
      this.advanceNow();
    }

    onLevelClear(delaySeconds) {
      this.advanceAt = (this.clock || 0) + (delaySeconds || 2);
    }

    onLevelFail(reason, chapterId) {
      if (this.flow !== "playing") return;
      this.flow = "failing";
      this.failInfo = { reason, chapterId };
      this.failAt = (this.clock || 0) + 1.1;
    }

    advanceNow() {
      const levels = this.levelCount(this.chapterIdx);
      if (this.levelIdx + 1 < levels) {
        this.startLevel(this.chapterIdx, this.levelIdx + 1);
      } else if (this.chapterIdx + 1 < CHAPTERS.length) {
        this.showBriefing(this.chapterIdx + 1, 0);
      } else {
        this.showEpilogue();
      }
    }

    showEpilogue() {
      this.flow = "epilogue";
      if (this.mode) {
        this.mode.exit();
        this.mode = null;
      }
      this.clearLayers();
      this.save.best = Math.max(this.save.best, this.score);
      this.save.reached = { c: 0, l: 0 }; // campaign finished — next continue starts fresh
      this.persist();
      SD.UI.setMode("none");
      SD.UI.hint("");
      SD.Audio.play("fanfare");
      SD.UI.overlay.epilogue(
        { score: this.score, best: this.save.best, retries: this.retries },
        () => this.startCampaign(0, 0, true),
        () => this.gotoTitle()
      );
    }

    showFail() {
      this.flow = "failed";
      const story = SD.STORY.fail[this.failInfo.chapterId] || "";
      this.save.best = Math.max(this.save.best, this.score);
      this.persist();
      SD.UI.overlay.fail(
        this.failInfo.reason,
        story,
        () => {
          SD.UI.overlay.hide();
          this.restartLevel();
        },
        () => this.gotoTitle()
      );
    }

    /* ------------------------------ pause ------------------------------ */

    togglePause(force) {
      if (this.flow !== "playing" && !this.paused) return;
      const next = typeof force === "boolean" ? force : !this.paused;
      if (next === this.paused) return;
      this.paused = next;
      SD.UI.setPauseIcon(this.paused);
      if (this.paused) {
        SD.UI.overlay.pause(
          () => this.togglePause(false),
          () => {
            this.togglePause(false);
            this.restartLevel();
          },
          () => SD.UI.overlay.help(() => {
            SD.UI.overlay.pause(
              () => this.togglePause(false),
              () => { this.togglePause(false); this.restartLevel(); },
              () => {},
              () => { this.togglePause(false); this.gotoTitle(); }
            );
          }),
          () => {
            this.togglePause(false);
            this.gotoTitle();
          }
        );
      } else {
        SD.UI.overlay.hide();
      }
    }

    toggleMute() {
      const muted = !SD.Audio.muted;
      SD.Audio.setMuted(muted);
      this.save.muted = muted;
      this.persist();
      SD.UI.setMuteIcon(muted);
      SD.UI.toast(muted ? "Sound off" : "Sound on", 1);
    }

    clearLayers() {
      Object.values(this.g).forEach((layer) => layer.clear());
      this.floatText.clear();
      this.setShipVisible(false);
    }

    /* ------------------------------ update ----------------------------- */

    update(time, delta) {
      const rawDt = Math.min(delta / 1000, 1 / 30);
      this.stepGame(rawDt);
    }

    stepGame(rawDt, opts) {
      const dt = this.juice.update(rawDt);
      const playing = (this.flow === "playing" || this.flow === "failing") && !this.paused;
      this.clock = (this.clock || 0) + (playing ? dt : 0);

      Object.values(this.g).forEach((layer) => layer.clear());

      if (this.mode && playing) {
        this.mode.update(dt);
        // flow timers
        if (this.advanceAt != null && this.clock >= this.advanceAt) {
          this.advanceAt = null;
          this.advanceNow();
        }
        if (this.failAt != null && this.clock >= this.failAt) {
          this.failAt = null;
          this.showFail();
        }
      }
      if (this.mode && (!opts || !opts.skipDraw)) {
        this.mode.draw();
        SD.UI.setStats(this.mode.hudStats());
      }
      this.floatText.update(dt);
    }
  }

  /* ------------------------------- boot -------------------------------- */

  function boot() {
    if (!window.Phaser) {
      const root = document.getElementById("game-root");
      root.innerHTML =
        '<div style="display:grid;place-items:center;height:100%;color:#f4f7f9;font-family:sans-serif;text-align:center;padding:24px">' +
        "<p>Phaser failed to load (vendor/phaser.min.js missing or blocked).<br>Re-download it or serve the folder with a local server.</p></div>";
      return;
    }
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game-root",
      width: WORLD.width,
      height: WORLD.height,
      backgroundColor: "#152331",
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { antialias: true, pixelArt: false },
    });

    window.SkyDrill = {
      game,
      get scene() {
        return game.scene.getScene("GameScene");
      },
      /* Self-test/debug API:
       *   SkyDrill.debug.goto(1, 0)      — jump to chapter 2, level 1
       *   SkyDrill.debug.tick(30)        — simulate 30 s of gameplay
       *   SkyDrill.debug.state()         — flow/score/mode snapshot
       */
      debug: {
        goto(chapterIdx, levelIdx) {
          const scene = window.SkyDrill.scene;
          SD.UI.overlay.hide();
          scene.startLevel(U.clamp(chapterIdx, 0, CHAPTERS.length - 1), Math.max(0, levelIdx || 0));
        },
        tick(seconds, step) {
          const scene = window.SkyDrill.scene;
          const h = step || 1 / 60;
          let t = 0;
          while (t < seconds) {
            scene.stepGame(h, { skipDraw: true });
            t += h;
          }
          return window.SkyDrill.debug.state();
        },
        state() {
          const scene = window.SkyDrill.scene;
          return {
            flow: scene.flow,
            paused: scene.paused,
            chapter: scene.chapterIdx,
            level: scene.levelIdx,
            score: scene.score,
            mode: scene.mode ? scene.mode.id : null,
          };
        },
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

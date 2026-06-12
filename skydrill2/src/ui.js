/* Sky Drill 2 — ui.js
 * All DOM: HUD stat chips, drop controls, bomb setup panel, touch pads,
 * toasts, level banners and full-screen overlays (title/briefing/fail/
 * pause/epilogue). Gameplay code talks to this module only through the
 * exported API — it never touches the DOM directly.
 */
(function () {
  "use strict";

  const SD = window.SD;
  const U = SD.U;
  const BOMB = SD.BOMB;

  const $ = (id) => document.getElementById(id);

  const els = {};
  let handlers = {};
  let toastTimer = 0;
  let bannerTimer = 0;
  let statNodes = [];

  /* Bomb configuration state (captured snapshots go to gameplay). */
  let bombScope = "all";
  let globalConfig = { ...BOMB.DEFAULT };
  let nextConfig = null;

  const pads = {
    move: { x: 0, y: 0, active: false },
    fire: { x: 0, y: -1, active: false },
  };

  function cacheEls() {
    Object.assign(els, {
      stage: document.querySelector(".stage"),
      stats: $("hud-stats"),
      chapterChip: $("chapter-chip"),
      controls: $("drop-controls"),
      angle: $("angle-input"),
      angleOut: $("angle-output"),
      speed: $("speed-input"),
      speedOut: $("speed-output"),
      delay: $("delay-input"),
      delayOut: $("delay-output"),
      drop: $("drop-button"),
      bombConfig: $("bomb-config-button"),
      bombPanel: $("bomb-panel"),
      bombClose: $("bomb-close-button"),
      bombSummary: $("bomb-summary"),
      fuse: $("fuse-input"),
      fuseOut: $("fuse-output"),
      blast: $("blast-input"),
      blastOut: $("blast-output"),
      drillWalls: $("drill-walls-input"),
      drillWallsOut: $("drill-walls-output"),
      bounceCount: $("bounce-count-input"),
      bounceCountOut: $("bounce-count-output"),
      pauseBtn: $("pause-button"),
      muteBtn: $("mute-button"),
      menuBtn: $("menu-button"),
      menuPanel: $("menu-panel"),
      redo: $("redo-button"),
      skip: $("skip-button"),
      quitToTitle: $("quit-button"),
      touch: $("touch-controls"),
      movePad: $("move-pad"),
      movePadKnob: $("move-pad-knob"),
      firePad: $("fire-pad"),
      firePadKnob: $("fire-pad-knob"),
      toast: $("message"),
      banner: $("level-banner"),
      bannerTitle: $("level-banner-title"),
      bannerSub: $("level-banner-sub"),
      overlay: $("overlay"),
      hint: $("control-hint"),
    });
    els.scopeButtons = Array.from(document.querySelectorAll("[data-scope]"));
    els.typeButtons = Array.from(document.querySelectorAll("[data-bomb-type]"));
    els.pathButtons = Array.from(document.querySelectorAll("[data-bomb-path]"));
  }

  /* ----------------------------- stats ------------------------------ */

  function setStats(list) {
    while (statNodes.length < list.length) {
      const span = document.createElement("span");
      span.className = "stat";
      const label = document.createElement("em");
      const value = document.createElement("strong");
      span.append(label, value);
      els.stats.appendChild(span);
      statNodes.push({ span, label, value });
    }
    for (let i = 0; i < statNodes.length; i += 1) {
      const node = statNodes[i];
      const item = list[i];
      if (!item) {
        node.span.hidden = true;
        continue;
      }
      node.span.hidden = false;
      if (node.label.textContent !== item.label) node.label.textContent = item.label;
      if (node.value.textContent !== item.value) node.value.textContent = item.value;
      const tone = item.tone || "";
      if (node.span.dataset.tone !== tone) node.span.dataset.tone = tone;
    }
  }

  function setChapterChip(text, accent) {
    els.chapterChip.textContent = text;
    els.chapterChip.style.borderColor = accent || "";
  }

  /* --------------------------- messaging ---------------------------- */

  function toast(text, seconds) {
    els.toast.textContent = text;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), (seconds || 2.2) * 1000);
  }

  function banner(title, sub, seconds) {
    els.bannerTitle.textContent = title;
    els.bannerSub.textContent = sub || "";
    els.banner.classList.remove("is-live");
    void els.banner.offsetWidth; // restart the CSS animation
    els.banner.classList.add("is-live");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => els.banner.classList.remove("is-live"), (seconds || 2.4) * 1000);
  }

  function hint(text) {
    els.hint.textContent = text || "";
    els.hint.hidden = !text;
  }

  /* --------------------------- overlays ----------------------------- */

  function overlayOpen() {
    return !els.overlay.hidden;
  }

  function hideOverlay() {
    els.overlay.hidden = true;
    els.overlay.innerHTML = "";
  }

  function showOverlay(html, wire) {
    els.overlay.innerHTML = html;
    els.overlay.hidden = false;
    if (wire) wire(els.overlay);
    const focus = els.overlay.querySelector("[data-autofocus]");
    if (focus) focus.focus();
  }

  function esc(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  const overlay = {
    get open() { return overlayOpen(); },
    hide: hideOverlay,

    title(save, onStart, onContinue, onHelp) {
      const story = SD.STORY.title;
      const hasSave = save && (save.reached.c > 0 || save.reached.l > 0);
      showOverlay(
        `<div class="overlay-card title-card">
           <div class="title-mark"></div>
           <h1>${esc(story.game)}</h1>
           <p class="title-tag">${esc(story.tag)}</p>
           <p class="overlay-body">${esc(story.blurb)}</p>
           <div class="overlay-actions">
             <button class="primary big" data-act="start" data-autofocus>New Campaign</button>
             ${hasSave ? `<button class="ghost big" data-act="continue">Continue</button>` : ""}
             <button class="ghost big" data-act="help">How to Play</button>
           </div>
           <p class="overlay-foot">Best score ${save ? save.best : 0} · v${SD.VERSION}</p>
         </div>`,
        (root) => {
          root.querySelector('[data-act="start"]').addEventListener("click", onStart);
          const cont = root.querySelector('[data-act="continue"]');
          if (cont) cont.addEventListener("click", onContinue);
          root.querySelector('[data-act="help"]').addEventListener("click", onHelp);
        }
      );
    },

    briefing(chapter, onLaunch) {
      showOverlay(
        `<div class="overlay-card brief-card" style="--accent:${chapter.accent}">
           <p class="brief-kicker">${esc(chapter.num)}</p>
           <h2>${esc(chapter.name)}</h2>
           <p class="overlay-body">${esc(chapter.brief)}</p>
           <p class="brief-objective"><strong>Objective</strong> ${esc(chapter.objective)}</p>
           <p class="brief-controls">${esc(chapter.controls)}</p>
           <div class="overlay-actions">
             <button class="primary big" data-act="launch" data-autofocus>Launch</button>
           </div>
         </div>`,
        (root) => root.querySelector('[data-act="launch"]').addEventListener("click", onLaunch)
      );
    },

    fail(reason, storyLine, onRetry, onTitle) {
      showOverlay(
        `<div class="overlay-card fail-card">
           <p class="brief-kicker">MISSION FAILED</p>
           <h2>${esc(reason)}</h2>
           <p class="overlay-body">${esc(storyLine || "")}</p>
           <div class="overlay-actions">
             <button class="primary big" data-act="retry" data-autofocus>Retry</button>
             <button class="ghost big" data-act="title">Title</button>
           </div>
         </div>`,
        (root) => {
          root.querySelector('[data-act="retry"]').addEventListener("click", onRetry);
          root.querySelector('[data-act="title"]').addEventListener("click", onTitle);
        }
      );
    },

    pause(onResume, onRestart, onHelp, onTitle) {
      showOverlay(
        `<div class="overlay-card pause-card">
           <h2>PAUSED</h2>
           <div class="overlay-actions">
             <button class="primary big" data-act="resume" data-autofocus>Resume</button>
             <button class="ghost big" data-act="restart">Restart Level</button>
             <button class="ghost big" data-act="help">How to Play</button>
             <button class="ghost big" data-act="title">Title</button>
           </div>
         </div>`,
        (root) => {
          root.querySelector('[data-act="resume"]').addEventListener("click", onResume);
          root.querySelector('[data-act="restart"]').addEventListener("click", onRestart);
          root.querySelector('[data-act="help"]').addEventListener("click", onHelp);
          root.querySelector('[data-act="title"]').addEventListener("click", onTitle);
        }
      );
    },

    help(onBack) {
      const rows = SD.STORY.chapters
        .map(
          (ch) =>
            `<div class="help-row" style="--accent:${ch.accent}">
               <strong>${esc(ch.num)} · ${esc(ch.name)}</strong>
               <p>${esc(ch.controls)}</p>
             </div>`
        )
        .join("");
      showOverlay(
        `<div class="overlay-card help-card">
           <h2>HOW TO PLAY</h2>
           ${rows}
           <div class="help-row"><strong>Everywhere</strong><p>ESC pauses · R restarts the level · M mutes · trajectory preview shows the exact flight path, detonation point and blast radius.</p></div>
           <div class="overlay-actions">
             <button class="primary big" data-act="back" data-autofocus>Back</button>
           </div>
         </div>`,
        (root) => root.querySelector('[data-act="back"]').addEventListener("click", onBack)
      );
    },

    epilogue(stats, onReplay, onTitle) {
      const story = SD.STORY.epilogue;
      showOverlay(
        `<div class="overlay-card epilogue-card">
           <p class="brief-kicker">${esc(story.sign)}</p>
           <h2>${esc(story.title)}</h2>
           <p class="overlay-body">${esc(story.body)}</p>
           <div class="epilogue-stats">
             <span><em>Final score</em><strong>${stats.score}</strong></span>
             <span><em>Best score</em><strong>${stats.best}</strong></span>
             <span><em>Retries</em><strong>${stats.retries}</strong></span>
           </div>
           <div class="overlay-actions">
             <button class="primary big" data-act="replay" data-autofocus>Play Again</button>
             <button class="ghost big" data-act="title">Title</button>
           </div>
         </div>`,
        (root) => {
          root.querySelector('[data-act="replay"]').addEventListener("click", onReplay);
          root.querySelector('[data-act="title"]').addEventListener("click", onTitle);
        }
      );
    },
  };

  /* ------------------------- bomb panel ------------------------------ */

  function editableConfig() {
    if (bombScope === "next") {
      if (!nextConfig) nextConfig = { ...globalConfig };
      return nextConfig;
    }
    return globalConfig;
  }

  function takeShotConfig() {
    if (bombScope === "next" && nextConfig) {
      const config = { ...nextConfig };
      nextConfig = null;
      bombScope = "all";
      syncBombUi();
      return config;
    }
    return { ...globalConfig };
  }

  function syncBombUi() {
    const config = editableConfig();
    config.type = BOMB.TYPES[config.type] ? config.type : "drill";
    config.path = BOMB.PATHS[config.path] ? config.path : "arc";
    els.fuse.value = `${config.fuse}`;
    els.blast.value = `${config.blastRadius}`;
    els.drillWalls.value = `${config.drillWalls}`;
    els.bounceCount.value = `${config.bounceCount}`;
    els.fuseOut.textContent = `${config.fuse.toFixed(2)} s`;
    els.blastOut.textContent = `${config.blastRadius}`;
    els.drillWallsOut.textContent = `${config.drillWalls}`;
    els.bounceCountOut.textContent = `${config.bounceCount}`;
    els.typeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.bombType === config.type));
    els.pathButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.bombPath === config.path));
    els.scopeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.scope === bombScope));
    const scope = bombScope === "next" ? "Next pod" : "All pods";
    const detail =
      config.type === "bounce"
        ? `${config.bounceCount} bounce${config.bounceCount === 1 ? "" : "s"}`
        : config.type === "drill"
          ? `${config.drillWalls} floor${config.drillWalls === 1 ? "" : "s"} deep`
          : `${config.fuse.toFixed(2)} s fuse`;
    els.bombSummary.textContent =
      `${scope}: ${BOMB.TYPES[config.type]} · ${BOMB.PATHS[config.path]} · ${detail} · blast ${config.blastRadius}` +
      ` — ${BOMB.TYPE_HINT[config.type]}`;
    if (handlers.onConfigChange) handlers.onConfigChange();
  }

  function wireBombPanel() {
    els.bombConfig.addEventListener("click", () => {
      els.bombPanel.hidden = !els.bombPanel.hidden;
      SD.Audio.play("uiClick");
    });
    els.bombClose.addEventListener("click", () => {
      els.bombPanel.hidden = true;
      SD.Audio.play("uiClick");
    });
    els.scopeButtons.forEach((button) =>
      button.addEventListener("click", () => {
        bombScope = button.dataset.scope === "next" ? "next" : "all";
        if (bombScope === "all") nextConfig = null;
        SD.Audio.play("uiClick");
        syncBombUi();
      })
    );
    els.typeButtons.forEach((button) =>
      button.addEventListener("click", () => {
        editableConfig().type = button.dataset.bombType;
        SD.Audio.play("uiClick");
        syncBombUi();
      })
    );
    els.pathButtons.forEach((button) =>
      button.addEventListener("click", () => {
        editableConfig().path = button.dataset.bombPath;
        SD.Audio.play("uiClick");
        syncBombUi();
      })
    );
    [els.fuse, els.blast, els.drillWalls, els.bounceCount].forEach((input) =>
      ["input", "change"].forEach((eventName) =>
        input.addEventListener(eventName, () => {
          const config = editableConfig();
          config.fuse = Number(els.fuse.value);
          config.blastRadius = Number(els.blast.value);
          config.drillWalls = Number(els.drillWalls.value);
          config.bounceCount = Number(els.bounceCount.value);
          syncBombUi();
        })
      )
    );
  }

  /* ------------------------- drop controls --------------------------- */

  function readDropParams() {
    return {
      angleDeg: Number(els.angle.value),
      speed: Number(els.speed.value),
      delay: Number(els.delay.value),
    };
  }

  function wireDropControls() {
    const updateReadouts = () => {
      els.angleOut.textContent = `${Number(els.angle.value)}°`;
      els.speedOut.textContent = `${Number(els.speed.value)}`;
      els.delayOut.textContent = `${Number(els.delay.value).toFixed(2)} s`;
      if (handlers.onConfigChange) handlers.onConfigChange();
    };
    ["input", "change"].forEach((eventName) => {
      els.angle.addEventListener(eventName, updateReadouts);
      els.speed.addEventListener(eventName, updateReadouts);
      els.delay.addEventListener(eventName, updateReadouts);
    });
    els.drop.addEventListener("click", () => handlers.onDrop && handlers.onDrop());
    updateReadouts();
  }

  /* --------------------------- touch pads ---------------------------- */

  function bindPad(pad, knob, state, keepDirection) {
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
      if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId);
      state.active = false;
      if (!keepDirection) {
        state.x = 0;
        state.y = 0;
        knob.style.transform = "translate(-50%, -50%)";
      }
    };
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
  }

  /* ------------------------------ mode ------------------------------- */

  function setMode(mode) {
    const bombing = mode === "bombing";
    els.controls.hidden = !bombing;
    if (!bombing) els.bombPanel.hidden = true;
    els.stage.classList.toggle("is-full-game", !bombing);
    const padsActive = mode === "canal" || mode === "defense";
    els.touch.hidden = !padsActive;
    if (!padsActive) {
      pads.move.x = 0;
      pads.move.y = 0;
      pads.move.active = false;
      pads.fire.active = false;
    }
  }

  /* ------------------------------ init ------------------------------- */

  function init(externalHandlers) {
    handlers = externalHandlers || {};
    cacheEls();
    wireDropControls();
    wireBombPanel();
    bindPad(els.movePad, els.movePadKnob, pads.move, false);
    bindPad(els.firePad, els.firePadKnob, pads.fire, true);

    els.pauseBtn.addEventListener("click", () => handlers.onPause && handlers.onPause());
    els.muteBtn.addEventListener("click", () => handlers.onMute && handlers.onMute());
    els.menuBtn.addEventListener("click", () => {
      els.menuPanel.hidden = !els.menuPanel.hidden;
      els.menuBtn.setAttribute("aria-expanded", String(!els.menuPanel.hidden));
    });
    els.redo.addEventListener("click", () => {
      els.menuPanel.hidden = true;
      if (handlers.onRedo) handlers.onRedo();
    });
    els.skip.addEventListener("click", () => {
      els.menuPanel.hidden = true;
      if (handlers.onSkip) handlers.onSkip();
    });
    els.quitToTitle.addEventListener("click", () => {
      els.menuPanel.hidden = true;
      if (handlers.onQuit) handlers.onQuit();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!els.menuPanel.hidden && !els.menuPanel.contains(event.target) && event.target !== els.menuBtn && !els.menuBtn.contains(event.target)) {
        els.menuPanel.hidden = true;
      }
      SD.Audio.unlock();
    });
    document.addEventListener("keydown", () => SD.Audio.unlock(), { once: true });
    syncBombUi();
  }

  function setMuteIcon(muted) {
    els.muteBtn.classList.toggle("is-muted", muted);
    els.muteBtn.title = muted ? "Unmute (M)" : "Mute (M)";
  }

  function setPauseIcon(paused) {
    els.pauseBtn.classList.toggle("is-paused", paused);
    els.pauseBtn.title = paused ? "Resume (ESC)" : "Pause (ESC)";
  }

  function setDropEnabled(enabled) {
    els.drop.disabled = !enabled;
  }

  SD.UI = {
    init,
    pads,
    setMode,
    setStats,
    setChapterChip,
    toast,
    banner,
    hint,
    overlay,
    readDropParams,
    takeShotConfig,
    editableConfig,
    setDropEnabled,
    setMuteIcon,
    setPauseIcon,
    get bombPanelOpen() { return !els.bombPanel.hidden; },
  };
})();

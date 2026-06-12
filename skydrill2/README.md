# Sky Drill 2

**Play online: <https://buicongnguyen.github.io/SkyDrill2/>**

A rebuilt, physics-correct version of the Sky Drill arcade campaign. Three chapters, one story: a rogue machine network — **the Hive** — has seized the Vantar Archipelago, and you fly the counter-strike end to end.

The original prototype lives at [buicongnguyen.github.io/Games](https://buicongnguyen.github.io/Games/).

1. **Operation Sky Drill** — drop guided drill pods from a plane to crack fortified towers and destroy crawler nests (6 levels).
2. **The Canal Run** — carry the virus core upriver through bank guns, seeker drones and proximity mines (3 legs).
3. **Last Uplink** — hold the LZ in a gunship while the virus uploads into the Hive's mountain core (3 waves).

## Run it

Open `index.html` in a browser — everything (including Phaser) is local, no network needed. Or serve the folder with any static server.

## What's new vs. the original

### Correct physics
- **One integrator everywhere**: semi-implicit (symplectic) Euler at a fixed 120 Hz substep — the industry-standard game integrator. Velocity updates before position; no per-path gravity fudge factors.
- **Real ballistics**: pods inherit the carrier plane's velocity exactly and get launched at the slider speed/angle. Quadratic air drag plus a wind-coupling term; wind varies per level and is shown in the HUD.
- **Honest trajectory preview**: the dashed line runs the *same* simulation code against cloned building health — the pod follows it exactly, including drilling, bounces, the detonation point and the blast radius ghost.
- **Restitution done right**: bounce pods keep a constant e = 0.52 of vertical speed per bounce (each bounce is *smaller*, not bigger as before) plus horizontal friction. Timer pods do one soft bounce, then roll with friction.
- **Drilling as resistance**: masonry decelerates the pod (foundations ~2× walls); a pod that slows below jam speed detonates in place. Launch speed therefore matters physically, not just numerically.
- **Structural collapse**: blocks that lose support fall, take impact damage past a safe landing speed, and crush crawlers under them.
- **No tunneling**: pod→crawler and bullet→hull checks are swept-segment tests, not per-frame point checks.
- **Colliders match visuals**: the canal ship is a hull *ellipse* (the old version used two magic radii that ignored the sprite), and each helicopter shield oval is its own collider with its own HP — the old version tested one big invisible ellipse.
- **No fake hitscan**: chapter 3 guns/rockets are real projectiles with travel time; the old version applied damage instantly while animating a fake tracer.
- **Fair damage layering**: shields absorb first, then hull, and only a true core hit is instantly fatal. The old version could insta-kill you through full shields.

### Better logic
- Single source of truth for score (the old code tracked it in two places that drifted apart).
- Pods capture their full configuration when armed — the old version read the live UI sliders mid-flight, so moving a slider changed a bomb already falling.
- Screen shake actually works (the old `cameraKick` was computed and never applied), plus hit-stop on big impacts, floating score text and synthesized sound effects (WebAudio — no assets).
- Pause (ESC / auto on tab switch), mute (M, persisted), restart (R), level skip in the menu, progress + best score saved to `localStorage`.
- Chapter 2 enemies lead their shots based on your velocity; progress is distance-to-uplink, not an abstract timer.

### Story logic
- A single coherent campaign with title screen, chapter briefings, level banners, failure epitaphs and an epilogue — each gameplay shift now has an in-fiction reason (towers down → canal run → uplink defense).

## Code layout

```
index.html        shell + HUD/overlay markup (no CDN dependencies)
styles.css        UI styling
vendor/phaser.min.js
assets/           backgrounds + ship sprite
src/data.js       constants, physics tuning, levels, story text
src/core.js       integrator, audio synth, FX primitives, juice
src/ui.js         DOM HUD, bomb panel, overlays, touch pads
src/chapter1.js   bombing (drill pods, collapse, preview)
src/chapter2.js   canal run
src/chapter3.js   uplink defense
src/main.js       scene orchestration, campaign flow, save, debug API
```

Debug console helpers: `SkyDrill.debug.goto(c, l)`, `SkyDrill.debug.tick(seconds)`, `SkyDrill.debug.state()`.

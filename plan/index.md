# Home Page n-body Simulator — Plan Index

Tracking + architecture for the home-page gravity simulator. Phases live in sibling files.

## Phase status

| # | Phase | Status | File |
|---|---|---|---|
| 1 | Refactor + scaffold (no behavior change) | pending | [phase-1.md](./phase-1.md) |
| 2 | Stationary spawn | pending | [phase-2.md](./phase-2.md) |
| 3 | Click-drag launch (no gravity) | pending | [phase-3.md](./phase-3.md) |
| 4 | N-body gravity (Verlet) | pending | [phase-4.md](./phase-4.md) |
| 5 | Trails | pending | [phase-5.md](./phase-5.md) |
| 6 | Merge on collision | pending | [phase-6.md](./phase-6.md) |
| 7 | Reset + idle pause + tuning + docs | pending | [phase-7.md](./phase-7.md) |

Update the Status column as phases land (pending → in progress → done).

---

## POC validation

Before phase 1, a self-contained POC was built at `src/content/blog/test.mdx` using the canvas-lab `CanvasRender` sandbox. It collapses phases 2–6 into one closure: spawn, slingshot, velocity-Verlet, trails, merge, reset. Outcomes that fed back into this plan:

- **Verlet acceleration storage** — using local `ax_old` variables across the three-pass step does not work; the variable doesn't survive between for-loops. Either Body grows new fields (`axPrev, ayPrev`, distinct from the reserved `xPrev, yPrev`) or runner keeps module-scope scratch arrays. POC used scratch arrays; this plan adopts that choice (`naxBuf, nayBuf` in runner.ts, grown lazily, never shrunk). Phase 4's pseudocode is updated.
- **Arrowhead direction** — head at `(x1, y1)`, the drag-end. Rubber-band metaphor: visible stretch from anchor to finger; body launches in the opposite direction on release. Locked in phase 3.
- **Glow color is chromatic** — fill in `--nbody-body`, `shadowColor` in a separate `--nbody-glow` token. POC tested white fill + cyan glow vs monochrome; chromatic is markedly better. Added to the color tokens list below and to phase 7.
- **Substep iter cap** — `realDt` clamp + visibilitychange reset are not enough on their own. A foreground long task (GC pause, dialog open) still pushes realDt to 0.25s → ~30 substeps at FIXED_DT=1/120, which spikes CPU even though it doesn't NaN. Grid's substep loop caps at 8 iterations per render frame and drops any remaining accumulator. Added to the invariants list below.
- **Starter constants** — `G = 800, ε = 5, K = 0.5, FIXED_DT = 1/120, TRAIL_AGE = 60, DRAG_THRESHOLD = 5, BODY_CAP = 200, body radius = 6, shadowBlur = 12` produce visible, stable gravity from phase 4 onward. Phase 4 used to ship with `G = 1, ε = 4` plus a note that orbits won't look right; that note is gone. Phase 7 still owns final tuning.
- **Pointer capture is racy** — `setPointerCapture` / `releasePointerCapture` can throw on detached elements or already-released pointers. POC wraps both in try/catch; phase 3 inherits the same defense.
- **Trail prune via `shift()`** — at n = 200, trail = 60 frames, 120 Hz step rate, `shift()` measured fine. Acceptable as v1 implementation; phase 7 measures whether a head-index ring buffer is needed. Doesn't change the public `trail: TrailEntry[]` shape.

What the POC did **not** validate: SPA-nav lifecycle, painter handoff from grid, theme token round-tripping, mobile overlay z-stack, idle pause via `visibilitychange`. Those are the production-only paths phases 1, 4 (resume), and 7 cover.

---

## Architecture decisions (locked)

- One canvas, owned by `grid`, lives in `BaseLayout` with `transition:persist` so visual state survives SPA nav.
- Single RAF, owned by `grid`. Painter handoff model: grid draws its backdrop, then hands `ctx` to runner (always), then to interact (only when on `/`).
- Frame ID = **physics step count** (fixed-dt). Owned by `clock`. Grid forwards it to runner.step and to interact.frame.
- Runner splits into `step(fixedDt, frameId)` + `draw(ctx)`. Interact uses a single `frame(ctx, frameId, dt)`. Each call wrapped in `ctx.save()`/`ctx.restore()` by grid.
- Clock (frameId + fixed-dt accumulator) coupled to grid, not runner. Grid drives the accumulator and tells runner when to step.
- Interact receives a per-frame handoff (for drag preview) AND owns DOM event listeners on a home-only overlay.
- Module-scope state for persistence across SPA nav. No `window.__` globals except cleanup hooks (`__gridCleanup`, `__interactCleanup`).
- **Mobile/touch**: first-class. Overlay sets `touch-action: none`. Interact respects `isPrimary` (ignores non-primary pointers).
- **prefers-reduced-motion**: ignored. Sim is opt-in via user click; treated as intentional motion.
- **NaN / overflow guards**: none in runner. Softening (`ε`) + clamped dt + substep iter cap are the only safeguards. Trust the math.
  - **Invariants that must hold** for the no-guards decision to be safe (Phase 7 tuning must preserve all of these):
    - `ε > 0` — strictly positive. `r² + ε²` is then never zero; `invR3 = 1/(r²·√r²)` is finite.
    - `K × maxDragDistance < ∞` — at `K = 0.5` and a screen-diagonal drag of ~2000 px, peak `v = 1000 px/s`; safe. Any future `K` increase needs a sanity-check at the worst-case drag.
    - `m > 0` for every body — `state.addBody` is the only insertion path and the spawn paths in `interact` hard-code `m = 1`. Document this invariant; never call `addBody` with `m = 0` from anywhere.
    - `realDt` clamped at ≤ 0.25 s in grid, **and** both `lastTime` and `accumulator` zeroed on `visibilitychange` resume, **and** grid's substep loop caps at `MAX_SUBSTEPS = 8` per render frame (excess accumulator dropped). The clamp handles in-tab jank, the reset handles tab-hidden duration, the iter cap handles the residual case where realDt is at the clamp ceiling (0.25 s → 30 steps at FIXED_DT = 1/120) and would otherwise spike CPU. All three are required.
- **Dev hook**: `state.ts` attaches itself to `window.__nbody` when `import.meta.env.DEV` is true. Zero cost in production.
- **Cleanup ownership**: each module cleans on its own signal. Grid cleans via `data-astro-rerun` (called on every nav arrival). Home overlay subscribes to `astro:before-swap` (`once: true`) and cleans interact on leave. No shared teardown owner.
  - **Re-arm note**: `{ once: true }` listeners are consumed after firing once. They do NOT auto-re-arm on the next home arrival. The design depends on `GravityInput`'s `<script>` re-executing on every home navigation: each run disposes the prior `__interactCleanup`, mounts a fresh interact, stashes the new cleanup, and re-subscribes a fresh `astro:before-swap` `{once:true}` listener. Idempotency of the script — not the listener pattern — is what keeps cleanup correct across repeated home visits. A future refactor that "optimizes away" the re-mount would silently leak listeners on every home leave after the first.
- **Perf design target**: n = 200 bodies at 60 Hz on a typical laptop. Verify before shipping; if it can't hold, lower BODY_CAP rather than introducing spatial hashing in v1.
- **Resize behavior**: bodies are anchored in CSS px; if the window shrinks, they may drift off-screen. Physics continues uninterrupted; user can press R to reset. No clamp or rescale.
- **Constants**: deferred. Each phase picks reasonable values when needed; Phase 7 tunes everything end-to-end.
- **Color tokens**: new theme-aware CSS custom properties added to `global.css`:
  - `--nbody-body` (body fill)
  - `--nbody-glow` (body `shadowColor`; distinct from fill, validated chromatic via POC)
  - `--nbody-trail` (trail polyline)
  - `--nbody-preview` (drag preview line + arrowhead)
  Both light and dark themes set them.
- **Keydown**: bound at window-level in interact; handler short-circuits when `location.pathname !== '/'` or when an `<input>` / `<textarea>` is focused.
- **Subsystem doc**: `docs/nbody-system.md` is in scope per CLAUDE.md rule. Documents modules, data flow, lifecycle, painter-handoff. Maintained alongside code.
- **Shared types**: `src/nbody-engine/types.ts` exports `Body`, `DragState`, `TrailEntry`, `StepFn`, `CleanupFn`. All modules import from it to prevent shape drift.
- **Body removal**: `state.removeBody(id)` does an O(n) scan-and-splice. Acceptable at the target n = 200 with low merge frequency.
- **Trail storage**: array of objects (`body.trail: TrailEntry[]`). This is the **v1 plan, full stop**. The shape is public via `types.ts`; `state.ts` and `interact.ts` reference it transitively. Phase 7 measures GC pressure, but if it demands a swap to Float32Array ring buffer, that swap is a **type-contract change** (the `trail` field's type changes), NOT a runner-internal optimization. Plan accordingly: either accept array-of-objects unconditionally, or budget a public-type migration for the swap.
- **Pointer capture**: interact calls `overlay.setPointerCapture(e.pointerId)` on `pointerdown` and releases it on `pointerup`. Both calls wrapped in try/catch — they throw on race conditions (pointer already up, element detached); silent failure is correct here. Prevents stuck drag state if the pointer leaves the overlay mid-drag.

---

## Folder structure

```
src/
  grid/
    grid.ts
  nbody-engine/
    types.ts
    state.ts
    clock.ts
    runner.ts
    interact.ts
  components/
    home/
      GravityInput.astro      # overlay + mounts interact
  layouts/
    BaseLayout.astro          # initializes grid
  pages/
    index.astro               # renders GravityInput
  styles/
    global.css                # .gravity-input overlay rule + --nbody-* color tokens
docs/
  nbody-system.md             # subsystem doc per CLAUDE.md rule
```

---

## `src/grid/grid.ts`

### Owns
- The single `<canvas>` element in `BaseLayout` (with `transition:persist`).
- The single site-wide RAF loop.
- Canvas geometry: size, DPR scaling (`setTransform(dpr,0,0,dpr,0,0)`).
- Backdrop drawing: grid lines + ambient glow + cursor-follow glow lerp.
- Resize listener.
- Theme observer (`data-theme` mutation on `<html>`).
- Visibility-based pause (`document.visibilityState`).
- Wall-clock delta computation (`dt` per render frame, clamped at 0.25s, reset on visibility resume).

### Per-frame flow
1. Compute real `dt` from RAF time.
2. `clock.advance(dt, (fixedDt, frameId) => runner.step(fixedDt, frameId))` — clock loops the accumulator, bumping `frameId` per step and forwarding it to the callback.
3. `ctx.clearRect(...)`.
4. Draw own backdrop (lines + glow).
5. `ctx.save()` → `runner.draw(ctx)` → `ctx.restore()`.
6. If `location.pathname === '/'`: `ctx.save()` → `interact.frame(ctx, clock.getFrameId(), dt)` → `ctx.restore()`.

### Does NOT
- Know what bodies, gravity, or simulation are.
- Touch `nbody-state` except to read `frameId`.
- Manage user input beyond its own cursor-glow effect.
- Maintain a generic module registry, event bus, or layer priority list.
- Route or check pathname for any reason except the interact handoff conditional.

### Lifecycle
- Initialized by BaseLayout's `<script data-astro-rerun>` once per page-load.
- Cleanup hook (`window.__gridCleanup`) cancels RAF, removes resize / theme / visibility listeners. Module-scope offscreen caches survive (cheap to keep).
- Idempotent re-init: existing cleanup is called before re-binding.

### Imports
- `nbody-engine/clock` (advance time, read `frameId`)
- `nbody-engine/runner` (calls `.step` via clock callback, calls `.draw` directly)
- `nbody-engine/interact` (calls `.frame` conditionally)

Coupled to nbody by design. If a third guest module ever joins, refactor at that point.

---

## `src/nbody-engine/types.ts`

Single source of truth for sim data shapes. No runtime code.

### Exports
- `Body` — `{ id, x, y, vx, vy, ax, ay, m, r, trail: TrailEntry[], xPrev, yPrev }`.
- `DragState` — `{ x0, y0, x1, y1 }`.
- `TrailEntry` — `{ x, y, fid }`.
- `StepFn` — `(fixedDt: number, frameId: number) => void`.
- `CleanupFn` — `() => void`.

All other modules import from here. No values, only types.

---

## `src/nbody-engine/state.ts`

Pure storage. No logic, no `frameId`, no derivation, no constants except the storage cap.

### Owns (module-scope, persists across SPA nav)
- `bodies: Body[]` — one array, initialized once at module load, never reassigned. Hard cap 200.
- `dragState: DragState | null` — values that interact maintains.
- `nextId: number` — monotonic body ID counter. State assigns the `id` field on `addBody`.

### Body shape
```
{ id, x, y, vx, vy, ax, ay, m, r, trail: [], xPrev, yPrev }
```
`xPrev/yPrev` reserved for future render interpolation, unused in v1.

### API — setters
- `addBody(body)` — assigns `id = nextId++`, pushes if under cap, silently no-op if at cap.
- `removeBody(id)` — splice out.
- `clearBodies()` — empties the array (same array instance, just length = 0).
- `setDrag(drag)` — set or null.

### API — getters
- `getBodies()` — returns the live array reference. Callers may mutate fields on bodies in place (runner updates `x, y, vx, vy`). Documented contract.
- `getDrag()` — current drag value or null.

### Does NOT
- Compute velocity from drag.
- Step physics or run any loop.
- Own `frameId`.
- Know `G`, `ε`, `K`, trail length, or any physics / UI constant.
- Touch DOM, ctx, time, or events.
- Cap or shape trails (runner decides what goes in `body.trail`).

### Lifecycle
- Module-scope singleton. Array allocated at first import. Survives SPA nav natively.
- `import.meta.hot.decline()` at top of file → Vite HMR falls back to full reload, preventing silent state wipe in dev.
- If `import.meta.env.DEV`: attach a read-only-ish reference to `window.__nbody = { getBodies, getDrag }` for browser-console inspection. Production build is untouched.

### Imports
- None. Pure data store.

---

## `src/nbody-engine/clock.ts`

Single source of truth for simulation time.

### Owns (module-scope, persists across SPA nav)
- `frameId: number` — canonical physics step counter, monotonic.
- Fixed-dt accumulator.
- `FIXED_DT` constant (e.g., `1/120`).

### API
- `advance(realDt, stepFn)` — adds `realDt` to accumulator; while accumulator ≥ `FIXED_DT`, increments `frameId` then calls `stepFn(FIXED_DT, frameId)`. Returns number of steps executed (debug).
- `getFrameId()` — current value.

### Does NOT
- Touch state, ctx, or DOM.
- Decide what a step does (caller's `stepFn` decides).
- Own RAF.

### Lifecycle
- Module-scope. `frameId` and accumulator survive SPA nav (continuous world time).
- HMR declined.

### Imports
- None.

---

## `src/nbody-engine/runner.ts`

Pure mathematician + painter. Two functions: one steps physics, one draws. No time, no RAF, no events.

### Owns
- Physics constants: `G`, `ε` (softening).
- Trail policy: `TRAIL_AGE` (frameId delta), push-per-step rule.
- Color cache for body fill (`--nbody-body`) and glow (`--nbody-glow`); refreshed each frame from CSS vars at draw time.
- Module-scope scratch arrays `naxBuf: number[]`, `nayBuf: number[]` for Verlet's new accelerations. Grown lazily on body-count increase via `naxBuf.length < n` check; never shrunk. Reused across steps — no per-step allocation.

### API
- `step(fixedDt, frameId)` — one physics tick. Called by grid (via clock callback) zero or more times per render frame. Grid forwards `frameId` from clock.
  1. Velocity Verlet over `state.getBodies()` (three passes; new accelerations live in `naxBuf/nayBuf`, current accelerations stay on `body.ax/ay`):
     - pass 1: `x += vx·dt + 0.5·ax·dt²`, zero `naxBuf[i]/nayBuf[i]`
     - pass 2: pairwise `F = G·mi·mj / (r² + ε²)` accumulated into `naxBuf/nayBuf`
     - pass 3: `vx += 0.5·(ax + naxBuf[i])·dt`, then commit `body.ax = naxBuf[i]` (and same for y)
  2. `collide(bodies)` — separate internal helper. Pairwise overlap → merge (momentum + area conservation), removes one body via `state.removeBody`.
  3. Trail push: `body.trail.push({ x, y, fid: frameId })`.
  4. Prune entries where `fid < frameId - TRAIL_AGE`.
- `draw(ctx)` — pure render. Called once per render frame.
  - Trails: per-segment `rgba()` fading from old → new.
  - Bodies: filled circle + `shadowBlur` glow, color from cached CSS var.
  - Reads ctx as grid left it (DPR-scaled). Local mutations safe; grid wraps in `save/restore`.

### Does NOT
- Own RAF, canvas, or resize/theme listeners.
- Handle pointer or keyboard input.
- Draw the drag preview (interact's job).
- Touch `dragState`.
- Manage time, dt, or frameId arithmetic.
- Import clock.

### Lifecycle
- Module-scope. No init/dispose API.
- HMR declined.

### Imports
- `nbody-engine/state` (read bodies, mutate body fields in place, `removeBody` on merge).

---

## `src/nbody-engine/interact.ts`

User-input layer. Mutates state from DOM events; draws the drag preview each frame on home.

### Owns (module-scope)
- `K` — drag → velocity scale constant (slingshot strength).
- `DRAG_THRESHOLD` — pixel distance below which a release counts as a click, not a drag.
- Listener handle storage so re-mount is idempotent.

### API — mount / dispose (called by home overlay component)
- `mount(overlayEl)` — attaches pointer + keyboard listeners. Returns a cleanup function.
- Cleanup MUST be called on `astro:before-swap` when leaving home; otherwise listeners leak onto the detached element.
- **Null-safety contract**: `mount(el)` throws if `el` is not a valid `HTMLElement`. Caller (`GravityInput`) is responsible for ensuring the overlay exists in the DOM before calling. Silent no-op on null was rejected — it hides "overlay markup got stripped" regressions.

### API — per-frame (called by grid when on `/`)
- `frame(ctx, frameIdSnapshot, dt)` — draws drag preview if `state.getDrag()` is non-null. Dashed line from `(x0, y0)` to `(x1, y1)`, **arrowhead at `(x1, y1)`** (the drag-end). Rubber-band metaphor: visible stretch from anchor to finger; body launches in the opposite direction. Reads color from CSS vars (re-read per frame, cheap at this rate).

### Event handlers (internal)
- All pointer handlers gate on `e.isPrimary` — non-primary pointers ignored, no multi-touch.
- `pointerdown(e)` → `try { overlay.setPointerCapture(e.pointerId); } catch {}`; CSS-px coords from overlay; `state.setDrag({ x0, y0, x1: x0, y1: y0 })`.
- `pointermove(e)` (while drag active) → `state.setDrag({ ...current, x1, y1 })`.
- `pointerup(e)` → `try { overlay.releasePointerCapture(e.pointerId); } catch {}`; then:
  1. Read current drag from `state.getDrag()`.
  2. Compute drag distance.
  3. If `< DRAG_THRESHOLD`: build stationary body `{ x, y, vx: 0, vy: 0, ax: 0, ay: 0, m: 1, r: 6, trail: [], xPrev: x, yPrev: y }`, call `state.addBody(body)` (state assigns the id).
  4. Else: slingshot — `vx = (x0 - x1) · K`, `vy = (y0 - y1) · K`; build body with that velocity; `state.addBody(body)`.
  5. `state.setDrag(null)`.
- `keydown(e)` (window-level; pathname `/` and no focused input/textarea): `'r'`/`'R'` → `state.clearBodies()` AND `state.setDrag(null)`.

### Does NOT
- Step physics, integrate, or compute forces.
- Own RAF, canvas, or `frameId`.
- Allocate body ids (state does).
- Mutate body fields after spawn.
- Touch `state.bodies` array directly — goes through `addBody / clearBodies`.

### Lifecycle
- Module-scope listener storage so re-mount disposes prior listeners first.
- HMR declined to avoid stale-listener accumulation in dev.

### Imports
- `nbody-engine/state` only.

---

## `src/components/home/GravityInput.astro`

Thin home-only DOM overlay + mount script. Its only job: provide interact a target element and manage its SPA lifecycle.

### Template
```astro
---
---
<div class="gravity-input" aria-hidden="true"></div>
<script>
  import { mount } from '../../nbody-engine/interact';
  (window as any).__interactCleanup?.();
  const overlay = document.querySelector('.gravity-input');
  const cleanup = mount(overlay);
  (window as any).__interactCleanup = cleanup;
  document.addEventListener(
    'astro:before-swap',
    () => { (window as any).__interactCleanup?.(); (window as any).__interactCleanup = null; },
    { once: true }
  );
</script>
```

### Responsibilities
- Render the `.gravity-input` overlay div in the home DOM (full viewport, `inset: 0`).
- On script run: dispose any prior interact mount, then `interact.mount(overlay)`; stash cleanup in `window.__interactCleanup`.
- Subscribe to `astro:before-swap` (`once: true`) → on nav away from home, call cleanup and null the global.
- Idempotency: existing cleanup invoked before re-mount.

### Owns
- The single overlay DOM node on `/`.
- `window.__interactCleanup` lifecycle global (the only one needed for interact).

### Does NOT
- Know about physics, bodies, drag math, or grid.
- Render anything visible (overlay is transparent; drag preview is drawn by interact onto the grid canvas).
- Carry CSS — class hook only; styling lives in `global.css`.

---

## `src/layouts/BaseLayout.astro` (modifications)

### What stays
- Existing `<canvas class="grid-glow" id="grid-glow" transition:persist>` element.
- Header markup + theme toggle button + theme-init `is:inline` script.
- All `<head>` content.

### What changes
- The big inline `data-astro-rerun` grid IIFE (~300 lines) is **removed**.
- Replaced with a minimal `<script data-astro-rerun>` that:
  ```ts
  import { initGrid } from '../grid/grid';
  (window as any).__gridCleanup?.();
  const canvas = document.getElementById('grid-glow') as HTMLCanvasElement;
  (window as any).__gridCleanup = initGrid(canvas);
  ```
- Theme toggle button's click handler stays in BaseLayout (header UI concern, not canvas) — currently inline; keep as-is.

### Responsibility
- BaseLayout is now ignorant of canvas internals. It owns the DOM hosts (canvas element, header) and delegates all rendering to `grid.ts`.

---

## `src/styles/global.css` (additions)

Two additions:

1. `.gravity-input` overlay rule:
```css
.gravity-input {
  position: fixed;
  inset: 0;
  z-index: 1;             /* above .grid-glow (0), below .site-header (100) */
  pointer-events: auto;
  cursor: crosshair;
  background: transparent;
  touch-action: none;     /* mobile: prevent pinch-zoom / scroll during drag */
}
```

2. Sim color tokens, set per theme alongside existing tokens. `global.css` already uses `[data-theme="dark"]` and `[data-theme="light"]` (no `:root` prefix, double quotes); the new tokens drop into those existing blocks:
```css
[data-theme="dark"] {
  --nbody-body: <theme-appropriate>;
  --nbody-trail: <theme-appropriate>;
  --nbody-preview: <theme-appropriate>;
}
[data-theme="light"] {
  --nbody-body: <theme-appropriate>;
  --nbody-trail: <theme-appropriate>;
  --nbody-preview: <theme-appropriate>;
}
```

Actual values picked during Phase 7 tuning. `.grid-glow`'s existing rule remains unchanged.

---

## `src/pages/index.astro` (modifications)

Render `<GravityInput />` inside HomeLayout.

```astro
---
import HomeLayout from '../layouts/HomeLayout.astro';
import GravityInput from '../components/home/GravityInput.astro';
---

<HomeLayout title="Home" description="Playground">
  <GravityInput />
</HomeLayout>
```

No other content on home — overlay + grid canvas + simulation IS the home page.

---

## Out of scope

- Mass-by-drag-duration / scroll-to-set-mass.
- Pause/play/slider UI.
- Barnes–Hut for large n.
- Render interpolation (`xPrev/yPrev` fields reserved but unused).
- Replay / save / serialize state.
- Saving bodies to localStorage across reloads.
- **Max-velocity clamp**: bodies launched with extreme drags can exceed any reasonable speed. Verlet integrates them honestly; they fly off-screen at high rates. User can press R to reset.
- **Off-screen body GC**: bodies that drift far off-canvas still consume O(n²) pairwise work in `runner.step`. Fine at n ≤ 200; not pruned.
- **Screen-edge behavior**: bodies don't wrap, bounce, or hit walls. Off-canvas = off-canvas. Same posture as the resize-drift note above.
- **Body ID recycling**: `nextId` is monotonic, never reused. At n ≤ 200 and JS number range, not a practical limit; documented here for anyone adding a serializer or persistence layer later.

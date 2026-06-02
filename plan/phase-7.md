# Phase 7 — Reset + idle pause + tuning + docs

See [index.md](./index.md) for architecture.

## Goal

Ship-ready behavior: reset key, idle pause confirmed, all constants tuned for feel, color tokens finalized, perf verified at n = 200, subsystem doc complete.

## Build

### Reset
- `interact.keydown` (window-level): if `e.key === 'r' || 'R'` AND `location.pathname === '/'` AND no `<input>`/`<textarea>` is focused → `state.clearBodies()` AND `state.setDrag(null)`.

### Idle pause
- Confirm grid's `document.visibilitychange` handler pauses RAF when `document.hidden === true`.
- On resume (`visibilitychange` fires with `hidden === false`): reset both `lastTime` AND `accumulator` to zero so we don't fast-forward.
- Confirm `MAX_SUBSTEPS = 8` iter cap on grid's substep loop fires correctly under a synthetic long task (drops excess accumulator instead of stacking substeps).

### Tuning (in this order, by feel)
POC starter values are the line of departure, not arbitrary picks: `G = 800, ε = 5, K = 0.5, FIXED_DT = 1/120, TRAIL_AGE = 60, DRAG_THRESHOLD = 5, body r = 6, shadowBlur = 12`. Adjust against the full sim (with merges + trails); each retune should still satisfy the invariants in [index.md](./index.md).

- `FIXED_DT` — `1/120` is the starting point. Drop to `1/60` only if budget tight at n = 200.
- `G`, `ε` — adjust until 2-body orbits feel satisfying. Larger `G` = stronger pull; larger `ε` = softer near-collisions.
- `K`, `DRAG_THRESHOLD` — calibrate launch feel. Short drags should produce slow orbits, not stationary; long drags should produce escapes.
- `TRAIL_AGE` — long enough to show one orbit, short enough not to clutter.
- `MAX_SUBSTEPS` — `8` is the starting cap. Lower only if foreground long-task hiccups still feel laggy.

### Colors
- Set actual `--nbody-body`, `--nbody-glow`, `--nbody-trail`, `--nbody-preview` values for both `[data-theme='dark']` and `[data-theme='light']` in `global.css`.
- `--nbody-body` is the fill; `--nbody-glow` is the `shadowColor`, intentionally distinct (POC validated chromatic glow reads markedly better than monochrome — e.g., white fill over cyan glow on dark).
- Trail should be a dimmer/alpha-blended variant of body color; preview a neutral but visible color.

### Perf
- Place 200 bodies. Measure frame time (devtools performance monitor).
- If frame time > 16ms consistently: swap `body.trail` from `Array<TrailEntry>` to per-body `Float32Array(TRAIL_LEN * 3)` ring buffer with a head index. Update `runner.step` push/prune and `runner.draw` traversal accordingly.
- If still slow: lower `BODY_CAP` until it fits.

### Docs
- Fill `docs/nbody-system.md` with:
  - Overview + the painter-handoff metaphor.
  - Module diagram (grid → clock → runner; interact → state).
  - Data flow (DOM events → interact → state → runner → ctx).
  - Lifecycle: init (BaseLayout rerun + home overlay), cleanup paths, SPA-nav behavior.
  - Constants reference table.
  - Why these decisions: persistence via canvas `transition:persist` + module-scope state; pure storage in state.ts; clock coupled to grid not runner.

## Verify

1. Press `R` on home → all bodies + drag cleared instantly.
2. Tab-switch → CPU usage drops; return → resumes cleanly without time-jump.
3. Theme toggle mid-orbit → bodies, trails, and preview recolor on next frame.
4. Stress: place 50 bodies, navigate `/` → `/about` → `/atelier` → `/` — no leaks (devtools event listener panel), sim still ticking.
5. 200-body stress test: frame time at 60Hz target.
6. `npm run build` clean. `npm run validate` passes (content schemas, unrelated but must not regress).
7. `docs/nbody-system.md` matches what's implemented; no stale claims.
8. Update [index.md](./index.md) phase table — all rows marked `done`.

## Exit criteria

- All seven phases marked done.
- Site builds, validates, and runs without regression on any page.
- Subsystem doc complete and accurate.
- Plan folder can be archived or deleted.

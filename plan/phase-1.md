# Phase 1 — Refactor + scaffold (no behavior change)

See [index.md](./index.md) for architecture and per-file responsibilities.

## Goal

Extract the existing inline grid IIFE from `BaseLayout.astro` into a new `grid/` module. Stand up empty `nbody-engine/` modules wired together. Site looks and behaves identically to before.

## Build

- Create `src/nbody-engine/types.ts` with `Body`, `DragState`, `TrailEntry`, `StepFn`, `CleanupFn`.
- Create `src/nbody-engine/state.ts` with module-scope `bodies = []`, `dragState = null`, `nextId = 0`, all setters/getters implemented. HMR declined. Dev hook wired (no-op until used).
- Create `src/nbody-engine/clock.ts` with `frameId`, accumulator, `FIXED_DT` placeholder, `advance`, `getFrameId`.
- Create `src/nbody-engine/runner.ts` with empty `step(dt, fid)` and empty `draw(ctx)`.
- Create `src/nbody-engine/interact.ts` with `mount(el)` that no-ops and returns a cleanup. Empty `frame(ctx, fid, dt)`.
- Create `src/grid/grid.ts` by lifting the IIFE from `BaseLayout.astro` (~lines 117–436). Convert closure state to module state. Replace `window.__gridOffscreen` / `__glowOffscreen` globals with module vars. Inside the RAF loop: compute `dt`, `clock.advance(dt, runner.step)`, clear, draw backdrop, `save/runner.draw/restore`, if `location.pathname === '/'` then `save/interact.frame/restore`. Export `initGrid(canvas) → CleanupFn`.
- Create `src/components/home/GravityInput.astro` (overlay + mount script per index.md template).
- Modify `src/layouts/BaseLayout.astro`: remove inline IIFE, replace with the small importer/initializer script.
- Modify `src/pages/index.astro` to render `<GravityInput />` inside `HomeLayout`.
- Add `.gravity-input` rule + `--nbody-*` token placeholders to `src/styles/global.css`.
- Create `docs/nbody-system.md` skeleton (sections: overview, modules, data flow, lifecycle).
- Update `CLAUDE.md` Documentation section: add a `docs/nbody-system.md` bullet describing the subsystem (canvas painter-handoff + n-body engine). Required by CLAUDE.md's own rule for new subsystems.

## Verify

1. `npm run dev`. Site looks identical to before on every page.
2. Grid backdrop renders, glow follows cursor, theme toggle retints.
3. Click on home does nothing yet (interact stub).
4. Navigate `/` → `/about` → `/` — no console errors, single RAF active in performance devtools.
5. `npm run build` succeeds.

## Exit criteria

- All files exist with the responsibilities described in [index.md](./index.md).
- Site is visually a no-op refactor.
- No regressions in grid behavior across any page.

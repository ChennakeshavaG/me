# Phase 5 — Trails

See [index.md](./index.md) for architecture.

## Goal

Each body draws a fading trail of its recent path. Trail prune is by `frameId` age (honest about pauses/slowdowns).

## Build

- In `runner.step` after integration:
  - `body.trail.push({ x: body.x, y: body.y, fid: frameId })`.
  - Prune entries with `entry.fid < frameId - TRAIL_AGE` via `while (trail.length && trail[0].fid < cut) trail.shift()`. `shift()` is O(trail length) but POC measured fine at n = 200, trail = 60, 120 Hz step rate (~24k shifts/sec, each over ≤60 elements). Phase 7 measures whether a head-index ring buffer is needed; the public `trail: TrailEntry[]` shape stays the same either way.
- In `runner.draw`, before drawing each body:
  - Stroke a polyline through `body.trail`, per-segment alpha fading from ~0 (oldest) to ~1 (newest), color from `var(--nbody-trail)`.
- Starter `TRAIL_AGE = 60` (frameIds at 120Hz physics = 0.5s of trail). POC value; phase 7 may retune.

## Verify

1. Orbit from Phase 4 → see elliptical trail draw out the orbit path.
2. Trail fades to invisible at the tail.
3. ~50 bodies — frame time stays comfortable (under 16ms).
4. Navigate `/` → `/about` → `/` — trails persist as part of body state.
5. Reset (will land in Phase 7) not needed yet; manually verify trails grow then prune at steady state.

## Exit criteria

- Visible orbital paths via fading trails.
- Trail length matches `TRAIL_AGE` in frameId units; no unbounded growth.
- No visible perf regression vs Phase 4.

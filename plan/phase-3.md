# Phase 3 — Click-drag launch (no gravity)

See [index.md](./index.md) for architecture.

## Goal

Click-drag draws a preview arrow; release spawns a body with slingshot velocity. Bodies move in straight lines (no gravity yet).

## Build

- `interact.pointerdown`:
  - `try { overlay.setPointerCapture(e.pointerId); } catch {}` — throws on race conditions (already-up pointer, detached element); silent failure is correct.
  - `state.setDrag({ x0, y0, x1: x0, y1: y0 })`.
- `interact.pointermove` (only when `state.getDrag()` is non-null):
  - Update `x1, y1` via `state.setDrag({ ...current, x1, y1 })`.
- `interact.pointerup`:
  - `try { overlay.releasePointerCapture(e.pointerId); } catch {}`.
  - Read drag from `state.getDrag()`.
  - Compute `dist = hypot(x1 - x0, y1 - y0)`.
  - If `dist < DRAG_THRESHOLD`: build stationary body, `state.addBody`.
  - Else: slingshot — `vx = (x0 - x1) · K`, `vy = (y0 - y1) · K`. Build body with that velocity, `state.addBody`.
  - `state.setDrag(null)`.
- `interact.frame(ctx, frameId, dt)`:
  - If `state.getDrag()` is non-null: draw dashed line from `(x0, y0)` to `(x1, y1)` in `var(--nbody-preview)`, with the **arrowhead at `(x1, y1)`** (the drag-end). Rubber-band visual: stretch from anchor to finger; body launches in the opposite direction on release. POC validated this reads correctly.
- `runner.step(fixedDt, frameId)`: integrate constant velocity only — `x += vx · dt`, `y += vy · dt`. No gravity, no Verlet yet.
- Starter values from POC: `K = 0.5`, `DRAG_THRESHOLD = 5` (px). Phase 7 retunes by feel.

## Verify

1. Drag from A to B → dashed arrow tracks cursor.
2. Release → body launches in direction opposite the drag (slingshot).
3. Short drag = slow body; long drag = fast body.
4. Quick click without drag → stationary body (preserves Phase 2).
5. Drag, drift pointer outside overlay, release outside → drag still completes (pointer capture works).
6. Multi-touch ignored (second finger does nothing while primary is dragging).
7. Bodies fly off-screen in straight lines (no gravity yet — correct).

## Exit criteria

- Drag UX feels responsive (no lag in preview).
- Velocity matches drag direction (slingshot).
- No stuck drag state under any release path.

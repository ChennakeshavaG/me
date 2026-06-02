# Phase 2 — Stationary spawn

See [index.md](./index.md) for architecture.

## Goal

Click on the home overlay places a stationary glowing body. Bodies persist across SPA nav.

## Build

- `interact.pointerdown`: gate on `e.isPrimary`. Compute CSS-px coords from the overlay's bounding rect. Build stationary body:
  ```
  { x, y, vx: 0, vy: 0, ax: 0, ay: 0, m: 1, r: 6, trail: [], xPrev: x, yPrev: y }
  ```
  Call `state.addBody(body)` (state assigns the id).
- `runner.draw`: iterate `state.getBodies()`. For each, fill a circle in `var(--nbody-body)` with `shadowBlur` glow.
- Pick placeholder color values for `--nbody-body` in `global.css` for both themes (Phase 7 will finalize).

## Verify

1. Click home → dot appears at click point.
2. Multiple clicks → multiple dots.
3. Navigate `/` → `/about` → dots still visible (canvas + state both persist).
4. Return to `/` → same dots, can place more.
5. Theme toggle → dots recolor on next frame.

## Exit criteria

- Bodies render correctly site-wide.
- No regressions in grid backdrop or glow.
- `state.bodies.length` visibly grows with each click (verify via `window.__nbody.getBodies()` in dev console).

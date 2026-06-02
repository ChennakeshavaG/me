# Phase 6 — Merge on collision

See [index.md](./index.md) for architecture.

## Goal

Overlapping bodies merge into one larger body. Conservation of momentum + area-preserving radius. Bodies grow as they absorb others.

## Build

- Add internal `collide(bodies)` helper in `runner.ts`. Called from `runner.step` after integration, before trail push.
- For each pair `(i, j)` where `i < j`:
  - If `dist(i, j) < r_i + r_j`:
    - `m  = m1 + m2`
    - `vx = (m1·v1x + m2·v2x) / m`
    - `vy = (m1·v1y + m2·v2y) / m`
    - `x  = (m1·x1  + m2·x2 ) / m`
    - `y  = (m1·y1  + m2·y2 ) / m`
    - `r  = sqrt(r1² + r2²)`     // area-preserving in 2D
    - Mutate body `i` in place with merged fields. Clear body `i`'s trail.
    - `state.removeBody(j.id)`.
- Loop the pairwise pass until no overlaps remain in this step (handles cascading merges; rare but possible).

## Verify

1. Equal-mass head-on collision → single body at midpoint with near-zero velocity.
2. Asymmetric (one fast, one stationary) → merged body moves in net-momentum direction.
3. Slow drift-together → bodies fuse; visible `m` and `r` growth.
4. Cascading-merge integrity — after absorbing `j` into `i`, subsequent pair checks in the same pass MUST read `i`'s updated `m`, `r`, `v`, `x`, `y`. A body growing through multiple merges in one step is expected (that's what the "loop until no overlaps remain" rule is for). What is forbidden: removing the same body twice, or comparing against stale radius/mass after a merge. `state.removeBody(id)` is a scan-and-splice; calling it twice with the same id silently no-ops on the second call, masking bugs — guard against double-removal at the caller.
5. After many merges, `bodies.length` reflects the actual count (no zombie bodies).

## Exit criteria

- Collisions visibly conserve momentum.
- Larger bodies are visibly larger (radius scales).
- No leaked / orphaned bodies in `window.__nbody.getBodies()`.

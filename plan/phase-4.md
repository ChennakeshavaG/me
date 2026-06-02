# Phase 4 — N-body gravity (Verlet)

See [index.md](./index.md) for architecture.

## Goal

Bodies pull each other via Newtonian gravity. Stable orbits are possible. Physics decoupled from frame rate via fixed-dt accumulator.

## Build

- Replace `runner.step` constant-velocity integration with **velocity Verlet**.

  New accelerations live in module-scope scratch arrays `naxBuf, nayBuf` (declared in runner.ts; grown lazily on body-count increase, never shrunk). Old accelerations stay on `body.ax/body.ay` until pass 3 commits the new ones in. POC validated this layout — using a local `ax_old` across loops does not work because the variable does not survive between for-loops.

  ```
  ensureScratch(n);             // naxBuf.length < n ? naxBuf.length = n; same for nayBuf

  // 1. Drift positions from current velocities + current accelerations.
  //    Zero the scratch slots so pass 2 starts clean for this step.
  for i in 0..n:
    bi.x       += bi.vx · dt + 0.5 · bi.ax · dt²
    bi.y       += bi.vy · dt + 0.5 · bi.ay · dt²
    naxBuf[i]   = 0
    nayBuf[i]   = 0

  // 2. Pairwise gravity into the scratch. Newton's third law: symmetric.
  for i, j in pairs (i < j):
    dx    = bj.x - bi.x
    dy    = bj.y - bi.y
    r2    = dx² + dy² + ε²        // softening, prevents singularity
    invR3 = 1 / (r2 · sqrt(r2))
    naxBuf[i] += G · bj.m · dx · invR3
    nayBuf[i] += G · bj.m · dy · invR3
    naxBuf[j] -= G · bi.m · dx · invR3
    nayBuf[j] -= G · bi.m · dy · invR3

  // 3. Kick: average old (body.ax) + new (naxBuf[i]) acceleration.
  //    Then commit new -> body so the next step's pass 1 reads them.
  for i in 0..n:
    bi.vx += 0.5 · (bi.ax + naxBuf[i]) · dt
    bi.vy += 0.5 · (bi.ay + nayBuf[i]) · dt
    bi.ax  = naxBuf[i]
    bi.ay  = nayBuf[i]
  ```

  Critical invariants: (a) the scratch is zeroed at the end of pass 1 so the symmetric `+= / -=` in pass 2 starts clean; (b) `body.ax/ay` are only overwritten in pass 3, AFTER they have been used in the velocity average — flipping the order destroys Verlet's symplectic property.
- Declare `G`, `ε` in `runner.ts` module scope. Starter values from POC: `G = 800`, `ε = 5`. These produce visible orbits at slingshot scales out of the gate; phase 7 still owns final tuning.
- Set `clock.FIXED_DT = 1/120`.
- Confirm `grid` clamps real `dt` at 0.25s, zeroes both `lastTime` and `accumulator` on `visibilitychange` resume, AND caps substeps per render frame at `MAX_SUBSTEPS = 8` (excess accumulator dropped). All three are required to satisfy the no-NaN-guards invariant.

## Verify

1. Stationary body + tangential launch nearby → curves into orbit.
2. Three bodies → chaotic but no NaN, no crashes within 30s.
3. Symmetric head-on launch → bodies approach and pass through each other (collisions come in Phase 6).
4. Lone stationary body stays put.
5. Tab-switch for 30s → return → orbits resume cleanly, no time-jump or runaway.
6. Long-task simulation (insert a one-off `await new Promise(r => setTimeout(r, 500))` from devtools console) → sim hiccups but does not stack frames or NaN. The substep iter cap is what catches this case.
7. Frame time at n = 10 well within 16ms budget (dev tools performance).

## Exit criteria

- Orbits are stable for at least 30s without bodies escaping to infinity.
- No NaN in `window.__nbody.getBodies()` after stress test.
- Tab-switch resume does not freeze the loop or fast-forward the world.
- Foreground long task does not stack substeps (iter cap holds).

**Note on tuning**: POC validated `G = 800, ε = 5, K = 0.5` produce visible, satisfying orbits from this phase onward. Phase 7 still tunes by feel against the full sim (with merges + trails), but use the POC values as the starting line, not arbitrary picks. Do NOT free-tune constants here — change them in phase 7 once the whole system is in.

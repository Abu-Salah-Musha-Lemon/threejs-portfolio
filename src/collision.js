/**
 * Pure 2D collision helpers (no Three.js), so they can be unit tested in Node.
 * Colliders live on the XZ plane:
 *   { t:'c', x, z, r }                    circle (bushes, lamp posts)
 *   { t:'b', x, z, hw, hd, rot }          box, half width/depth, rotation around Y (trees, rocks, towers)
 */
export function resolve(x, z, colliders, pr = 0.45) {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const c of colliders) {
      if (c.t === 'c') {
        const dx = x - c.x, dz = z - c.z, min = c.r + pr, d2 = dx * dx + dz * dz;
        if (d2 < min * min) {
          const d = Math.sqrt(d2) || 1e-4;
          x = c.x + (dx / d) * min; z = c.z + (dz / d) * min; moved = true;
        }
      } else {
        const rot = c.rot || 0, cos = Math.cos(rot), sin = Math.sin(rot);
        const ox = x - c.x, oz = z - c.z;
        const lx = ox * cos + oz * sin, lz = -ox * sin + oz * cos;
        const hw = c.hw + pr, hd = c.hd + pr;
        if (Math.abs(lx) < hw && Math.abs(lz) < hd) {
          let nx = lx, nz = lz;
          if (hw - Math.abs(lx) < hd - Math.abs(lz)) nx = (lx < 0 ? -1 : 1) * hw;
          else nz = (lz < 0 ? -1 : 1) * hd;
          x = c.x + nx * cos - nz * sin; z = c.z + nx * sin + nz * cos; moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return { x, z };
}

/** True when a point (with player radius) overlaps any collider. */
export function overlaps(x, z, colliders, pr = 0.45) {
  const r = resolve(x, z, colliders, pr);
  return Math.abs(r.x - x) > 1e-6 || Math.abs(r.z - z) > 1e-6;
}

/** Soft steering vector that pushes click-to-walk paths around nearby obstacles. */
export function avoid(x, z, colliders, range = 2.4) {
  let ax = 0, az = 0;
  for (const c of colliders) {
    const reach = (c.t === 'c' ? c.r : Math.max(c.hw, c.hd)) + range;
    const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz);
    if (d < reach && d > 1e-4) {
      const w = (reach - d) / reach;
      ax += (dx / d) * w; az += (dz / d) * w;
    }
  }
  return { x: ax, z: az };
}

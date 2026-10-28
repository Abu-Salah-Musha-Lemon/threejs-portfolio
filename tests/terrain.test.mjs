import assert from 'node:assert/strict';
import { STREAM_SAMPLES as S, TOWER_SITES as T, BRIDGE as B, LOOKOUT as L, SPRING, groundHeight, terrainBlocked } from '../src/terrain.js';

const rim = (p) => Math.hypot(p.x, p.z);
// Everything stays on the island (top radius 38).
assert.ok(S.every(p => rim(p) < 37.8), 'stream inside island');
assert.ok(Math.hypot(L.x, L.z) + L.r < 37, 'lookout inside island');
assert.ok(Math.hypot(SPRING.x, SPRING.z) < 38.5);
// Obelisks keep clear of the water.
for (const t of T) for (const p of S) assert.ok(Math.hypot(p.x - t.x, p.z - t.z) > 2.8, 'tower too close to stream');
// Bridge: arched in the middle, low at the ends, flat ground elsewhere.
assert.ok(Math.abs(groundHeight(B.cx, B.cz) - B.archH) < .01);
const endU = B.L / 2 - .01;
assert.ok(groundHeight(B.cx + B.ax * endU, B.cz + B.az * endU) < .2);
assert.equal(groundHeight(0, 1), 0);
assert.equal(groundHeight(B.cx + B.tx * 3, B.cz + B.tz * 3), 0, 'beside the deck is ground level');
// The deck rises smoothly (no step taller than 0.12 per 0.2 units).
let prev = groundHeight(B.cx - B.ax * 4.3, B.cz - B.az * 4.3);
for (let u = -4.3; u <= 4.3; u += .2) { const h = groundHeight(B.cx + B.ax * u, B.cz + B.az * u); assert.ok(Math.abs(h - prev) < .12, 'deck step at u=' + u); prev = h; }
// Props are kept off the stream, but open ground stays open.
assert.equal(terrainBlocked(B.cx, B.cz), true);
assert.equal(terrainBlocked(-20, 20), false);
assert.equal(terrainBlocked(0, 1), false);
console.log('terrain tests passed');

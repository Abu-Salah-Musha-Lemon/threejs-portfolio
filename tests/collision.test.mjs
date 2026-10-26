import assert from 'node:assert/strict';
import { resolve, overlaps, avoid } from '../src/collision.js';

const box = { t: 'b', x: 5, z: 5, hw: .5, hd: .5, rot: 0 };
const rotBox = { t: 'b', x: -4, z: 2, hw: 1.2, hd: .4, rot: Math.PI / 5 };
const circle = { t: 'c', x: 0, z: -6, r: .6 };
const all = [box, rotBox, circle];

// Points inside any collider get pushed out.
for (const c of all) {
  const r = resolve(c.x, c.z, all, .45);
  assert.equal(overlaps(r.x, r.z, all, .45), false, 'pushed point must be free: ' + JSON.stringify(c));
}
// Walking straight into a tree box never ends inside it, and slides along the side.
let x = 2, z = 5.2;
for (let i = 0; i < 80; i++) { ({ x, z } = resolve(x + .12, z, all, .45)); assert.equal(overlaps(x, z, all, .45), false); }
assert.ok(x < box.x - .9 || x > box.x + .9 || Math.abs(z - box.z) > .9, 'stays outside box');
// Dense random walk across the island: nothing ever ends overlapping.
let s = 1; const rnd = () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 20000; i++) {
  const p = resolve((rnd() - .5) * 20, (rnd() - .5) * 20, all, .45);
  assert.equal(overlaps(p.x, p.z, all, .45), false);
}
// Open ground is untouched.
assert.deepEqual(resolve(10, 10, all, .45), { x: 10, z: 10 });
// Steering pushes away from an obstacle on the right.
assert.ok(avoid(5.8, 5, [box], 2).x > 0);
console.log('collision tests passed');

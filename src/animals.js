import * as THREE from 'three';
import { resolve } from './collision.js';
import { STREAM_SAMPLES } from './terrain.js';

const TAU = Math.PI * 2, lerp = THREE.MathUtils.lerp;
const makeRand = (seed) => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const mat = (c, r = .85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
const add = (p, g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; p.add(o); return o; };
const sph = (r) => new THREE.SphereGeometry(r, 14, 10);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 8);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const GROUND = -.1;

function makeRabbit(rnd) {
  const g = new THREE.Group(), fur = mat([0xb89b7a, 0xe8e2d6, 0x8a7360, 0xcfc4b0][Math.floor(rnd() * 4)]), pale = mat(0xf2eee6);
  const body = new THREE.Group(); g.add(body);
  add(body, sph(.26), fur, 0, .3, 0, 1, .85, 1.35); add(body, sph(.2), fur, 0, .3, -.2, 1.05, 1, 1.0);
  const head = new THREE.Group(); head.position.set(0, .42, .3); body.add(head);
  add(head, sph(.15), fur, 0, 0, 0, 1, .95, 1.15); add(head, sph(.03), mat(0xe58a99), 0, -.01, .17);
  [-1, 1].forEach(s => { add(head, sph(.02), mat(0x111111), s * .08, .04, .12); const e = add(head, cap(.045, .2), fur, s * .06, .2, -.02); e.rotation.z = -s * .18; e.rotation.x = -.15; });
  add(body, sph(.075), pale, 0, .3, -.4);
  [-1, 1].forEach(s => add(body, cap(.045, .1), fur, s * .12, .1, .2));
  return { g, body, head, kind: 'rabbit', speed: 1.7, flee: 6.5, fleeSpeed: 5.2, radius: .3, phase: rnd() * 9 };
}
function makeDeer(rnd) {
  const g = new THREE.Group(), fur = mat(0xa8713f), belly = mat(0xd9b88a), dark = mat(0x3a2a1e), horn = mat(0xcbbf9d);
  const body = new THREE.Group(); g.add(body);
  const torso = add(body, cap(.3, .75), fur, 0, 1.15, 0); torso.rotation.x = Math.PI / 2;
  add(body, sph(.28), belly, 0, 1.02, .1, 1, .8, 1.6);
  add(body, sph(.07), pale(), 0, 1.35, -.62);
  const neck = new THREE.Group(); neck.position.set(0, 1.3, .55); body.add(neck);
  const n = add(neck, cap(.12, .45), fur, 0, .25, .15); n.rotation.x = .55;
  const head = new THREE.Group(); head.position.set(0, .55, .38); neck.add(head);
  add(head, sph(.16), fur, 0, 0, 0, 1, .95, 1.5); add(head, sph(.065), dark, 0, -.04, .28);
  [-1, 1].forEach(s => {
    add(head, sph(.025), mat(0x111111), s * .1, .06, .12);
    const e = add(head, cap(.04, .14), fur, s * .16, .12, -.08); e.rotation.z = -s * 1.0;
    if (rnd() < .8) { const a = add(head, new THREE.CylinderGeometry(.015, .025, .45, 5), horn, s * .08, .34, -.08); a.rotation.z = -s * .25; const b = add(head, new THREE.CylinderGeometry(.01, .018, .22, 5), horn, s * .17, .42, -.02); b.rotation.z = -s * .75; }
  });
  const legs = [[-1, .3], [1, .3], [-1, -.35], [1, -.35]].map(([sx, z]) => {
    const l = new THREE.Group(); l.position.set(sx * .17, 1.0, z); body.add(l);
    add(l, new THREE.CylinderGeometry(.06, .045, .5, 6), fur, 0, -.25, 0); add(l, new THREE.CylinderGeometry(.04, .03, .5, 6), dark, 0, -.7, 0); add(l, sph(.045), dark, 0, -.97, .02);
    return l;
  });
  return { g, body, head: neck, legs, kind: 'deer', speed: .95, flee: 9, fleeSpeed: 4.2, radius: .7, phase: rnd() * 9 };
}
function pale() { return mat(0xf4efe6); }

function makeBird(rnd, tone) {
  const g = new THREE.Group(), m = mat(tone, .7), wingM = new THREE.MeshStandardMaterial({ color: tone, roughness: .8, side: THREE.DoubleSide });
  add(g, sph(.14), m, 0, 0, 0, .8, .75, 1.7); add(g, sph(.085), m, 0, .04, .26); add(g, new THREE.ConeGeometry(.025, .09, 5), mat(0xf2a33a), 0, .03, .36, 1, 1, 1).rotation.x = Math.PI / 2;
  add(g, new THREE.BoxGeometry(.12, .015, .2), m, 0, 0, -.3);
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .08, .03, .02); g.add(w); const p = add(w, new THREE.BoxGeometry(.5, .012, .2), wingM, s * .25, 0, 0); p.castShadow = false; return w; });
  return { g, wings };
}
function makeButterfly(color) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); g.add(w); const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .16), m); p.rotation.x = -Math.PI / 2; p.position.x = s * .1; w.add(p); return w; });
  add(g, new THREE.CylinderGeometry(.012, .012, .12, 5), mat(0x222222), 0, 0, 0).rotation.x = Math.PI / 2;
  return { g, wings };
}
function makeFish(rnd) {
  const g = new THREE.Group(), c = [0xff8a3d, 0xd9dde0, 0xffc83d, 0xe56b4a][Math.floor(rnd() * 4)], m = mat(c, .5);
  add(g, sph(.13), m, 0, 0, 0, .6, .55, 1.6);
  const tail = new THREE.Group(); tail.position.z = -.2; g.add(tail); const t = add(tail, new THREE.ConeGeometry(.08, .16, 4), m, 0, 0, -.07); t.rotation.x = -Math.PI / 2; t.scale.x = .3;
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { g, tail };
}

export function buildAnimals(parent, { colliders, isFree, anchors = [], mobile = false, reduced = false }) {
  const rnd = makeRand(31337), group = new THREE.Group(); parent.add(group);
  const ground = [];
  const spawnPoint = () => { for (let i = 0; i < 80; i++) { const a = rnd() * TAU, r = 8 + rnd() * 22, x = Math.cos(a) * r, z = Math.sin(a) * r; if (isFree(x, z, .8)) return { x, z }; } return null; };
  const addGround = (m) => { const p = spawnPoint(); if (!p) return; m.g.position.set(p.x, GROUND, p.z); m.g.rotation.y = rnd() * TAU; group.add(m.g); Object.assign(m, { x: p.x, z: p.z, heading: m.g.rotation.y, state: 'idle', timer: rnd() * 3, tx: p.x, tz: p.z, moved: 0 }); ground.push(m); };
  for (let i = 0; i < (mobile ? 4 : 7); i++) addGround(makeRabbit(rnd));
  for (let i = 0; i < (mobile ? 2 : 3); i++) addGround(makeDeer(rnd));

  const birds = [];
  for (let i = 0; i < (mobile ? 6 : 11); i++) {
    const b = makeBird(rnd, [0xf4f4ee, 0xe9e6dc, 0x9aa3ad, 0xf0efe8][i % 4]); group.add(b.g);
    Object.assign(b, { r: 20 + (i % 3) * 7 + rnd() * 3, w: (i % 2 ? 1 : -1) * (.1 + .02 * (i % 4)), a: rnd() * TAU, h: 11 + rnd() * 6, ph: rnd() * 9 }); birds.push(b);
  }
  const butterflies = [];
  const cols = [0xffc83d, 0xff8a5b, 0x7ee0ff, 0xf6a6d8, 0xffffff];
  for (let i = 0; i < (mobile ? 8 : 16); i++) {
    const b = makeButterfly(cols[i % cols.length]), an = anchors.length ? anchors[i % anchors.length] : { x: 0, z: -15, spread: 4 }; group.add(b.g);
    Object.assign(b, { an, p: rnd() * 9, sp: .5 + rnd() * .6, rr: an.spread + 1 + rnd() * 2, hh: .8 + rnd() * 1.4, px: 0, pz: 0 }); butterflies.push(b);
  }
  const fishes = [];
  for (let i = 0; i < 8; i++) { const f = makeFish(rnd); group.add(f.g); Object.assign(f, { s: rnd() * (STREAM_SAMPLES.length - 8) + 2, dir: rnd() < .5 ? 1 : -1, v: 4 + rnd() * 5, off: (rnd() - .5) * 1.1, ph: rnd() * 9 }); fishes.push(f); }

  const pickTarget = (m, px, pz, fleeing) => {
    for (let i = 0; i < 14; i++) {
      let x, z;
      if (fleeing) { const dx = m.x - px, dz = m.z - pz, d = Math.hypot(dx, dz) || 1, a = Math.atan2(dz, dx) + (rnd() - .5) * 1.2, r = 8 + rnd() * 5; x = m.x + Math.cos(a) * r * (1 + 0 * d); z = m.z + Math.sin(a) * r; }
      else { const a = rnd() * TAU, r = 3 + rnd() * 9; x = m.x + Math.cos(a) * r; z = m.z + Math.sin(a) * r; }
      if (isFree(x, z, .5)) { m.tx = x; m.tz = z; return true; }
    }
    return false;
  };

  function update(time, dt, on, player) {
    const day = on < .55;
    for (const m of ground) {
      const dp = Math.hypot(m.x - player.x, m.z - player.z), fleeing = dp < m.flee;
      if (fleeing && m.state !== 'flee') { m.state = pickTarget(m, player.x, player.z, true) ? 'flee' : 'idle'; }
      if (m.state === 'flee' && dp > m.flee + 4) { m.state = 'idle'; m.timer = 1 + rnd() * 2; }
      if (m.state === 'idle') { m.timer -= dt; if (m.timer < 0) { if (pickTarget(m, player.x, player.z, false)) m.state = 'walk'; else m.timer = 2; } }
      let moving = false;
      if (m.state === 'walk' || m.state === 'flee') {
        const dx = m.tx - m.x, dz = m.tz - m.z, d = Math.hypot(dx, dz);
        if (d < .4) { m.state = 'idle'; m.timer = 1.5 + rnd() * 4; }
        else {
          const want = Math.atan2(dx, dz), turn = angDiff(m.heading, want);
          m.heading += Math.sign(turn) * Math.min(Math.abs(turn), dt * (m.state === 'flee' ? 7 : 3.2));
          const speed = (m.state === 'flee' ? m.fleeSpeed : m.speed) * (Math.abs(turn) > 1 ? .25 : 1);
          const nx = m.x + Math.sin(m.heading) * speed * dt, nz = m.z + Math.cos(m.heading) * speed * dt;
          if (!isFree(nx, nz, .2)) { m.state = 'idle'; m.timer = .8; }
          else { const r = resolve(nx, nz, colliders, m.radius); m.moved = Math.hypot(r.x - m.x, r.z - m.z) / (speed * dt || 1); if (m.moved < .35) { m.state = 'idle'; m.timer = .6; } m.x = r.x; m.z = r.z; moving = true; }
        }
      }
      m.g.position.set(m.x, GROUND, m.z); m.g.rotation.y = m.heading;
      if (m.kind === 'rabbit') {
        m.phase += dt * (moving ? (m.state === 'flee' ? 13 : 9) : 0);
        const hop = moving ? Math.max(0, Math.sin(m.phase)) : 0;
        m.body.position.y = hop * (m.state === 'flee' ? .38 : .24); m.body.rotation.x = moving ? Math.cos(m.phase) * -.25 : 0;
        m.head.rotation.x = moving ? 0 : Math.sin(time * 9 + m.x) * .06 + (Math.sin(time * .7 + m.z) > .7 ? .5 : 0);
      } else {
        m.phase += dt * (moving ? (m.state === 'flee' ? 9 : 4.2) : 0);
        const s = Math.sin(m.phase) * (m.state === 'flee' ? .7 : .45);
        m.legs[0].rotation.x = s; m.legs[3].rotation.x = s; m.legs[1].rotation.x = -s; m.legs[2].rotation.x = -s;
        m.body.position.y = moving ? Math.abs(Math.sin(m.phase)) * .04 : 0;
        const graze = !moving && Math.sin(time * .25 + m.x * 3) > .15;
        m.head.rotation.x = lerp(m.head.rotation.x, graze ? 1.0 : (moving ? .1 : Math.sin(time * 1.2) * .05), Math.min(1, dt * 3));
      }
    }
    for (const b of birds) {
      b.g.visible = day;
      if (!day) continue;
      b.a += b.w * dt; const x = Math.cos(b.a) * b.r, z = Math.sin(b.a) * b.r, y = b.h + Math.sin(time * .5 + b.ph) * 1.1, sg = Math.sign(b.w);
      b.g.position.set(x, y, z); b.g.rotation.y = Math.atan2(-Math.sin(b.a) * sg, Math.cos(b.a) * sg); b.g.rotation.z = -sg * .35;
      const f = reduced ? 0 : Math.sin(time * 9 + b.ph) * .65;
      b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
    }
    for (const b of butterflies) {
      b.g.visible = day;
      if (!day) continue;
      const t = time * b.sp + b.p, x = b.an.x + Math.sin(t * 1.3) * b.rr, z = b.an.z + Math.cos(t * .9) * b.rr, y = b.hh + Math.sin(t * 2.1) * .35;
      const dx = x - b.px, dz = z - b.pz; if (dx * dx + dz * dz > 1e-6) b.g.rotation.y = Math.atan2(dx, dz); b.px = x; b.pz = z;
      b.g.position.set(x, y, z);
      const f = reduced ? .3 : Math.sin(time * 16 + b.p * 3) * .9;
      b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
    }
    for (const f of fishes) {
      f.s += f.dir * f.v * dt * .6; if (f.s < 2) { f.s = 2; f.dir = 1; } if (f.s > STREAM_SAMPLES.length - 4) { f.s = STREAM_SAMPLES.length - 4; f.dir = -1; }
      const i = Math.floor(f.s), fr = f.s - i, a = STREAM_SAMPLES[i], b = STREAM_SAMPLES[i + 1];
      let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const off = f.off + Math.sin(time * 1.4 + f.ph) * .35, x = lerp(a.x, b.x, fr) - tz * off, z = lerp(a.z, b.z, fr) + tx * off;
      f.g.position.set(x, -.1, z); f.g.rotation.y = Math.atan2(tx * f.dir, tz * f.dir) + Math.cos(time * 1.4 + f.ph) * .3 * .35;
      f.tail.rotation.y = reduced ? 0 : Math.sin(time * 9 + f.ph) * .6;
    }
  }
  return { update, counts: { ground: ground.length, birds: birds.length, butterflies: butterflies.length, fish: fishes.length } };
}

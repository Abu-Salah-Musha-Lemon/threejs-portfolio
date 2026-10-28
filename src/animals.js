import * as THREE from 'three';
import { resolve } from './collision.js';
import { STREAM_SAMPLES } from './terrain.js';
import { canvasTex, makeRand } from './plants.js';

const TAU = Math.PI * 2, lerp = THREE.MathUtils.lerp;
const mat = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
const add = (p, g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; p.add(o); return o; };
const sph = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);
const cyl = (r1, r2, l, s = 7) => new THREE.CylinderGeometry(r1, r2, l, s);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const GROUND = -.1;
const eye = (p, x, y, z, r = .02) => { const e = add(p, sph(r, 10, 8), mat(0x050505, .15, { metalness: .3 }), x, y, z); e.castShadow = false; const h = add(p, sph(r * .35, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), x + Math.sign(x) * r * .15, y + r * .4, z + r * .6); h.castShadow = false; };

// ---------- textures (made once) ----------
let TEX = null;
function textures(rnd) {
  if (TEX) return TEX;
  const spots = (base, spot, n, rMin, rMax) => canvasTex(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * .06})`; g.fillRect(rnd() * w, rnd() * h, 2, 3); }
    g.fillStyle = spot; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h * .85, rMin + rnd() * (rMax - rMin), (rMin + rnd() * (rMax - rMin)) * .7, rnd() * 3, 0, TAU); g.fill(); }
  });
  const fur = (c1, c2) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.strokeStyle = rnd() < .5 ? c2 : 'rgba(255,255,255,.25)'; g.lineWidth = 1; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y + 4 + rnd() * 5); g.stroke(); } });
  const tiger = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#e18a2b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(120,50,0,${rnd() * .08})`; g.fillRect(rnd() * w, rnd() * h, 3, 4); }
    g.fillStyle = '#16100c';
    for (let i = 0; i < 26; i++) { const y = (i + .5) / 26 * h + (rnd() - .5) * 3, x0 = rnd() * w * .15, len = w * (.35 + rnd() * .5), th = 3 + rnd() * 5; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + len * .5, y + (rnd() - .5) * 14, x0 + len, y + (rnd() - .5) * 6); g.quadraticCurveTo(x0 + len * .5, y + th + (rnd() - .5) * 14, x0, y + th * .3); g.fill(); const x1 = w * .55 + rnd() * w * .2; g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo(x1 + len * .4, y + (rnd() - .5) * 12, x1 + len * .6, y + (rnd() - .5) * 6); g.quadraticCurveTo(x1 + len * .3, y + th + (rnd() - .5) * 10, x1, y + th * .3); g.fill(); }
  });
  TEX = { deer: spots(['#c8803f', '#d9a26a'], 'rgba(255,248,236,.92)', 90, 3, 6), fawn: spots(['#c27a3c', '#d49a62'], 'rgba(255,248,236,.95)', 70, 3, 6), rabbitC: fur('#e9c690', 'rgba(150,100,50,.3)'), rabbitW: fur('#f0e6d4', 'rgba(170,140,100,.3)'), rabbitO: fur('#dba569', 'rgba(130,80,30,.32)'), tiger };
  return TEX;
}

// ---------- ground animals ----------
function makeRabbit(rnd) {
  const T = textures(rnd), tex = [T.rabbitC, T.rabbitW, T.rabbitO, T.rabbitC][Math.floor(rnd() * 4)];
  const g = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: .95 }), pale = mat(0xf6efe3, .95);
  const body = new THREE.Group(); g.add(body);
  add(body, sph(.3, 18, 14), fur, 0, .3, -.02, 1, 1.05, 1.12); add(body, sph(.22), pale, 0, .26, .17, .85, .95, .55);
  const head = new THREE.Group(); head.position.set(0, .5, .2); body.add(head);
  add(head, sph(.2, 16, 12), fur, 0, 0, 0, 1, .95, 1.05); [-1, 1].forEach(s => { add(head, sph(.11), fur, s * .1, -.05, .1); eye(head, s * .115, .04, .13, .036); });
  add(head, sph(.03), mat(0xe58a99, .5), 0, -.03, .2, 1.1, .8, .8);
  [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { const w = add(head, cyl(.003, .002, .22, 3), mat(0xffffff, .5), s * .13, -.04 - i * .012, .16); w.rotation.z = Math.PI / 2 + s * (-.15 + i * .15); w.rotation.y = s * (.3 - i * .12); w.castShadow = false; } });
  const ears = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * .07, .17, -.02); head.add(e); e.rotation.z = -s * .16; e.rotation.x = -.1; add(e, new THREE.CapsuleGeometry(.05, .24, 4, 8), fur, 0, .17, 0, .8, 1, .45); add(e, new THREE.CapsuleGeometry(.032, .2, 4, 8), mat(0xf0a6b2, .8), 0, .17, .02, .8, 1, .35); return e; });
  add(body, sph(.085), pale, 0, .27, -.34); [-1, 1].forEach(s => { add(body, new THREE.CapsuleGeometry(.04, .1, 4, 6), fur, s * .09, .09, .2); add(body, sph(.1), fur, s * .17, .12, -.12, .7, 1, 1.5); });
  return { g, body, head, ears, kind: 'rabbit', speed: 1.7, flee: 6.5, fleeSpeed: 5.2, radius: .3, phase: rnd() * 9 };
}

function makeDeer(rnd, type) {
  const T = textures(rnd), fawn = type === 'fawn', stag = type === 'stag', s = fawn ? .55 : stag ? 1.08 : 1;
  const g = new THREE.Group(), coat = new THREE.MeshStandardMaterial({ map: fawn ? T.fawn : T.deer, roughness: .9 }), tan = mat(0xcf9a62, .9), cream = mat(0xf0e2cc, .9), dark = mat(0x2b211a, .7), velvet = mat(0xd9a58c, .8), pink = mat(0xe9a7a0, .8);
  const body = new THREE.Group(); g.add(body); g.scale.setScalar(s);
  add(body, sph(.4, 20, 14), coat, 0, 1.05, 0, .52, .5, 1.12); add(body, sph(.27), coat, 0, 1.08, -.4, 1, 1.05, .95); add(body, sph(.2), cream, 0, .92, .0, .8, .55, 1.6); add(body, sph(.24), coat, 0, 1.12, .38, .9, 1, .9);
  const tail = add(body, new THREE.ConeGeometry(.07, .2, 6), tan, 0, 1.1, -.68); tail.rotation.x = -Math.PI / 2 - .6; add(body, sph(.05), cream, 0, 1.04, -.66, 1, 1.2, .8);
  const neck = new THREE.Group(); neck.position.set(0, 1.2, .5); body.add(neck);
  const nk = add(neck, new THREE.CapsuleGeometry(.11, .5, 4, 10), tan, 0, .26, .12, 1, 1, 1); nk.rotation.x = .62; add(neck, sph(.1), cream, 0, .12, .18, 1, 1.4, 1);
  const head = new THREE.Group(); head.position.set(0, .55, .32); neck.add(head);
  add(head, sph(.13, 14, 10), tan, 0, 0, .0, 1, .95, 1.5); add(head, sph(.07), dark, 0, -.045, .28, 1, .8, 1); add(head, sph(.05), cream, 0, -.07, .18, 1.3, .7, 1.1);
  [-1, 1].forEach(sd => { eye(head, sd * .1, .04, .1, .028); const e = add(head, sph(.09), tan, sd * .17, .1, -.1, .38, 1.15, .6); e.rotation.z = -sd * .9; const ei = add(head, sph(.07), pink, sd * .17, .1, -.09, .22, .95, .45); ei.rotation.z = -sd * .9; ei.castShadow = false; });
  if (stag) [-1, 1].forEach(sd => { const a = add(head, cyl(.02, .032, .55, 6), velvet, sd * .08, .38, -.1); a.rotation.z = -sd * .28; const b = add(head, cyl(.014, .022, .3, 6), velvet, sd * .2, .54, -.04); b.rotation.z = -sd * .6; b.rotation.x = .25; const c = add(head, cyl(.01, .018, .22, 6), velvet, sd * .1, .3, .08); c.rotation.z = -sd * .1; c.rotation.x = .9; });
  const legs = [[-1, .34, 0], [1, .34, 0], [-1, -.36, 1], [1, -.36, 1]].map(([sx, z, hind]) => {
    const l = new THREE.Group(); l.position.set(sx * .17, 1.0, z); body.add(l);
    const u = add(l, cyl(.065, .045, .52, 7), coat, 0, -.26, 0); u.rotation.x = hind ? .12 : 0; add(l, sph(.045), tan, 0, -.52, hind ? .03 : 0);
    const lo = new THREE.Group(); lo.position.set(0, -.52, hind ? .03 : 0); l.add(lo); add(lo, cyl(.04, .03, .5, 6), tan, 0, -.25, 0); add(lo, sph(.045, 8, 6), dark, 0, -.5, .02, 1, .8, 1.4);
    return l;
  });
  return { g, body, head: neck, legs, kind: 'deer', type, speed: fawn ? 1.2 : .95, flee: 9, fleeSpeed: fawn ? 4.6 : 4.2, radius: fawn ? .35 : .7, phase: rnd() * 9 };
}

function makeTiger(rnd) {
  const T = textures(rnd), skin = new THREE.MeshStandardMaterial({ map: T.tiger, roughness: .85 }), orange = mat(0xe08a2b, .85), cream = mat(0xf4ead8, .9), black = mat(0x16110d, .8);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const tb = add(body, new THREE.CapsuleGeometry(.32, 1.0, 6, 14), skin, 0, .95, 0, 1.0, 1.0, 1.02); tb.rotation.x = Math.PI / 2;
  add(body, sph(.3), skin, 0, 1.0, .55, 1, 1.05, 1.05); add(body, sph(.28), skin, 0, .98, -.55, 1.05, 1.0, 1.0); add(body, sph(.26), cream, 0, .72, .0, .95, .5, 3.2);
  const neck = new THREE.Group(); neck.position.set(0, 1.0, .75); body.add(neck);
  add(neck, new THREE.CapsuleGeometry(.2, .2, 4, 10), skin, 0, -.05, .1, 1, 1, 1).rotation.x = 1.2;
  const head = new THREE.Group(); head.position.set(0, -.08, .34); neck.add(head);
  add(head, sph(.24, 16, 12), skin, 0, 0, 0, 1.05, .92, 1.0); add(head, sph(.13), cream, 0, -.07, .2, 1.1, .8, .9); add(head, sph(.045), mat(0xd77f86, .5), 0, -.02, .31, 1.2, .8, .8);
  [-1, 1].forEach(s => { add(head, sph(.11), cream, s * .17, -.05, .08, .8, .8, .9); eye(head, s * .105, .07, .21, .026); const e = add(head, sph(.07), black, s * .15, .21, -.07, 1, 1, .45); add(head, sph(.04), cream, s * .15, .21, -.03, 1, 1, .4); e.rotation.z = -s * .3; for (let k = 0; k < 4; k++) { const w = add(head, cyl(.003, .002, .3, 3), mat(0xffffff, .5), s * .2, -.06 - k * .014, .22); w.rotation.z = Math.PI / 2 + s * (-.1 + k * .12); w.rotation.y = s * (.2 - k * .08); w.castShadow = false; } });
  const legs = [[-1, .6, 0], [1, .6, 0], [-1, -.55, 1], [1, -.55, 1]].map(([sx, z, hind]) => {
    const l = new THREE.Group(); l.position.set(sx * .24, .85, z); body.add(l);
    add(l, cyl(.13, .1, .5, 8), skin, 0, -.22, 0); const lo = new THREE.Group(); lo.position.set(0, -.45, 0); l.add(lo); add(lo, cyl(.095, .085, .42, 8), orange, 0, -.2, 0); add(lo, sph(.115), cream, 0, -.42, .05, 1, .7, 1.3);
    return l;
  });
  const tailPts = [[0, 0, 0], [0, .1, -.3], [0, .25, -.6], [0, .22, -.95], [0, .1, -1.2]].map(p => new THREE.Vector3(...p));
  const tail = new THREE.Group(); tail.position.set(0, 1.0, -.8); body.add(tail);
  add(tail, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 16, .06, 8), orange);
  const crv = new THREE.CatmullRomCurve3(tailPts); for (let i = 1; i < 8; i++) { const p = crv.getPointAt(i / 8.4), r = add(tail, new THREE.TorusGeometry(.064, .018, 6, 10), black, p.x, p.y, p.z); r.rotation.y = Math.PI / 2 - .3; r.castShadow = false; }
  add(tail, sph(.07), black, tailPts[4].x, tailPts[4].y, tailPts[4].z);
  g.scale.setScalar(1.05);
  return { g, body, head: neck, legs, tail, kind: 'tiger', speed: 1.0, flee: 10, fleeSpeed: 2.3, radius: .8, phase: rnd() * 9 };
}

// ---------- birds, butterflies, fish ----------
function wingGeometry(rnd) {
  const sh = new THREE.Shape();
  [[0, -.12], [.35, -.2], [.75, -.16], [1, -.03], [.93, .1], [.82, .06], [.74, .2], [.62, .13], [.52, .27], [.4, .19], [.27, .3], [.13, .2], [0, .18]].forEach(([x, z], i) => i ? sh.lineTo(x, z) : sh.moveTo(x, z));
  const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    if (x < .3) c.setHex(0x1f9db5); else if (z > .1 && x < .62) c.setHex(0xf1dca0); else if (x < .55 && z < .06) c.setHex(0xf39a1e); else c.setHex(0x12264a);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
let WING = null;
function makeBird(rnd) {
  WING = WING || wingGeometry(rnd);
  const g = new THREE.Group(), teal = mat(0x1f9db5, .6), navy = mat(0x12264a, .6), orange = mat(0xf39a1e, .6), wm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, side: THREE.DoubleSide });
  g.scale.setScalar(1.7);
  add(g, sph(.1), teal, 0, 0, 0, .85, .8, 1.9); add(g, sph(.08), orange, 0, -.035, .1, .8, .8, 1.3); add(g, sph(.065), navy, 0, .03, .26);
  const bk = add(g, new THREE.ConeGeometry(.018, .09, 5), mat(0x15171c, .5), 0, .02, .34); bk.rotation.x = Math.PI / 2; add(g, sph(.012, 6, 4), mat(0xffd08a, .3), .03, .05, .3);
  const tail = new THREE.Shape(); [[-.02, 0], [-.1, -.3], [-.04, -.34], [0, -.36], [.04, -.34], [.1, -.3], [.02, 0]].forEach(([x, y], i) => i ? tail.lineTo(x, y) : tail.moveTo(x, y));
  const tg = new THREE.ShapeGeometry(tail); tg.rotateX(-Math.PI / 2); const tm = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0x1b4f8a, roughness: .7, side: THREE.DoubleSide })); tm.position.set(0, 0, -.1); tm.scale.setScalar(.9); g.add(tm);
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .06, .03, .02); g.add(w); const m = new THREE.Mesh(WING, wm); m.scale.set(s * .62, 1, .8); m.castShadow = false; w.add(m); return w; });
  return { g, wings };
}
function makeButterfly(color) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); g.add(w); const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .16), m); p.rotation.x = -Math.PI / 2; p.position.x = s * .1; w.add(p); return w; });
  add(g, cyl(.012, .012, .12, 5), mat(0x222222), 0, 0, 0).rotation.x = Math.PI / 2;
  return { g, wings };
}
function makeFish(rnd) {
  const g = new THREE.Group(), c = [0xff8a3d, 0xd9dde0, 0xffc83d, 0xe56b4a][Math.floor(rnd() * 4)], m = mat(c, .5);
  add(g, sph(.13), m, 0, 0, 0, .6, .55, 1.6);
  const tail = new THREE.Group(); tail.position.z = -.2; g.add(tail); const t = add(tail, new THREE.ConeGeometry(.08, .16, 4), m, 0, 0, -.07); t.rotation.x = -Math.PI / 2; t.scale.x = .3;
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { g, tail };
}

export function buildAnimals(parent, { colliders, isFree, anchors = [], forest, mobile = false, reduced = false }) {
  const rnd = makeRand(31337), group = new THREE.Group(); parent.add(group);
  const ground = [];
  const spawn = (home) => {
    for (let i = 0; i < 120; i++) {
      let x, z;
      if (home) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * home.r * .85; x = home.x + Math.cos(a) * r; z = home.z + Math.sin(a) * r; }
      else { const a = rnd() * TAU, r = 8 + rnd() * 22; x = Math.cos(a) * r; z = Math.sin(a) * r; }
      if (isFree(x, z, .8)) return { x, z };
    }
    return null;
  };
  const addGround = (m, home) => {
    const p = spawn(home); if (!p) return null;
    m.g.position.set(p.x, GROUND, p.z); m.g.rotation.y = rnd() * TAU; group.add(m.g);
    Object.assign(m, { x: p.x, z: p.z, heading: m.g.rotation.y, state: 'idle', timer: rnd() * 3, tx: p.x, tz: p.z, moved: 0, home });
    ground.push(m); return m;
  };
  for (let i = 0; i < (mobile ? 4 : 8); i++) addGround(makeRabbit(rnd));
  const doe = addGround(makeDeer(rnd, 'doe'), forest), stag = addGround(makeDeer(rnd, 'stag'), forest);
  if (!mobile) { const f = addGround(makeDeer(rnd, 'fawn'), forest); if (f && doe) f.follow = doe; const s2 = addGround(makeDeer(rnd, 'stag'), forest); }
  if (forest) addGround(makeTiger(rnd), forest);

  const birds = [];
  for (let i = 0; i < (mobile ? 6 : 10); i++) {
    const b = makeBird(rnd); group.add(b.g);
    Object.assign(b, { r: 20 + (i % 3) * 7 + rnd() * 3, w: (i % 2 ? 1 : -1) * (.1 + .02 * (i % 4)), a: rnd() * TAU, h: 11 + rnd() * 6, ph: rnd() * 9 }); birds.push(b);
  }
  const butterflies = [], cols = [0xffc83d, 0xff8a5b, 0x7ee0ff, 0xf6a6d8, 0xffffff];
  for (let i = 0; i < (mobile ? 8 : 16); i++) {
    const b = makeButterfly(cols[i % cols.length]), an = anchors.length ? anchors[i % anchors.length] : { x: 0, z: -15, spread: 4 }; group.add(b.g);
    Object.assign(b, { an, p: rnd() * 9, sp: .5 + rnd() * .6, rr: an.spread + 1 + rnd() * 2, hh: .8 + rnd() * 1.4, px: 0, pz: 0 }); butterflies.push(b);
  }
  const fishes = [];
  for (let i = 0; i < 8; i++) { const f = makeFish(rnd); group.add(f.g); Object.assign(f, { s: rnd() * (STREAM_SAMPLES.length - 8) + 2, dir: rnd() < .5 ? 1 : -1, v: 4 + rnd() * 5, off: (rnd() - .5) * 1.1, ph: rnd() * 9 }); fishes.push(f); }

  const pickTarget = (m, px, pz, fleeing) => {
    for (let i = 0; i < 24; i++) {
      let x, z;
      if (m.follow) { const a = rnd() * TAU; x = m.follow.x + Math.cos(a) * 1.8; z = m.follow.z + Math.sin(a) * 1.8; }
      else if (fleeing) { const a = Math.atan2(m.z - pz, m.x - px) + (rnd() - .5) * 1.4, r = 6 + rnd() * 5; x = m.x + Math.cos(a) * r; z = m.z + Math.sin(a) * r; }
      else { const a = rnd() * TAU, r = 3 + rnd() * 9; x = m.x + Math.cos(a) * r; z = m.z + Math.sin(a) * r; }
      if (m.home && Math.hypot(x - m.home.x, z - m.home.z) > m.home.r) continue;
      if (isFree(x, z, .5)) { m.tx = x; m.tz = z; return true; }
    }
    return false;
  };

  function update(time, dt, on, player) {
    const day = on < .55;
    for (const m of ground) {
      const dp = Math.hypot(m.x - player.x, m.z - player.z), fleeing = !m.follow && dp < m.flee;
      if (fleeing && m.state !== 'flee') m.state = pickTarget(m, player.x, player.z, true) ? 'flee' : 'idle';
      if (m.state === 'flee' && dp > m.flee + 4) { m.state = 'idle'; m.timer = 1 + rnd() * 2; }
      if (m.state === 'idle') {
        m.timer -= dt;
        if (m.follow && Math.hypot(m.x - m.follow.x, m.z - m.follow.z) > 2.8) { if (pickTarget(m, player.x, player.z, false)) m.state = 'walk'; }
        else if (m.timer < 0) { if (pickTarget(m, player.x, player.z, false)) m.state = 'walk'; else m.timer = 2; }
      }
      let moving = false;
      if (m.state === 'walk' || m.state === 'flee') {
        const dx = m.tx - m.x, dz = m.tz - m.z, d = Math.hypot(dx, dz);
        if (d < .4) { m.state = 'idle'; m.timer = 1.5 + rnd() * 4; }
        else {
          const want = Math.atan2(dx, dz), turn = angDiff(m.heading, want);
          m.heading += Math.sign(turn) * Math.min(Math.abs(turn), dt * (m.state === 'flee' ? 6 : 2.6));
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
        m.head.rotation.x = moving ? 0 : Math.sin(time * 9 + m.x) * .05 + (Math.sin(time * .7 + m.z) > .7 ? .4 : 0);
        m.head.scale.setScalar(1 + (moving ? 0 : Math.sin(time * 12 + m.x) * .012));
        m.ears.forEach((e, i) => { e.rotation.x = -.1 + (moving ? -.5 : Math.sin(time * 1.3 + i + m.z) * .1 + (Math.sin(time * .5 + m.x * 3) > .92 ? .3 : 0)); });
      } else if (m.kind === 'deer') {
        m.phase += dt * (moving ? (m.state === 'flee' ? 9 : 4.2) : 0);
        const s = Math.sin(m.phase) * (m.state === 'flee' ? .7 : .45);
        m.legs[0].rotation.x = s; m.legs[3].rotation.x = s; m.legs[1].rotation.x = -s; m.legs[2].rotation.x = -s;
        m.body.position.y = moving ? Math.abs(Math.sin(m.phase)) * .04 : 0;
        const graze = !moving && Math.sin(time * .25 + m.x * 3) > .15;
        m.head.rotation.x = lerp(m.head.rotation.x, graze ? 1.0 : (moving ? .1 : Math.sin(time * 1.2) * .05), Math.min(1, dt * 3));
      } else {
        m.phase += dt * (moving ? 3.4 : 0);
        const s = Math.sin(m.phase) * .5;
        m.legs[0].rotation.x = s; m.legs[3].rotation.x = s; m.legs[1].rotation.x = -s; m.legs[2].rotation.x = -s;
        m.body.position.y = moving ? Math.abs(Math.sin(m.phase)) * .025 : 0; m.body.rotation.z = moving ? Math.sin(m.phase) * .03 : 0;
        m.head.rotation.x = lerp(m.head.rotation.x, moving ? .25 + Math.sin(m.phase * .5) * .05 : Math.sin(time * .8) * .06, Math.min(1, dt * 3));
        m.head.rotation.y = moving ? 0 : Math.sin(time * .35 + m.x) * .5;
        m.tail.rotation.y = Math.sin(time * 1.5 + m.phase) * .35; m.tail.rotation.x = -.2 + Math.sin(time * .9) * .08;
      }
    }
    for (const b of birds) {
      b.g.visible = day; if (!day) continue;
      b.a += b.w * dt; const x = Math.cos(b.a) * b.r, z = Math.sin(b.a) * b.r, y = b.h + Math.sin(time * .5 + b.ph) * 1.1, sg = Math.sign(b.w);
      b.g.position.set(x, y, z); b.g.rotation.y = Math.atan2(-Math.sin(b.a) * sg, Math.cos(b.a) * sg); b.g.rotation.z = -sg * .3;
      const f = reduced ? .3 : Math.sin(time * 8 + b.ph) * .7 + .15;
      b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
    }
    for (const b of butterflies) {
      b.g.visible = day; if (!day) continue;
      const t = time * b.sp + b.p, x = b.an.x + Math.sin(t * 1.3) * b.rr, z = b.an.z + Math.cos(t * .9) * b.rr, y = b.hh + Math.sin(t * 2.1) * .35;
      const dx = x - b.px, dz = z - b.pz; if (dx * dx + dz * dz > 1e-6) b.g.rotation.y = Math.atan2(dx, dz); b.px = x; b.pz = z;
      b.g.position.set(x, y, z); const f = reduced ? .3 : Math.sin(time * 16 + b.p * 3) * .9; b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
    }
    for (const f of fishes) {
      f.s += f.dir * f.v * dt * .6; if (f.s < 2) { f.s = 2; f.dir = 1; } if (f.s > STREAM_SAMPLES.length - 4) { f.s = STREAM_SAMPLES.length - 4; f.dir = -1; }
      const i = Math.floor(f.s), fr = f.s - i, a = STREAM_SAMPLES[i], b = STREAM_SAMPLES[i + 1];
      let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const off = f.off + Math.sin(time * 1.4 + f.ph) * .35, x = lerp(a.x, b.x, fr) - tz * off, z = lerp(a.z, b.z, fr) + tx * off;
      f.g.position.set(x, -.1, z); f.g.rotation.y = Math.atan2(tx * f.dir, tz * f.dir); f.tail.rotation.y = reduced ? 0 : Math.sin(time * 9 + f.ph) * .6;
    }
  }
  return { update, counts: { ground: ground.length, birds: birds.length, butterflies: butterflies.length, fish: fishes.length, tiger: ground.filter(m => m.kind === 'tiger').length } };
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { POND, PICNIC, PERCH, POND_ROCK } from './terrain.js';
import { makeWaterMaterial, updateWater } from './water.js';
import { windMaterial, tuftGeometry, fernGeometry, flowerGeometry, canvasTex, makeRand } from './plants.js';
import { getGlowTexture } from './lamps.js';

const TAU = Math.PI * 2, lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const mat = (c, r = .8, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
const part = (p, g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; p.add(o); return o; };
const sph = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);
const edgeF = (th) => 1 + .1 * Math.sin(3 * th + 1) + .06 * Math.sin(5 * th + 2);
const pondPt = (th, t) => ({ x: POND.x + Math.cos(th) * POND.rx * edgeF(th) * t, z: POND.z + Math.sin(th) * POND.rz * edgeF(th) * t });
const tube = (pts, r, seg = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 8);
const segment = (a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), o = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, d.length(), 7), m); o.position.copy(A).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; return o; };
const paintGeo = (g, c) => { const col = new THREE.Color(c), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = col.r; a[i + 1] = col.g; a[i + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };

function lotusGeometry() {
  const parts = [];
  const ring = (n, tilt, len, col, lift) => { for (let i = 0; i < n; i++) { const g = new THREE.SphereGeometry(.1, 8, 6); g.scale(.55, .22, 1.35 * len); g.translate(0, 0, .11 * len); g.rotateX(-tilt); g.rotateY((i / n) * TAU + tilt); g.translate(0, lift, 0); parts.push(paintGeo(g.toNonIndexed(), col)); } };
  ring(8, .75, 1, 0xf7a3c0, .02); ring(6, .45, .85, 0xff7fae, .05); ring(4, .2, .6, 0xff5f98, .08);
  const c = new THREE.SphereGeometry(.04, 8, 6); c.translate(0, .1, 0); parts.push(paintGeo(c.toNonIndexed(), 0xffd34d));
  return mergeGeometries(parts);
}

export function buildPond(parent, { colliders, nature, mobile = false, reduced = false }) {
  const rnd = makeRand(5051), group = new THREE.Group(); parent.add(group);
  const water = makeWaterMaterial(true), waters = [water];
  const wind = windMaterial(.2), reedMat = windMaterial(.2);

  // water surface + gravel and mud shore
  const R = 8, S = 64, pos = [], uv = [], idx = [];
  for (let k = 0; k <= R; k++) for (let s = 0; s <= S; s++) { const th = s / S * TAU, t = k / R, p = pondPt(th, t); pos.push(p.x, -.03, p.z); uv.push(t, s / S); }
  for (let k = 0; k < R; k++) for (let s = 0; s < S; s++) { const a = k * (S + 1) + s, b = a + 1, c = a + S + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); wg.setIndex(idx);
  const lake = new THREE.Mesh(wg, water); lake.renderOrder = 3; group.add(lake);
  const mudTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5d5644'; g.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { const v = 80 + rnd() * 110; g.fillStyle = `rgb(${v},${v - 6},${v - 16})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 5, 1.5 + rnd() * 3, rnd() * 3, 0, TAU); g.fill(); } }, [1, 1]);
  const sp = [], su = [], si = [], SR = 3;
  for (let k = 0; k <= SR; k++) for (let s = 0; s <= S; s++) { const th = s / S * TAU, t = lerp(.84, 1.7, k / SR), p = pondPt(th, t); sp.push(p.x, -.078, p.z); su.push(k / SR, s / S * 6); }
  for (let k = 0; k < SR; k++) for (let s = 0; s < S; s++) { const a = k * (S + 1) + s, b = a + 1, c = a + S + 1, d = c + 1; si.push(a, c, b, b, c, d); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(si);
  const shoreAlpha = canvasTex(64, 4, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(.45, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, [1, 1], false);
  const shore = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: mudTex, alphaMap: shoreAlpha, roughness: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  shore.renderOrder = 1; shore.receiveShadow = true; group.add(shore);

  // lily pads with pink lotus
  const padGeo = new THREE.CircleGeometry(.4, 16, .35, TAU - .7); padGeo.rotateX(-Math.PI / 2);
  const padCount = mobile ? 16 : 30, pads = new THREE.InstancedMesh(padGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .55, side: THREE.DoubleSide }), padCount);
  const lotusN = mobile ? 5 : 9, lotus = new THREE.InstancedMesh(lotusGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, side: THREE.DoubleSide }), lotusN);
  const o = new THREE.Object3D(), col = new THREE.Color(), pondInside = (th, t) => { const p = pondPt(th, t); return p; };
  for (let i = 0; i < padCount; i++) {
    const p = pondInside(rnd() * TAU, Math.sqrt(rnd()) * .86); o.position.set(p.x, -.012, p.z); o.rotation.set(0, rnd() * TAU, 0); o.scale.setScalar(.6 + rnd() * .8); o.updateMatrix();
    pads.setMatrixAt(i, o.matrix); pads.setColorAt(i, col.setHSL(.29 + rnd() * .05, .5, .2 + rnd() * .1));
    if (i < lotusN) { o.position.y = -.005; o.scale.setScalar(.9 + rnd() * .5); o.rotation.set(0, rnd() * TAU, 0); o.updateMatrix(); lotus.setMatrixAt(i, o.matrix); }
  }
  group.add(pads, lotus);

  // shore life: reeds, mossy rocks, grass, ferns, daisies
  const reeds = new THREE.InstancedMesh((() => { const g = new THREE.ConeGeometry(.035, 1.2, 4, 1); g.translate(0, .6, 0); return g; })(), reedMat, mobile ? 50 : 100);
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.4, 0), new THREE.MeshStandardMaterial({ roughness: .95, flatShading: true }), 36);
  const tufts = new THREE.InstancedMesh(tuftGeometry(rnd, .55), wind, mobile ? 120 : 260);
  const ferns = new THREE.InstancedMesh(fernGeometry(rnd), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8, side: THREE.DoubleSide }), 10);
  const daisies = new THREE.InstancedMesh(flowerGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7, side: THREE.DoubleSide }), 40);
  const cnt = { e: 0, r: 0, t: 0, f: 0, d: 0 }, M = { e: reeds, r: rocks, t: tufts, f: ferns, d: daisies };
  const picAng = Math.atan2(PICNIC.z - POND.z, PICNIC.x - POND.x), rockAng = Math.atan2(POND_ROCK.z - POND.z, POND_ROCK.x - POND.x);
  const angGap = (a, b) => Math.abs(((a - b + Math.PI * 3) % TAU) - Math.PI);
  const put = (k, x, y, z, s, c) => { if (cnt[k] >= M[k].count) return false; o.position.set(x, y, z); o.rotation.set((rnd() - .5) * .2, rnd() * TAU, (rnd() - .5) * .2); o.scale.set(s, s * (.8 + rnd() * .5), s); o.updateMatrix(); M[k].setMatrixAt(cnt[k], o.matrix); if (c) M[k].setColorAt(cnt[k], c); cnt[k]++; return true; };
  for (let tries = 0; tries < 6000; tries++) {
    const th = rnd() * TAU; if (angGap(th, picAng) < .55 || angGap(th, rockAng) < .3) continue;
    const kind = rnd(), t = kind < .35 ? .95 + rnd() * .3 : 1.15 + rnd() * 1.1, p = pondPt(th, t);
    if (kind < .3) put('e', p.x, -.12, p.z, .8 + rnd() * .8, col.setHSL(.2 + rnd() * .08, .45, .2 + rnd() * .1));
    else if (kind < .38) put('r', p.x, -.12, p.z, .5 + rnd() * .9, rnd() < .55 ? col.setHSL(.27 + rnd() * .05, .42, .15 + rnd() * .08) : col.setHSL(.6, .06, .26 + rnd() * .12));
    else if (kind < .5) put('f', p.x, -.12, p.z, .7 + rnd() * .5, col.setHSL(.27 + rnd() * .06, .5, .13 + rnd() * .09));
    else if (kind < .56) put('d', p.x, -.12, p.z, .8 + rnd() * .5);
    else put('t', p.x, -.12, p.z, .8 + rnd() * .7, col.setHSL(.22 + rnd() * .09, .5, .16 + rnd() * .15));
  }
  Object.keys(M).forEach(k => { M[k].count = cnt[k]; M[k].instanceMatrix.needsUpdate = true; if (M[k].instanceColor) M[k].instanceColor.needsUpdate = true; M[k].castShadow = false; group.add(M[k]); });

  // rock at the shore for the egret
  const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(.8, 1), mat(0x7d756a, .95, { flatShading: true })); rockMesh.position.set(POND_ROCK.x, POND_ROCK.top - .22, POND_ROCK.z); rockMesh.scale.set(1.2, .55, 1); rockMesh.castShadow = true; group.add(rockMesh);
  colliders.push({ t: 'c', x: POND_ROCK.x, z: POND_ROCK.z, r: .95 }, { t: 'c', x: POND.x - 1.6, z: POND.z, r: 2.7, low: true }, { t: 'c', x: POND.x, z: POND.z, r: 2.8, low: true }, { t: 'c', x: POND.x + 1.7, z: POND.z, r: 2.7, low: true });

  // egret on the rock
  const egret = new THREE.Group(), white = mat(0xf6f6f2, .6), dark = mat(0x1c1c1c, .7), yellow = mat(0xf0b52f, .6);
  egret.position.set(POND_ROCK.x, POND_ROCK.top, POND_ROCK.z); egret.rotation.y = Math.atan2(POND.x - POND_ROCK.x, POND.z - POND_ROCK.z); group.add(egret);
  [-1, 1].forEach(s => { const l = part(egret, new THREE.CylinderGeometry(.016, .02, .62, 6), dark, s * .055, .31, 0); l.castShadow = false; part(egret, new THREE.BoxGeometry(.03, .02, .12), dark, s * .055, .01, .04); });
  const body = part(egret, sph(.22), white, 0, .78, 0, .72, .72, 1.55); body.rotation.x = -.38;
  [-1, 1].forEach(s => { const w = part(egret, sph(.16), white, s * .13, .76, -.05, .3, .85, 2.0); w.rotation.x = -.38; w.rotation.z = s * .08; });
  const tail = part(egret, new THREE.ConeGeometry(.08, .4, 6), white, 0, .66, -.38); tail.rotation.x = -Math.PI / 2 - .5;
  const neck = new THREE.Group(); neck.position.set(0, .95, .25); egret.add(neck);
  part(neck, tube([[0, 0, 0], [0, .18, .1], [0, .38, .02], [0, .6, .12], [0, .72, .24], [0, .74, .3]], .035), white);
  const head = new THREE.Group(); head.position.set(0, .74, .3); neck.add(head);
  part(head, sph(.055), white, 0, 0, 0, 1, 1, 1.4); const beak = part(head, new THREE.ConeGeometry(.022, .3, 6), yellow, 0, -.01, .22); beak.rotation.x = Math.PI / 2 + .12; part(head, sph(.012, 6, 4), dark, .04, .02, .04);

  // swan, ducks
  const cream = mat(0xf3eee0, .6), orange = mat(0xf26b21, .5), swan = new THREE.Group();
  part(swan, sph(.36), cream, 0, .28, 0, .82, .62, 1.55); part(swan, sph(.22), cream, 0, .34, .34, 1, 1, 1.1);
  const stail = part(swan, new THREE.ConeGeometry(.12, .5, 6), cream, 0, .44, -.55); stail.rotation.x = -Math.PI / 2 + .6;
  [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { const f = part(swan, sph(.14), k === 1 ? mat(0xe9e2d0, .7) : cream, s * (.27 + k * .01), .46 + k * .035, -.18 - k * .13, .16, .45, 1.0); f.rotation.z = s * (.22 + k * .04); f.rotation.x = .2 + k * .06; } });
  const sneck = new THREE.Group(); sneck.position.set(0, .4, .46); swan.add(sneck);
  part(sneck, tube([[0, 0, 0], [0, .16, .12], [0, .38, .16], [0, .6, .1], [0, .76, .02], [0, .88, .08], [0, .92, .2]], .055), cream);
  const shead = new THREE.Group(); shead.position.set(0, .92, .2); sneck.add(shead);
  part(shead, sph(.075), cream, 0, 0, 0, 1, 1, 1.25); const sbeak = part(shead, new THREE.ConeGeometry(.04, .24, 6), orange, 0, -.02, .18); sbeak.rotation.x = Math.PI / 2 + .25; sbeak.scale.set(1.2, 1, .8); part(shead, sph(.032, 8, 6), mat(0x151515), 0, .0, .1, 1, .7, 1);
  group.add(swan);
  const wakeMat = new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
  const mkWake = (parentObj, z) => { const w = new THREE.Mesh(new THREE.RingGeometry(.3, .38, 24), wakeMat.clone()); w.rotation.x = -Math.PI / 2; w.position.set(0, .0, z); parentObj.add(w); return w; };
  const swanWakes = [mkWake(swan, -.6), mkWake(swan, -.6)];
  const ducks = [0, 1].map(i => {
    const d = new THREE.Group(), f = mat(0xfbfaf4, .65), bill = mat(0xf2a516, .5);
    part(d, sph(.2), f, 0, .18, 0, .8, .72, 1.3); part(d, sph(.1), f, 0, .36, .2); const b = part(d, new THREE.ConeGeometry(.04, .13, 6), bill, 0, .35, .32); b.rotation.x = Math.PI / 2; b.scale.set(1.5, 1, .55);
    part(d, sph(.015, 6, 4), mat(0x111111), .06, .39, .27); const t = part(d, new THREE.ConeGeometry(.07, .18, 5), f, 0, .26, -.32); t.rotation.x = -Math.PI / 2 + .7;
    [-1, 1].forEach(s => { const w = part(d, sph(.12), f, s * .17, .22, -.04, .25, .6, 1.4); w.rotation.z = s * .1; });
    group.add(d); return { g: d, wake: mkWake(d, -.34), phase: i * 3.1, dive: 0 };
  });

  // dragonflies
  const dfBody = mat(0x2c8fb8, .5), dfWing = new THREE.MeshBasicMaterial({ color: 0xcfe9ff, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false });
  const flies = Array.from({ length: mobile ? 3 : 6 }, () => {
    const g = new THREE.Group(); const b = part(g, new THREE.CylinderGeometry(.012, .008, .26, 6), dfBody); b.rotation.x = Math.PI / 2; part(g, sph(.025, 8, 6), dfBody, 0, 0, .14);
    const wings = [[-1, .04], [1, .04], [-1, -.03], [1, -.03]].map(([s, z]) => { const w = new THREE.Group(); w.position.set(0, .01, z); g.add(w); const p = new THREE.Mesh(new THREE.PlaneGeometry(.18, .045), dfWing); p.rotation.x = -Math.PI / 2; p.position.x = s * .09; w.add(p); return { w, s }; });
    group.add(g); return { g, wings, x: POND.x, y: 1, z: POND.z, tx: POND.x, ty: 1, tz: POND.z, wait: rnd() * 2 };
  });

  // kingfisher on a dead branch, dives for fish
  const wood = mat(0x6d4c35, .9), kf = new THREE.Group(), blue = mat(0x2a82e6, .45), orng = mat(0xf08a22, .55), whiteK = mat(0xf4f0e6, .6);
  const A = [PERCH.x + .55, 1.25, PERCH.z - .8];
  group.add(segment([A[0], 0, A[2]], A, .07, wood), segment(A, [PERCH.x, PERCH.y - .02, PERCH.z], .04, wood), segment([A[0] - .1, .78, A[2] - .05], [A[0] + .25, 1.0, A[2] + .15], .025, wood));
  colliders.push({ t: 'c', x: A[0], z: A[2], r: .12 });
  const kfScale = 1.7; kf.scale.setScalar(kfScale); group.add(kf);
  const kBody = new THREE.Group(); kf.add(kBody);
  part(kBody, sph(.08), blue, 0, .0, 0, .85, 1.1, 1.3).rotation.x = -.25; part(kBody, sph(.07), orng, 0, -.02, .03, .8, 1.0, 1.0); part(kBody, sph(.035), whiteK, 0, .04, .09);
  const kHead = new THREE.Group(); kHead.position.set(0, .1, .07); kBody.add(kHead); part(kHead, sph(.062), blue); part(kHead, sph(.02), orng, .045, -.01, .03); const kb = part(kHead, new THREE.ConeGeometry(.018, .17, 6), mat(0x16181c, .5), 0, -.01, .12); kb.rotation.x = Math.PI / 2; part(kHead, sph(.012, 6, 4), mat(0x050505), .03, .02, .045);
  const kTail = part(kBody, new THREE.ConeGeometry(.04, .12, 5), blue, 0, -.07, -.12); kTail.rotation.x = -Math.PI / 2 + .8;
  const kWings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .06, .02, 0); kBody.add(w); const p = part(w, sph(.07), blue, s * .07, 0, -.01, 1.1, .12, 1.7); p.castShadow = false; return { w, s }; });
  const kFish = part(kBody, sph(.03), mat(0xd7dde2, .4), 0, -.02, .2, .5, .5, 2.2); kFish.visible = false;
  const splash = new THREE.Mesh(new THREE.RingGeometry(.15, .22, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); splash.rotation.x = -Math.PI / 2; group.add(splash);
  const perchPos = new THREE.Vector3(PERCH.x, PERCH.y + .02, PERCH.z), faceYaw = Math.atan2(POND.x - PERCH.x, POND.z - PERCH.z);
  let kState = 'perch', kT = 0, kNext = 6, kTarget = new THREE.Vector3(), kYaw = faceYaw;

  // picnic spot: table, bench, cup with steam, big oak behind
  const woodTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#9b6234'; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { g.fillStyle = rnd() < .5 ? 'rgba(60,32,14,.28)' : 'rgba(210,150,90,.2)'; g.fillRect(rnd() * w, rnd() * h, 14 + rnd() * 50, 1 + rnd() * 2); } g.strokeStyle = 'rgba(40,20,8,.6)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
  const tableWood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: .8 }), picnic = new THREE.Group(); picnic.position.set(PICNIC.x, 0, PICNIC.z); group.add(picnic);
  part(picnic, new THREE.CylinderGeometry(.62, .62, .07, 20), tableWood, 0, .74, 0); part(picnic, new THREE.CylinderGeometry(.16, .22, .72, 10), tableWood, 0, .37, 0);
  [0, 1, 2].forEach(i => { const f = part(picnic, new THREE.BoxGeometry(.7, .08, .12), tableWood, 0, .08, 0); f.rotation.y = i / 3 * Math.PI; });
  const bench = new THREE.Group(); bench.position.set(1.3, 0, .2); bench.rotation.y = -Math.PI / 2; picnic.add(bench);
  part(bench, new THREE.BoxGeometry(1.7, .09, .5), tableWood, 0, .46, 0); const back = part(bench, new THREE.BoxGeometry(1.7, .4, .07), tableWood, 0, .75, -.22); back.rotation.x = -.18;
  [-.7, .7].forEach(x => { part(bench, new THREE.BoxGeometry(.1, .46, .45), tableWood, x, .23, 0); part(bench, new THREE.BoxGeometry(.1, .7, .08), tableWood, x, .6, -.2); });
  const cup = part(picnic, new THREE.CylinderGeometry(.055, .045, .08, 12), mat(0x151515, .35), .12, .82, .05); part(picnic, new THREE.CylinderGeometry(.09, .09, .012, 14), mat(0x1c1c1c, .4), .12, .78, .05);
  const steam = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTexture(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(.18); picnic.add(s); steam.push(s); }
  colliders.push({ t: 'c', x: PICNIC.x, z: PICNIC.z, r: .66 }, { t: 'b', x: PICNIC.x + 1.3, z: PICNIC.z + .2, hw: .28, hd: .88, rot: 0 });
  if (nature) nature.plantTree('oak', PICNIC.x + 3.2, PICNIC.z + .6, 1.5);

  const egretState = { next: 8, t: -1 };
  function update(time, dt, on, camPos, sky) {
    updateWater(waters, time, 1 - on, camPos, sky, reduced);
    wind.userData.setTime(reduced ? 0 : time); reedMat.userData.setTime(reduced ? 0 : time);
    const day = on < .55, T = reduced ? 0 : time;
    // egret
    neck.rotation.x = Math.sin(T * .9) * .05; head.rotation.y = Math.sin(T * .35) * .4;
    if (!reduced) { egretState.next -= dt; if (egretState.next < 0 && egretState.t < 0) egretState.t = 0; }
    if (egretState.t >= 0) { egretState.t += dt; const u = egretState.t; neck.rotation.x = (u < .35 ? u / .35 : u < .6 ? 1 : 1 - (u - .6) / .7) * 1.0; if (u > 1.3) { egretState.t = -1; egretState.next = 12 + rnd() * 10; } }
    // swan
    const sa = T * .14, sp = pondPt(sa, .6), sq = pondPt(sa + .02, .6);
    swan.position.set(sp.x, -.02 + Math.sin(T * 1.7) * .01, sp.z); swan.rotation.y = Math.atan2(sq.x - sp.x, sq.z - sp.z); swan.rotation.z = Math.sin(T * 1.2) * .02;
    sneck.rotation.x = Math.sin(T * .8) * .06; shead.rotation.x = .1 + Math.sin(T * .5) * .08;
    swanWakes.forEach((w, i) => { const u = ((T * .6 + i * .5) % 1); w.scale.setScalar(1 + u * 2.4); w.material.opacity = .32 * (1 - u); });
    ducks.forEach((d, i) => {
      const a = -T * (.2 + i * .05) + d.phase, p = pondPt(a, .42 + i * .12), q = pondPt(a - .02, .42 + i * .12);
      d.g.position.set(p.x, -.03 + Math.sin(T * 2 + d.phase) * .008, p.z); d.g.rotation.y = Math.atan2(p.x - q.x, p.z - q.z);
      d.dive = Math.max(0, d.dive - dt); if (!reduced && d.dive <= 0 && Math.sin(T * .4 + d.phase * 2) > .985) d.dive = 1.1;
      d.g.rotation.x = d.dive > 0 ? Math.sin((1.1 - d.dive) / 1.1 * Math.PI) * .75 : 0;
      const u = ((T * .7 + i * .4) % 1); d.wake.scale.setScalar(1 + u * 1.8); d.wake.material.opacity = .26 * (1 - u);
    });
    // dragonflies
    flies.forEach(f => {
      f.g.visible = day; if (!day) return;
      f.wait -= dt; if (f.wait < 0) { const p = pondPt(rnd() * TAU, rnd() * 1.1); f.tx = p.x; f.tz = p.z; f.ty = .5 + rnd() * 1.1; f.wait = .5 + rnd() * 1.6; }
      const k = Math.min(1, dt * 3.2), px = f.x, pz = f.z; f.x = lerp(f.x, f.tx, k); f.z = lerp(f.z, f.tz, k); f.y = lerp(f.y, f.ty, k) + Math.sin(T * 30) * .002;
      if ((f.x - px) ** 2 + (f.z - pz) ** 2 > 1e-7) f.g.rotation.y = Math.atan2(f.x - px, f.z - pz);
      f.g.position.set(f.x, f.y, f.z); const fl = reduced ? .2 : Math.sin(T * 60) * .5; f.wings.forEach(w => { w.w.rotation.z = fl * w.s; });
    });
    // kingfisher
    kNext -= dt;
    if (kState === 'perch') {
      kf.position.copy(perchPos); kYaw = faceYaw + Math.sin(T * .4) * .35; kf.rotation.set(0, kYaw, 0); kHead.rotation.set(Math.sin(T * 1.3) * .1, Math.sin(T * .7) * .3, 0); kTail.rotation.z = Math.sin(T * 2.2) * .08;
      kWings.forEach(w => { w.w.rotation.z = -w.s * .02; w.w.scale.set(.6, 1, .6); }); kFish.visible = false;
      if (kNext < 0 && day && !reduced) { const p = pondPt(rnd() * TAU, .35 + rnd() * .3); kTarget.set(p.x, -.04, p.z); kState = 'out'; kT = 0; }
    } else {
      kT += dt; const dur = kState === 'out' ? .95 : 1.25, u = clamp(kT / dur, 0, 1), from = kState === 'out' ? perchPos : kTarget, to = kState === 'out' ? kTarget : perchPos;
      const px = kf.position.x, pz = kf.position.z;
      kf.position.lerpVectors(from, to, u); kf.position.y += Math.sin(u * Math.PI) * (kState === 'out' ? .55 : .9);
      const dx = kf.position.x - px, dz = kf.position.z - pz; if (dx * dx + dz * dz > 1e-8) kYaw = Math.atan2(dx, dz);
      kf.rotation.set(kState === 'out' ? .5 * u : -.3, kYaw, 0); kWings.forEach(w => { w.w.scale.set(1, 1, 1); w.w.rotation.z = w.s * Math.sin(T * 45) * .9; });
      if (kState === 'out' && u >= 1) { kState = 'back'; kT = 0; splash.position.set(kTarget.x, -.02, kTarget.z); splash.userData.t = 0; kFish.visible = rnd() < .75; }
      else if (kState === 'back' && u >= 1) { kState = 'perch'; kNext = 10 + rnd() * 12; }
    }
    if (splash.userData.t !== undefined && splash.userData.t < 1) { splash.userData.t += dt * 1.4; const s = splash.userData.t; splash.scale.setScalar(1 + s * 3); splash.material.opacity = .5 * (1 - s); }
    // steam
    steam.forEach((s, i) => { const u = ((T * .35 + i * .25) % 1); s.position.set(.12 + Math.sin(T + i) * .02, .86 + u * .45, .05); s.material.opacity = .22 * Math.sin(u * Math.PI) * (day ? .7 : 1); s.scale.setScalar(.12 + u * .22); });
  }
  return { update };
}

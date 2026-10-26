import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { getGlowTexture } from './lamps.js';

const TAU = Math.PI * 2;
const GROUND = -.12;
const clamp = THREE.MathUtils.clamp;
const makeRand = (seed) => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const noise3 = (x, y, z) => (Math.sin(x * 1.7 + y * 2.3 + z * 1.3) + Math.sin(x * 3.1 - y * 1.9 + z * 2.7) * .5 + Math.sin(x * 5.3 + y * 4.1 - z * 3.9) * .25) / 1.75;

function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lumpy, noise-displaced sphere with spherical UVs and a darker underside baked into vertex colors. */
function blob(r, { rough = .3, sq = [1, 1, 1], seed = 0, color, detail = 2 } = {}) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), uv = new Float32Array(p.count * 2), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = noise3(x * 2 + seed, y * 2 + seed * 1.3, z * 2 - seed) * rough + noise3(x * 5.5, y * 5.5 + seed, z * 5.5) * rough * .35;
    uv[i * 2] = Math.atan2(z, x) / TAU + .5; uv[i * 2 + 1] = Math.acos(clamp(y, -1, 1)) / Math.PI;
    const s = r * (1 + n);
    x *= s * sq[0]; y *= s * sq[1]; z *= s * sq[2];
    p.setXYZ(i, x, y, z);
    const shade = .6 + .5 * ((y / (r * sq[1])) * .5 + .5) + n * .3;
    c.copy(color).multiplyScalar(shade);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function trunkGeo(h, rBot, rTop, bend, rnd) {
  const body = new THREE.CylinderGeometry(rTop, rBot, h, 9, 8);
  body.translate(0, h / 2, 0);
  const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / h;
    p.setX(i, p.getX(i) + Math.sin(t * 3 + bend) * .1 * t * h * .3);
    p.setZ(i, p.getZ(i) + Math.cos(t * 2.4 + bend) * .07 * t * h * .3);
  }
  body.computeVertexNormals();
  const flare = new THREE.CylinderGeometry(rBot * 1.05, rBot * 1.9, .36, 9, 1); flare.translate(0, .16, 0);
  return [body, flare];
}
function branch(len, r, y0, yaw, tilt) {
  const g = new THREE.CylinderGeometry(r * .55, r, len, 6, 1); g.translate(0, len / 2, 0);
  g.rotateZ(tilt); g.rotateY(yaw); g.translate(0, y0, 0); return g;
}
const tint = (hex, rnd, j = .08) => new THREE.Color(hex).offsetHSL((rnd() - .5) * j, (rnd() - .5) * .1, (rnd() - .5) * .06);

function makePine(rnd, leafCol) {
  const h = 1.5 + rnd() * .5;
  const parts = trunkGeo(h, .24, .08, rnd() * 6, rnd);
  const tiers = [], tierCount = 5, base = tint(leafCol, rnd, .05);
  for (let t = 0; t < tierCount; t++) {
    const radius = 2.15 * (1 - t / (tierCount + .4)) * (.92 + rnd() * .16), height = 1.75 + (1 - t / tierCount) * .25;
    const cone = new THREE.ConeGeometry(radius, height, 10, 3);
    const p = cone.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), ph = rnd() * 6;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ratio = Math.hypot(x, z) / radius, ang = Math.atan2(z, x);
      const jag = 1 + noise3(Math.cos(ang) * 3 + ph, Math.sin(ang) * 3, y) * .2 * ratio;
      x *= jag; z *= jag; y -= ratio * .34 + Math.abs(noise3(ang * 2, ph, 0)) * .16 * ratio;
      p.setXYZ(i, x, y, z);
      c.copy(base).multiplyScalar(.5 + .55 * (t / tierCount) + .35 * ((y / height) + .5));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    cone.setAttribute('color', new THREE.BufferAttribute(col, 3));
    cone.computeVertexNormals();
    cone.translate(0, h * .55 + t * .98 + height / 2, 0);
    tiers.push(cone);
  }
  return { trunk: mergeGeometries(parts), crown: mergeGeometries(tiers), size: 6.6, half: .36, bark: 'bark' };
}

function makeBroadleaf(rnd, leafCol, fruit) {
  const h = 1.7 + rnd() * .4;
  const parts = trunkGeo(h, .32, .2, rnd() * 6, rnd);
  const blobs = [], centers = [];
  for (let k = 0; k < 3; k++) parts.push(branch(1.5 + rnd() * .4, .1, h * .7, (k / 3) * TAU + rnd(), .55 + rnd() * .3));
  const n = 6;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + rnd() * .6, rad = .9 + rnd() * .5;
    const r = 1.15 + rnd() * .5, cx = Math.cos(a) * rad, cy = h + 1.1 + rnd() * .8, cz = Math.sin(a) * rad;
    const g = blob(r, { rough: .34, sq: [1, .86, 1], seed: rnd() * 9, color: tint(leafCol, rnd, .1) });
    g.translate(cx, cy, cz); blobs.push(g); centers.push([cx, cy, cz, r * .86]);
  }
  const topR = 1.25, top = blob(topR, { rough: .3, seed: rnd() * 9, color: tint(leafCol, rnd, .08) });
  top.translate(0, h + 2.35, 0); blobs.push(top); centers.push([0, h + 2.35, 0, topR]);
  let fruitGeo = null;
  if (fruit) {
    const fr = [];
    for (let i = 0; i < 16; i++) {
      const [cx, cy, cz, r] = centers[Math.floor(rnd() * centers.length)];
      const a = rnd() * TAU, e = (rnd() * .9 - .35) * Math.PI / 2;
      const f = new THREE.IcosahedronGeometry(.13, 1); f.scale(1, 1.18, 1);
      f.translate(cx + Math.cos(a) * Math.cos(e) * r * 1.02, cy + Math.sin(e) * r * 1.02, cz + Math.sin(a) * Math.cos(e) * r * 1.02);
      fr.push(f);
    }
    fruitGeo = mergeGeometries(fr);
  }
  return { trunk: mergeGeometries(parts), crown: mergeGeometries(blobs), fruit: fruitGeo, size: 5.3, half: .46, bark: 'bark' };
}

function makeBirch(rnd, leafCol) {
  const h = 3.3 + rnd() * .6;
  const parts = trunkGeo(h, .17, .07, rnd() * 6, rnd);
  for (let k = 0; k < 2; k++) parts.push(branch(1.1, .06, h * .62, rnd() * TAU, .5));
  const blobs = [];
  for (let k = 0; k < 5; k++) {
    const a = rnd() * TAU, rad = .35 + rnd() * .6, r = .8 + rnd() * .35;
    const g = blob(r, { rough: .36, sq: [1, 1.1, 1], seed: rnd() * 9, color: tint(leafCol, rnd, .1) });
    g.translate(Math.cos(a) * rad, h + .2 + k * .42, Math.sin(a) * rad); blobs.push(g);
  }
  return { trunk: mergeGeometries(parts), crown: mergeGeometries(blobs), size: 5.8, half: .28, bark: 'birch' };
}

/**
 * Builds groves of pines, oaks, birches and a few lemon trees plus bushes, rocks, grass, flowers and fireflies.
 * Trees get box colliders so the player slides around trunks instead of walking through them.
 */
export function buildNature(parent, { isFree, colliders, mobile = false, reduced = false }) {
  const rnd = makeRand(77231);
  const leafTex = canvasTex(256, (g, s) => {
    g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) { const v = 110 + rnd() * 145; g.fillStyle = `rgba(${v},${v},${v},.55)`; g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 2 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, TAU); g.fill(); }
  }, [3, 3]);
  const barkTex = canvasTex(256, (g, s) => {
    g.fillStyle = '#6d4c35'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) { g.fillStyle = rnd() < .7 ? 'rgba(28,17,10,.38)' : 'rgba(150,110,80,.25)'; g.fillRect(rnd() * s, rnd() * s, 1.5 + rnd() * 3.5, 20 + rnd() * 80); }
  }, [2, 3]);
  const birchTex = canvasTex(256, (g, s) => {
    g.fillStyle = '#e8e5da'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(35,32,28,${.45 + rnd() * .4})`; g.fillRect(rnd() * s, rnd() * s, 10 + rnd() * 40, 2 + rnd() * 5); }
  }, [1, 2]);
  const mossTex = canvasTex(256, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(70,106,60,.9)'); gr.addColorStop(.65, 'rgba(52,80,50,.55)'); gr.addColorStop(1, 'rgba(40,64,42,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${60 + rnd() * 50},${90 + rnd() * 50},${50 + rnd() * 30},.18)`; g.fillRect(rnd() * s, rnd() * s, 3, 3); }
  });
  mossTex.wrapS = mossTex.wrapT = THREE.ClampToEdgeWrapping;

  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: leafTex, bumpMap: leafTex, bumpScale: 1.4, roughness: .9 });
  const barkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: .95 });
  const birchMat = new THREE.MeshStandardMaterial({ map: birchTex, roughness: .85 });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: .5, emissive: 0x5a4200, emissiveIntensity: .45 });
  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ map: mossTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });

  const green = [0x2f5d3a, 0x37663f, 0x2a5236], oak = [0x4f7d3a, 0x5b8a40, 0x477236], birchLeaf = [0x8fbf5a, 0xa3c862], lemonLeaf = [0x5f9a45, 0x6aa84c];
  const protos = {
    pine: green.map(c => makePine(rnd, c)),
    oak: oak.map(c => makeBroadleaf(rnd, c, false)),
    birch: birchLeaf.map(c => makeBirch(rnd, c)),
    lemon: lemonLeaf.map(c => makeBroadleaf(rnd, c, true)),
  };
  const barkOf = { bark: barkMat, birch: birchMat };

  // Grove centers away from stations, walkways and the hub.
  const centers = [];
  for (let tries = 0; tries < 900 && centers.length < 9; tries++) {
    const a = rnd() * TAU, r = 13 + rnd() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!isFree(x, z, 3) || centers.some(c => Math.hypot(c.x - x, c.z - z) < 9.5)) continue;
    centers.push({ x, z, spread: 3 + rnd() * 1.6 });
  }

  const group = new THREE.Group(); parent.add(group);
  const trees = [], placed = [], shadows = !mobile;
  const pickSpecies = () => { const v = rnd(); return v < .36 ? 'pine' : v < .6 ? 'oak' : v < .82 ? 'birch' : 'lemon'; };
  const free = (x, z, gap) => isFree(x, z, 1) && placed.every(p => Math.hypot(p.x - x, p.z - z) >= gap);

  centers.forEach(c => {
    const moss = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mossMat);
    moss.rotation.x = -Math.PI / 2; moss.position.set(c.x, -.06, c.z); moss.scale.set((c.spread + 2.4) * (.9 + rnd() * .3), (c.spread + 2.4) * (.9 + rnd() * .3), 1);
    moss.renderOrder = 1; group.add(moss);
    const want = 3 + Math.floor(rnd() * 3);
    for (let n = 0, made = 0; n < 40 && made < want; n++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * c.spread, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (!free(x, z, 3.1)) continue;
      const kind = pickSpecies(), list = protos[kind], pr = list[Math.floor(rnd() * list.length)];
      const s = .85 + rnd() * .5, g = new THREE.Group(); g.position.set(x, GROUND, z); g.rotation.y = rnd() * TAU; g.scale.setScalar(s);
      const trunk = new THREE.Mesh(pr.trunk, barkOf[pr.bark]); trunk.castShadow = shadows;
      const crown = new THREE.Mesh(pr.crown, leafMat); crown.castShadow = shadows; crown.receiveShadow = shadows;
      g.add(trunk, crown);
      if (pr.fruit) g.add(new THREE.Mesh(pr.fruit, fruitMat));
      group.add(g);
      trees.push({ g, phase: rnd() * TAU, amp: .009 + rnd() * .008 });
      placed.push({ x, z });
      colliders.push({ t: 'b', x, z, hw: pr.half * s, hd: pr.half * s, rot: 0 });
      made++;
    }
    // bushes and rocks
    for (let n = 0, made = 0; n < 40 && made < 4; n++) {
      const a = rnd() * TAU, r = c.spread * (.4 + rnd() * .9), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (!free(x, z, 1.6)) continue;
      const s = .75 + rnd() * .55;
      const g = blob(.7, { rough: .3, sq: [1.15, .78, 1.05], seed: rnd() * 9, color: tint(oak[Math.floor(rnd() * 3)], rnd, .1), detail: 1 });
      const m = new THREE.Mesh(g, leafMat); m.position.set(x, GROUND + .3 * s, z); m.scale.setScalar(s); m.rotation.y = rnd() * TAU; m.castShadow = shadows; group.add(m);
      placed.push({ x, z }); colliders.push({ t: 'c', x, z, r: .62 * s }); made++;
    }
    for (let n = 0, made = 0; n < 30 && made < 2; n++) {
      const a = rnd() * TAU, r = c.spread * (.5 + rnd() * .9), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (!free(x, z, 1.8)) continue;
      const sx = .7 + rnd() * .7, sz = .7 + rnd() * .6, sh = .5 + rnd() * .4, rot = rnd() * TAU, grey = new THREE.Color().setHSL(.6, .1, .22 + rnd() * .08);
      const m = new THREE.Mesh(blob(.8, { rough: .42, seed: rnd() * 9, color: grey, detail: 1 }), rockMat);
      m.position.set(x, GROUND + .16, z); m.scale.set(sx, sh, sz); m.rotation.y = rot; m.castShadow = shadows; group.add(m);
      placed.push({ x, z }); colliders.push({ t: 'b', x, z, hw: .62 * sx, hd: .62 * sz, rot }); made++;
    }
  });

  // Grass tufts with wind, and flowers.
  const grassGeo = new THREE.ConeGeometry(.04, .5, 4, 1); grassGeo.translate(0, .25, 0);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  grassMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 }; grassMat.userData.sh = sh;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nfloat ph=instanceMatrix[3].x*.7+instanceMatrix[3].z*.5;\ntransformed.x+=sin(uTime*1.7+ph)*position.y*.24;\ntransformed.z+=cos(uTime*1.3+ph)*position.y*.12;');
  };
  const grassCount = mobile ? 360 : 760, grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount), tmp = new THREE.Object3D(), gc = new THREE.Color();
  const flowerCols = [0xffc83d, 0xffffff, 0x7ee0ff, 0xff9bb0], flowerCount = 90;
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07, 0), new THREE.MeshStandardMaterial({ roughness: .6, emissive: 0x222222 }), flowerCount);
  let gi = 0, fi = 0;
  for (let tries = 0; tries < 6000 && (gi < grassCount || fi < flowerCount); tries++) {
    const c = centers[Math.floor(rnd() * centers.length)]; if (!c) break;
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * (c.spread + 1.8), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
    if (!isFree(x, z, .4)) continue;
    if (gi < grassCount) {
      tmp.position.set(x, GROUND, z); tmp.rotation.set((rnd() - .5) * .3, rnd() * TAU, (rnd() - .5) * .3); tmp.scale.setScalar(.6 + rnd() * .9); tmp.updateMatrix();
      grass.setMatrixAt(gi, tmp.matrix); grass.setColorAt(gi, gc.setHSL(.27 + rnd() * .07, .45, .22 + rnd() * .16)); gi++;
    } else if (fi < flowerCount && rnd() < .5) {
      tmp.position.set(x, GROUND + .12, z); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(.8 + rnd() * .6); tmp.updateMatrix();
      flowers.setMatrixAt(fi, tmp.matrix); flowers.setColorAt(fi, gc.setHex(flowerCols[Math.floor(rnd() * flowerCols.length)])); fi++;
    }
  }
  grass.count = gi; flowers.count = fi; grass.instanceMatrix.needsUpdate = true; flowers.instanceMatrix.needsUpdate = true;
  group.add(grass, flowers);

  // Fireflies appear at night.
  const flyCount = mobile ? 40 : 90, flyPos = new Float32Array(flyCount * 3), flyBase = [];
  for (let i = 0; i < flyCount; i++) {
    const c = centers[i % Math.max(1, centers.length)] || { x: 0, z: -20, spread: 3 }, a = rnd() * TAU, r = rnd() * (c.spread + 2);
    flyBase.push({ x: c.x + Math.cos(a) * r, y: .6 + rnd() * 2.4, z: c.z + Math.sin(a) * r, p: rnd() * TAU, s: .4 + rnd() * .7 });
  }
  const flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyMat = new THREE.PointsMaterial({ map: getGlowTexture(), color: 0xd9ff7a, size: .55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const flies = new THREE.Points(flyGeo, flyMat); flies.frustumCulled = false; group.add(flies);

  function update(time, on) {
    if (grassMat.userData.sh) grassMat.userData.sh.uniforms.uTime.value = reduced ? 0 : time;
    flyMat.opacity = on * .9;
    if (reduced) { for (let i = 0; i < flyCount; i++) { const b = flyBase[i]; flyPos.set([b.x, b.y, b.z], i * 3); } flyGeo.attributes.position.needsUpdate = true; return; }
    for (const t of trees) { t.g.rotation.z = Math.sin(time * .9 + t.phase) * t.amp; t.g.rotation.x = Math.sin(time * .7 + t.phase * 1.3) * t.amp * .7; }
    if (on > .02) {
      for (let i = 0; i < flyCount; i++) {
        const b = flyBase[i];
        flyPos[i * 3] = b.x + Math.sin(time * b.s + b.p) * 1.1; flyPos[i * 3 + 1] = b.y + Math.sin(time * b.s * 1.7 + b.p) * .5; flyPos[i * 3 + 2] = b.z + Math.cos(time * b.s * .9 + b.p) * 1.1;
      }
      flyGeo.attributes.position.needsUpdate = true;
    }
  }
  return { update, treeCount: trees.length, groveCount: centers.length };
}

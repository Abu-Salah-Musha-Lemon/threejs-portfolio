import * as THREE from 'three';
import { lamps, getGlowTexture } from './lamps.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2;
const makeRand = (seed) => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

/** Obelisk positions (must match the loop in world.js scenery). */
export const TOWER_SITES = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU + .12; return { x: Math.cos(a) * 32, z: Math.sin(a) * 32 }; });

export const STREAM_WIDTH = 3.2;
export const STREAM_POINTS = [[-27.6, -23.1], [-20.5, -25.0], [-12.0, -25.8], [-3.5, -24.4], [7.5, -24.2], [15.0, -23.2], [22.5, -22.2], [29.3, -23.2]];
const curve = new THREE.CatmullRomCurve3(STREAM_POINTS.map(([x, z]) => new V3(x, 0, z)), false, 'centripetal');
export const STREAM_SAMPLES = curve.getSpacedPoints(160);

// Bridge frame: found where the stream is closest to x = 7.5.
let tb = 0, best = 1e9;
for (let i = 0; i <= 400; i++) { const p = curve.getPointAt(i / 400), d = Math.hypot(p.x - 7.5, p.z + 24.2); if (d < best) { best = d; tb = i / 400; } }
const bc = curve.getPointAt(tb), bt = curve.getTangentAt(tb);
let ax = -bt.z, az = bt.x; if (az > 0) { ax = -ax; az = -az; }
export const BRIDGE = { cx: bc.x, cz: bc.z, tx: bt.x, tz: bt.z, ax, az, L: 8.2, halfW: 1.25, archH: .95, endY: 0, t: tb };
export const LOOKOUT = { x: 11.5, z: -31, r: 3 };
export const SPRING = { x: -29.8, z: -22.2 };
const TRAIL_SOUTH = [[1.5, -8.6], [3.2, -13.2], [5.8, -17.0], [BRIDGE.cx - BRIDGE.ax * (BRIDGE.L / 2 + .6), BRIDGE.cz - BRIDGE.az * (BRIDGE.L / 2 + .6)]];
const TRAIL_NORTH = [[BRIDGE.cx + BRIDGE.ax * (BRIDGE.L / 2 + .6), BRIDGE.cz + BRIDGE.az * (BRIDGE.L / 2 + .6)], [9.4, -28.9], [LOOKOUT.x - 1.4, LOOKOUT.z + 1.4]];
const trailCurves = [TRAIL_SOUTH, TRAIL_NORTH].map(p => new THREE.CatmullRomCurve3(p.map(([x, z]) => new V3(x, 0, z))));
const TRAIL_SAMPLES = trailCurves.flatMap(c => c.getSpacedPoints(40));

/** Ground height under (x,z): the arched bridge deck, otherwise 0. */
export function groundHeight(x, z) {
  const dx = x - BRIDGE.cx, dz = z - BRIDGE.cz;
  const u = dx * BRIDGE.ax + dz * BRIDGE.az, v = dx * BRIDGE.tx + dz * BRIDGE.tz;
  if (Math.abs(v) <= BRIDGE.halfW && Math.abs(u) <= BRIDGE.L / 2) { const s = 2 * u / BRIDGE.L; return BRIDGE.endY + (BRIDGE.archH - BRIDGE.endY) * (1 - s * s); }
  return 0;
}
const minDist = (x, z, pts) => { let m = 1e9; for (const p of pts) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
/** True where trees, animals and props must not go: stream, trails, bridge, lookout, spring. */
export function terrainBlocked(x, z, margin = 0) {
  if (minDist(x, z, STREAM_SAMPLES) < STREAM_WIDTH / 2 + 1.8 + margin) return true;
  if (minDist(x, z, TRAIL_SAMPLES) < 1.7 + margin) return true;
  if (Math.hypot(x - LOOKOUT.x, z - LOOKOUT.z) < LOOKOUT.r + 1 + margin) return true;
  if (Math.hypot(x - SPRING.x, z - SPRING.z) < 4 + margin) return true;
  return false;
}

function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function ribbon(pts, widthAt, y, vScale = 1) {
  const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let dist = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx, w = widthAt(i / (n - 1)) / 2;
    if (i > 0) dist += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    pos.set([p.x + nx * w, y, p.z + nz * w, p.x - nx * w, y, p.z - nz * w], i * 6);
    uv.set([0, dist * vScale, 1, dist * vScale], i * 4);
    if (i < n - 1) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

const WATER_VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const WATER_FS = `varying vec2 vUv;uniform float uTime;uniform float uDay;
void main(){
  float edge=abs(vUv.x-.5)*2.;
  float flow=vUv.y*.8-uTime*.55;
  float r1=sin(flow*9.+sin(vUv.x*7.)*1.4)*.5+.5;
  float r2=sin(vUv.y*2.3-uTime*1.1-vUv.x*6.)*.5+.5;
  vec3 deep=mix(vec3(.03,.13,.19),vec3(.09,.42,.53),uDay);
  vec3 shallow=mix(vec3(.07,.27,.32),vec3(.32,.72,.74),uDay);
  vec3 col=mix(deep,shallow,smoothstep(.15,1.,edge)*.8+r1*.18);
  col+=pow(r2,6.)*mix(.10,.22,uDay)*vec3(.8,.95,1.);
  float foam=smoothstep(.78,1.,edge)*(.5+.5*sin(vUv.y*34.-uTime*1.6));
  col=mix(col,vec3(.88,.97,1.),foam*.5);
  float a=mix(.72,.92,smoothstep(.0,.35,edge))*(1.-smoothstep(.9,1.,edge));
  gl_FragColor=vec4(col,a);
}`;
const FALL_FS = `varying vec2 vUv;uniform float uTime;uniform float uDay;
void main(){
  float c=floor(vUv.x*16.);float h=fract(sin(c*91.7)*437.5);
  float f=fract(vUv.y*3.4-uTime*(1.5+h*1.3)+h*5.);
  float streak=smoothstep(0.,.5,f)*smoothstep(1.,.5,f);
  float edge=smoothstep(0.,.1,vUv.x)*smoothstep(1.,.9,vUv.x);
  vec3 base=mix(vec3(.55,.80,.90),vec3(.93,.99,1.),streak)*mix(.5,1.,uDay);
  float a=(.5+.38*streak)*edge*(1.-smoothstep(.82,1.,vUv.y)*.75);
  gl_FragColor=vec4(base,a);
}`;
const waterMat = (fs, side) => new THREE.ShaderMaterial({ vertexShader: WATER_VS, fragmentShader: fs, transparent: true, depthWrite: false, side, uniforms: { uTime: { value: 0 }, uDay: { value: 0 } } });

/** Strip hanging from a lip: horizontal outward direction o, falling from y0 to y1. */
function fallStrip(lip, o, y0, y1, width, push, rows = 16) {
  const pos = [], uv = [], idx = [], ax = -o.z, az = o.x;
  for (let i = 0; i <= rows; i++) {
    const s = i / rows, out = push * (1 - (1 - s) ** 3), y = y0 + (y1 - y0) * s;
    const cx = lip.x + o.x * out, cz = lip.z + o.z * out, w = width / 2 * (1 + s * .12);
    pos.push(cx + ax * w, y, cz + az * w, cx - ax * w, y, cz - az * w); uv.push(0, s, 1, s);
    if (i < rows) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}

export function buildTerrain(parent, { colliders, mobile = false, reduced = false }) {
  const rnd = makeRand(9157), group = new THREE.Group(); parent.add(group);
  const mats = [];

  // Banks, stream, trails
  const soil = new THREE.Mesh(ribbon(STREAM_SAMPLES, () => STREAM_WIDTH + 1.5, -.075, .2), new THREE.MeshStandardMaterial({
    roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    map: canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(38,36,28,0)'); gr.addColorStop(.25, 'rgba(38,36,28,.95)'); gr.addColorStop(.75, 'rgba(38,36,28,.95)'); gr.addColorStop(1, 'rgba(38,36,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  }));
  soil.receiveShadow = true; soil.renderOrder = 1; group.add(soil);
  const sw = waterMat(WATER_FS, THREE.DoubleSide); mats.push(sw);
  const stream = new THREE.Mesh(ribbon(STREAM_SAMPLES, (t) => STREAM_WIDTH * (.85 + .15 * Math.min(1, t * 4)), -.03, .35), sw); stream.renderOrder = 3; group.add(stream);

  const stoneTex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h, rx = 22 + rnd() * 20, ry = 16 + rnd() * 12, v = 120 + rnd() * 50; g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.beginPath(); g.ellipse(x, y, rx, ry, rnd() * 3, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,26,22,.55)'; g.lineWidth = 3; g.stroke(); }
  }, [1, 1]);
  const trailMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: .95, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, alphaMap: canvasTex(64, 4, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#000'); gr.addColorStop(.18, '#fff'); gr.addColorStop(.82, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
  trailCurves.forEach(c => { const m = new THREE.Mesh(ribbon(c.getSpacedPoints(50), () => 2.5, -.06, .45), trailMat); m.renderOrder = 2; m.receiveShadow = true; group.add(m); });

  // Water boxes block walking unless the player is in the air (jump over the stream).
  const pts = curve.getSpacedPoints(Math.round(curve.getLength() / 1.4));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, len = Math.hypot(b.x - a.x, b.z - a.z);
    if (Math.abs((cx - BRIDGE.cx) * BRIDGE.tx + (cz - BRIDGE.cz) * BRIDGE.tz) < 2.05 && Math.hypot(cx - BRIDGE.cx, cz - BRIDGE.cz) < 3.2) continue;
    colliders.push({ t: 'b', x: cx, z: cz, hw: len / 2 + .12, hd: STREAM_WIDTH / 2 - .1, rot: Math.atan2(b.z - a.z, b.x - a.x), low: true });
  }

  // Bank rocks and reeds
  const rockGeo = new THREE.DodecahedronGeometry(.4, 0), rockMat = new THREE.MeshStandardMaterial({ roughness: .95, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 70), reedCount = mobile ? 60 : 120;
  const reedGeo = new THREE.ConeGeometry(.035, 1.1, 4, 1); reedGeo.translate(0, .55, 0);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  reedMat.onBeforeCompile = (sh) => { sh.uniforms.uTime = { value: 0 }; reedMat.userData.sh = sh; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat ph=instanceMatrix[3].x*.8+instanceMatrix[3].z*.6;\ntransformed.x+=sin(uTime*1.5+ph)*position.y*.2;\ntransformed.z+=cos(uTime*1.2+ph)*position.y*.1;'); };
  const reeds = new THREE.InstancedMesh(reedGeo, reedMat, reedCount), o = new THREE.Object3D(), col = new THREE.Color();
  let ri = 0, ei = 0;
  for (let tries = 0; tries < 2000 && (ri < 70 || ei < reedCount); tries++) {
    const p = STREAM_SAMPLES[Math.floor(rnd() * (STREAM_SAMPLES.length - 6)) + 3], q = STREAM_SAMPLES[STREAM_SAMPLES.indexOf(p) + 1];
    let tx = q.x - p.x, tz = q.z - p.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const side = rnd() < .5 ? -1 : 1, off = side * (STREAM_WIDTH / 2 + .05 + rnd() * .7), x = p.x - tz * off, z = p.z + tx * off;
    if (Math.hypot(x - BRIDGE.cx, z - BRIDGE.cz) < 4.4 || Math.hypot(x - SPRING.x, z - SPRING.z) < 3) continue;
    if (ri < 70 && rnd() < .5) { o.position.set(x, -.12, z); o.rotation.set(rnd(), rnd() * TAU, rnd()); const s = .5 + rnd() * .9; o.scale.set(s * 1.2, s * .7, s); o.updateMatrix(); rocks.setMatrixAt(ri, o.matrix); rocks.setColorAt(ri, col.setHSL(.58, .06, .26 + rnd() * .14)); ri++; }
    else if (ei < reedCount) { o.position.set(x + (rnd() - .5) * .3, -.12, z + (rnd() - .5) * .3); o.rotation.set((rnd() - .5) * .2, rnd() * TAU, (rnd() - .5) * .2); o.scale.setScalar(.7 + rnd() * .8); o.updateMatrix(); reeds.setMatrixAt(ei, o.matrix); reeds.setColorAt(ei, col.setHSL(.22 + rnd() * .08, .45, .24 + rnd() * .12)); ei++; }
  }
  rocks.count = ri; reeds.count = ei; rocks.castShadow = !mobile; reeds.castShadow = false; group.add(rocks, reeds);

  // Spring boulders and a small cascade feeding the stream
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x5b6670, roughness: .95, flatShading: true });
  [[0, 0, 1.9, 1.3], [1.6, -1.4, 1.2, .9], [-1.2, 1.7, 1.1, .8], [1.9, 1.3, .9, .7]].forEach(([dx, dz, r, h]) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), boulderMat); m.position.set(SPRING.x + dx, h * .55 - .2, SPRING.z + dz); m.scale.y = .8; m.rotation.set(rnd(), rnd() * TAU, rnd() * .3); m.castShadow = !mobile; m.receiveShadow = true; group.add(m);
  });
  colliders.push({ t: 'c', x: SPRING.x, z: SPRING.z, r: 2.4 }, { t: 'c', x: SPRING.x + 1.6, z: SPRING.z - 1.4, r: 1.5 }, { t: 'c', x: SPRING.x - 1.2, z: SPRING.z + 1.7, r: 1.4 });
  const sdir = new V3(STREAM_POINTS[1][0] - STREAM_POINTS[0][0], 0, STREAM_POINTS[1][1] - STREAM_POINTS[0][1]).normalize();
  const sf = waterMat(FALL_FS, THREE.DoubleSide); mats.push(sf);
  const spring = new THREE.Mesh(fallStrip(new V3(STREAM_POINTS[0][0] - sdir.x * 1.2, 0, STREAM_POINTS[0][1] - sdir.z * 1.2), sdir.clone().multiplyScalar(-1).multiplyScalar(-1), 1.0, -.03, 1.0, .8, 8), sf); spring.renderOrder = 4; group.add(spring);

  // Big waterfall over the rim
  const end = STREAM_SAMPLES.at(-1), prev = STREAM_SAMPLES.at(-4);
  const dirOut = new V3(end.x - prev.x, 0, end.z - prev.z).normalize(), radial = new V3(end.x, 0, end.z).normalize();
  const out = dirOut.clone().lerp(radial, .6).normalize();
  const wf = waterMat(FALL_FS, THREE.DoubleSide); mats.push(wf);
  const lip = new V3(end.x, 0, end.z);
  const fall = new THREE.Mesh(fallStrip(lip, out, -.04, -4.2, STREAM_WIDTH * .95, 2.3, 18), wf); fall.renderOrder = 4; group.add(fall);
  const fall2 = new THREE.Mesh(fallStrip(lip.clone().addScaledVector(out, .08), out, -.04, -4.2, STREAM_WIDTH * .7, 2.5, 18), wf); fall2.renderOrder = 5; group.add(fall2);
  const mist = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTexture(), color: 0xcfeaff, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.set(lip.x + out.x * 2.7 + (rnd() - .5) * 2, -3.9 + rnd() * .8, lip.z + out.z * 2.7 + (rnd() - .5) * 2); s.scale.setScalar(5 + rnd() * 3); s.userData.p = rnd() * TAU; group.add(s); mist.push(s);
  }
  const foam = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.6, 32), new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(lip.x + out.x * 2.5, -4.08, lip.z + out.z * 2.5); group.add(foam);

  // Wooden arched bridge (local x = along the deck, z = along the stream)
  const woodTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8a5a36'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) { g.fillStyle = rnd() < .5 ? 'rgba(50,28,14,.25)' : 'rgba(190,140,90,.18)'; g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 80, 1 + rnd() * 2); }
    g.strokeStyle = 'rgba(30,16,8,.7)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  });
  const wood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: .85 }), woodDark = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: .9 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x6d747c, roughness: .95, flatShading: true });
  const bridge = new THREE.Group(); bridge.position.set(BRIDGE.cx, 0, BRIDGE.cz); bridge.rotation.y = Math.atan2(-BRIDGE.az, BRIDGE.ax); group.add(bridge);
  const arch = (u) => { const s = 2 * u / BRIDGE.L; return BRIDGE.endY + (BRIDGE.archH - BRIDGE.endY) * (1 - s * s); };
  const N = 16, plankLen = BRIDGE.L / N;
  for (let k = 0; k < N; k++) {
    const u = ((k + .5) / N * 2 - 1) * BRIDGE.L / 2, slope = Math.atan((arch(u + .05) - arch(u - .05)) / .1);
    const p = new THREE.Mesh(new THREE.BoxGeometry(plankLen * 1.04, .14, BRIDGE.halfW * 2 + .1), wood); p.position.set(u, arch(u) - .07, 0); p.rotation.z = slope; p.castShadow = true; p.receiveShadow = true; bridge.add(p);
  }
  const railPts = (v, dy) => Array.from({ length: 13 }, (_, i) => { const u = (i / 12 * 2 - 1) * BRIDGE.L / 2; return new V3(u, arch(u) + dy, v); });
  [-1, 1].forEach(sd => {
    const v = sd * (BRIDGE.halfW + .02);
    const beam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(v, -.2)), 32, .1, 6), woodDark); beam.castShadow = true; bridge.add(beam);
    const hand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(v, 1.0)), 32, .06, 6), woodDark); hand.castShadow = true; bridge.add(hand);
    for (let i = 0; i <= 8; i++) { const u = (i / 8 * 2 - 1) * BRIDGE.L / 2, post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 1.05, 6), woodDark); post.position.set(u, arch(u) + .5, v); post.castShadow = true; bridge.add(post); }
    [-1, 1].forEach(e => lamps.add(bridge, e * BRIDGE.L / 2, arch(e * BRIDGE.L / 2) + 1.28, v, 0xffd68a, { headSize: .12, glowSize: 2.4, poolSize: 3, ground: .1 }));
    const a = Math.atan2(BRIDGE.az, BRIDGE.ax);
    colliders.push({ t: 'b', x: BRIDGE.cx + BRIDGE.tx * v, z: BRIDGE.cz + BRIDGE.tz * v, hw: BRIDGE.L / 2, hd: .08, rot: a });
  });
  [-1, 1].forEach(e => { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), stone); b.position.set(e * (BRIDGE.L / 2 + .15), -.25, 0); b.scale.set(1.1, .6, 1.5); b.rotation.y = e; b.castShadow = true; bridge.add(b); });

  // Lookout deck beyond the bridge
  const deck = new THREE.Group(); deck.position.set(LOOKOUT.x, 0, LOOKOUT.z); group.add(deck);
  const dm = new THREE.Mesh(new THREE.CylinderGeometry(LOOKOUT.r, LOOKOUT.r + .1, .16, 28), wood); dm.position.y = .0; dm.castShadow = true; dm.receiveShadow = true; deck.add(dm);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + .4, gap = Math.abs(((a - Math.atan2(-LOOKOUT.z + (-24.2), -LOOKOUT.x + 7.5)) + Math.PI * 3) % TAU - Math.PI) < .55;
    if (gap) continue;
    const x = Math.cos(a) * (LOOKOUT.r - .15), z = Math.sin(a) * (LOOKOUT.r - .15), post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 1.0, 6), woodDark); post.position.set(x, .55, z); post.castShadow = true; deck.add(post);
    colliders.push({ t: 'c', x: LOOKOUT.x + x, z: LOOKOUT.z + z, r: .16 });
    if (i % 4 === 0) lamps.add(deck, x, 1.28, z, 0xffd68a, { headSize: .12, glowSize: 2.4, poolSize: 3, ground: .09 });
  }
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, .12, .5), wood); bench.position.set(.3, .55, -1.4); bench.castShadow = true; deck.add(bench);
  [-.6, .6].forEach(dx => { const l = new THREE.Mesh(new THREE.BoxGeometry(.1, .5, .4), woodDark); l.position.set(.3 + dx, .3, -1.4); deck.add(l); });
  colliders.push({ t: 'b', x: LOOKOUT.x + .3, z: LOOKOUT.z - 1.4, hw: .8, hd: .3, rot: 0 });
  const signTex = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#4b2f1c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffc83d'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#ffd98a'; g.font = '700 26px sans-serif'; g.textAlign = 'center'; g.fillText('LOOKOUT POINT', w / 2, 40); g.font = '16px sans-serif'; g.fillText('waterfall view this way', w / 2, 70); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .64), new THREE.MeshStandardMaterial({ map: signTex, roughness: .8 })); sign.position.set(-1.3, 1.1, .6); sign.rotation.y = .5; deck.add(sign);
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 1.0, 6), woodDark); signPost.position.set(-1.3, .5, .55); deck.add(signPost);

  function update(time, on) {
    const day = 1 - on;
    mats.forEach(m => { m.uniforms.uTime.value = reduced ? 0 : time; m.uniforms.uDay.value = day; });
    if (reedMat.userData.sh) reedMat.userData.sh.uniforms.uTime.value = reduced ? 0 : time;
    mist.forEach((s, i) => { s.material.opacity = (.16 + .1 * Math.sin(time * .9 + s.userData.p)) * (.5 + .5 * day); const k = 1 + .08 * Math.sin(time * 1.3 + i); s.scale.setScalar((5 + (i % 3)) * k * 1.0); });
    foam.scale.setScalar(1 + .06 * Math.sin(time * 2.2)); foam.material.opacity = .28 + .12 * day;
  }
  return { update, stream: STREAM_SAMPLES, lip: { x: lip.x, z: lip.z } };
}

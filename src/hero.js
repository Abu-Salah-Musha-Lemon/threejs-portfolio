import * as THREE from 'three';

const lerp = THREE.MathUtils.lerp, damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

/** Friendly explorer robot: white shell, lemon accents, glowing core, visor eyes, antenna and jet pack. */
export function createHero(parent) {
  const root = new THREE.Group(); root.position.set(0, 0, 3); parent.add(root);
  const body = new THREE.Group(); body.rotation.order = 'YXZ'; root.add(body);
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xf2f6f8, roughness: .32, metalness: .12, clearcoat: .6, clearcoatRoughness: .25 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xffc83d, roughness: .4, metalness: .1, emissive: 0x4a3300, emissiveIntensity: .35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: .5, metalness: .6 });
  const visor = new THREE.MeshPhysicalMaterial({ color: 0x0b1a28, roughness: .08, metalness: .8, clearcoat: 1, emissive: 0x0b3a48, emissiveIntensity: .35 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9ff8ff });
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x1b6f80, emissive: 0x57e8ff, emissiveIntensity: 1.8, roughness: .3 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = cast; parent.add(m); return m; };
  const sph = (r, seg = 20) => new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2 | 0));
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);

  // torso, pelvis, belt, chest core
  add(body, sph(.3), dark, 0, .98, 0, 1.15, .7, .9);
  const torso = add(body, cap(.42, .42), shell, 0, 1.5, 0, 1.05, 1, .85);
  add(body, sph(.3), accent, 0, 1.6, .31, 1.1, .75, .32);
  const core = add(body, new THREE.CylinderGeometry(.1, .1, .05, 20), coreMat, 0, 1.6, .405, 1, 1, 1, false); core.rotation.x = Math.PI / 2;
  const ring = add(body, new THREE.TorusGeometry(.135, .022, 8, 24), dark, 0, 1.6, .4, 1, 1, 1, false);
  const belt = add(body, new THREE.TorusGeometry(.4, .05, 8, 28), accent, 0, 1.13, 0, 1, .86, 1); belt.rotation.x = Math.PI / 2;
  add(body, new THREE.CylinderGeometry(.1, .12, .16, 12), dark, 0, 2.0, 0);

  // jet pack
  add(body, new THREE.BoxGeometry(.58, .72, .26), dark, 0, 1.52, -.42);
  const flames = [];
  [-1, 1].forEach(s => {
    add(body, new THREE.CylinderGeometry(.09, .1, .22, 12), shell, s * .17, 1.1, -.5);
    const f = add(body, new THREE.ConeGeometry(.08, .42, 10), flameMat, s * .17, .8, -.5, 1, 0.001, 1, false); f.rotation.x = Math.PI; flames.push(f);
  });

  // head
  const head = new THREE.Group(); head.position.set(0, 2.27, 0); body.add(head);
  add(head, sph(.5, 28), shell, 0, 0, 0, 1.08, .92, .98);
  add(head, sph(.42, 24), visor, 0, -.02, .3, .98, .72, .5);
  const eyes = [-1, 1].map(s => add(head, sph(.07, 14), eyeMat, s * .16, .02, .505, 1.15, 1.6, .35, false));
  const mouth = add(head, new THREE.TorusGeometry(.075, .013, 6, 16, Math.PI), eyeMat, 0, -.1, .515, 1, 1, 1, false); mouth.rotation.z = Math.PI;
  [-1, 1].forEach(s => { const e = add(head, new THREE.CylinderGeometry(.13, .13, .1, 16), accent, s * .53, 0, 0); e.rotation.z = Math.PI / 2; const d = add(head, new THREE.CylinderGeometry(.07, .07, .11, 12), dark, s * .535, 0, 0, 1, 1, 1, false); d.rotation.z = Math.PI / 2; });
  const antenna = new THREE.Group(); antenna.position.set(.1, .44, 0); head.add(antenna);
  add(antenna, new THREE.CylinderGeometry(.018, .022, .34, 8), dark, 0, .17, 0, 1, 1, 1, false);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0x5a4300, emissive: 0xffc83d, emissiveIntensity: 1.6 });
  add(antenna, sph(.065, 14), bulbMat, 0, .37, 0, 1, 1, 1, false);

  // arms and legs, pivoting at shoulders and hips
  const mkArm = (s) => {
    const a = new THREE.Group(); a.position.set(s * .6, 1.84, 0); body.add(a);
    add(a, sph(.19), accent, 0, 0, 0);
    add(a, cap(.1, .3), shell, 0, -.27, 0);
    add(a, sph(.1), dark, 0, -.5, 0, 1, 1, 1, false);
    const fore = new THREE.Group(); fore.position.set(0, -.5, 0); fore.rotation.x = -.25; a.add(fore);
    add(fore, cap(.09, .26), shell, 0, -.22, 0);
    add(fore, sph(.12), dark, 0, -.5, 0);
    return { a, fore };
  };
  const mkLeg = (s) => {
    const l = new THREE.Group(); l.position.set(s * .22, .98, 0); body.add(l);
    add(l, cap(.12, .26), dark, 0, -.23, 0);
    add(l, sph(.125), accent, 0, -.43, .01);
    add(l, cap(.105, .26), shell, 0, -.62, 0);
    add(l, new THREE.BoxGeometry(.3, .18, .46), shell, 0, -.87, .07);
    add(l, new THREE.BoxGeometry(.31, .045, .47), accent, 0, -.96, .07, 1, 1, 1, false);
    return l;
  };
  const armL = mkArm(-1), armR = mkArm(1), legL = mkLeg(-1), legR = mkLeg(1);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.62, 28), new THREE.MeshBasicMaterial({ color: 0x050c11, transparent: true, opacity: .5, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .015; root.add(shadow);

  return { pivot: root, body, head, torso, armL, armR, legL, legR, antenna, eyes, core: coreMat, bulb: bulbMat, flames, shadow, phase: 0, squash: 0, blinkAt: 2, blink: 0, wasAir: false, lean: 0, swing: 0 };
}

/** state: { moving, sprint, air, vy, time, dt, speed }. */
export function animateHero(h, st) {
  const { dt, time } = st;
  const walk = st.moving && !st.air;
  h.phase += dt * (st.sprint ? 16 : 11) * (walk ? 1 : 0);
  h.swing = damp(h.swing, walk ? (st.sprint ? .95 : .7) : 0, 12, dt);
  const s = Math.sin(h.phase) * h.swing;
  const air = st.air, up = air && st.vy > 0;
  const tgt = {
    legLx: air ? (up ? -.55 : -.2) : s, legRx: air ? (up ? .45 : .35) : -s,
    armLx: air ? -1.5 : -s * .9, armRx: air ? -1.35 : s * .9,
    armLz: air ? .65 : .05, armRz: air ? -.65 : -.05,
  };
  const k = 16;
  h.legL.rotation.x = damp(h.legL.rotation.x, tgt.legLx, k, dt); h.legR.rotation.x = damp(h.legR.rotation.x, tgt.legRx, k, dt);
  h.armL.a.rotation.x = damp(h.armL.a.rotation.x, tgt.armLx, k, dt); h.armR.a.rotation.x = damp(h.armR.a.rotation.x, tgt.armRx, k, dt);
  h.armL.a.rotation.z = damp(h.armL.a.rotation.z, tgt.armLz, k, dt); h.armR.a.rotation.z = damp(h.armR.a.rotation.z, tgt.armRz, k, dt);
  if (h.wasAir && !air) h.squash = 1; h.wasAir = air;
  h.squash = Math.max(0, h.squash - dt * 4.5);
  const bob = air ? 0 : walk ? Math.abs(Math.sin(h.phase)) * .07 : Math.sin(time * 1.8) * .022;
  h.body.position.y = damp(h.body.position.y, bob - h.squash * .07, 18, dt);
  const sq = Math.sin(h.squash * Math.PI);
  h.body.scale.set(1 + sq * .08, 1 - sq * .1, 1 + sq * .08);
  h.lean = damp(h.lean, air ? .12 : walk ? (st.sprint ? .2 : .09) : 0, 8, dt);
  h.body.rotation.x = h.lean;
  h.head.rotation.x = Math.sin(time * 1.1) * .03 - h.lean * .5; h.head.rotation.y = walk ? 0 : Math.sin(time * .6) * .18;
  h.antenna.rotation.z = Math.sin(time * 3.1) * .12 - (walk ? .2 : 0) + Math.sin(h.phase * 2) * h.swing * .12;
  h.antenna.rotation.x = Math.cos(time * 2.3) * .08;
  h.blinkAt -= dt; if (h.blinkAt < 0) { h.blink = .14; h.blinkAt = 2.4 + Math.random() * 3; }
  h.blink = Math.max(0, h.blink - dt);
  h.eyes.forEach(e => { e.scale.y = h.blink > 0 ? .2 : 1.6; });
  h.core.emissiveIntensity = 1.6 + Math.sin(time * 3.2) * .6 + (air ? .8 : 0);
  h.bulb.emissiveIntensity = 1.4 + Math.sin(time * 5) * .5;
  const fl = air ? (up ? 1 : .45) : 0;
  h.flames.forEach((f, i) => { const t = fl * (.85 + .15 * Math.sin(time * 40 + i * 2)); f.scale.y = damp(f.scale.y, Math.max(.001, t), 22, dt); });
}

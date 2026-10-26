import * as THREE from 'three';
import { getGlowTexture } from './lamps.js';

const C = (h) => new THREE.Color(h);
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Day and night. One value (dayT, 0 night to 1 day) drives the sky dome, fog, lights, exposure, sea,
 * clouds, sun and moon. The sky passes through a warm dusk tint while it changes.
 * `on` (0 day to 1 night) tells lamps, fireflies and beacons how bright to be.
 */
export function createAtmosphere(scene, { hemi, key, rim, waterMat, renderer, reduced = false }) {
  const nightTop = C(0x040812), nightHor = C(0x0f1c2e), duskHor = C(0xf0a56e), dayTop = C(0x3b86cc), dayHor = C(0xcfe7f4);
  const top = new THREE.Color(), hor = new THREE.Color(), bottom = new THREE.Color();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: top }, hor: { value: hor }, bot: { value: bottom } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 hor;uniform vec3 bot;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.?mix(hor,top,pow(h,.55)):mix(hor,bot,smoothstep(0.,-.35,h));gl_FragColor=vec4(c,1.);}',
  }));
  dome.renderOrder = -10; scene.add(dome);

  const starPos = new Float32Array(550 * 3); let sd = 4242;
  const r = () => ((sd = (1664525 * sd + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 550; i++) { starPos[i * 3] = (r() - .5) * 260; starPos[i * 3 + 1] = 18 + r() * 90; starPos[i * 3 + 2] = (r() - .5) * 260; }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xd7f2fa, size: .15, transparent: true, opacity: .78, sizeAttenuation: true, depthWrite: false, fog: false }));
  scene.add(stars);

  const disc = (color, size, pos, haloColor, haloSize) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(size, 40, 20), new THREE.MeshBasicMaterial({ color, transparent: true, fog: false }));
    m.position.set(...pos); scene.add(m);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTexture(), color: haloColor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    h.position.set(...pos); h.scale.set(haloSize, haloSize, 1); scene.add(h);
    return { m, h };
  };
  const moon = disc(0xaac8dc, 8.8, [75, 52, -145], 0x9bbfe7, 36);
  const sun = disc(0xfff2c9, 7, [-75, 58, -140], 0xffd58a, 64);

  // Low clouds floating over the sea, visible from the game camera.
  const cloudTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = 70 + r() * 116, y = 110 + r() * 40, rad = 36 + r() * 34, gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(), a = r() * Math.PI * 2, rad = 70 + r() * 60;
    g.position.set(Math.cos(a) * rad, 8 + r() * 8, Math.sin(a) * rad);
    for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(cloudMat); const sc = 26 + r() * 22; s.scale.set(sc * 1.6, sc, 1); s.position.set((k - 1) * sc * .6, r() * 2, (r() - .5) * 8); g.add(s); }
    g.userData.speed = .35 + r() * .5; scene.add(g); clouds.push(g);
  }

  const baseKeyPos = { night: new THREE.Vector3(24, 36, 12), day: new THREE.Vector3(-26, 39, 18) };
  const waterNight = C(0x0a2231), waterDay = C(0x2b7894);
  let dayT = 0, target = 0;

  function apply() {
    const t = smooth(dayT);
    top.copy(nightTop).lerp(dayTop, t);
    if (t < .5) hor.copy(nightHor).lerp(duskHor, t * 2); else hor.copy(duskHor).lerp(dayHor, (t - .5) * 2);
    bottom.copy(hor).multiplyScalar(.55);
    scene.fog.color.copy(hor); scene.fog.density = lerp(.0084, .0052, t); scene.background.copy(hor);
    hemi.color.copy(C(0x6f93b8)).lerp(C(0xdcecf7), t); hemi.groundColor.copy(C(0x142235)).lerp(C(0x77806a), t); hemi.intensity = lerp(1.25, 2.5, t);
    key.color.copy(C(0x9db8ec)).lerp(C(0xfff0d2), t); key.intensity = lerp(1.15, 3.7, t); key.position.lerpVectors(baseKeyPos.night, baseKeyPos.day, t);
    rim.color.copy(C(0x6fc7e7)).lerp(C(0xcfe9ff), t); rim.intensity = lerp(1.1, .55, t);
    renderer.toneMappingExposure = lerp(1.1, 1.3, t);
    stars.material.opacity = (1 - t) * (1 - t) * .8;
    moon.m.material.opacity = 1 - t; moon.h.material.opacity = (1 - t) * .37;
    sun.m.material.opacity = t; sun.h.material.opacity = t * .55;
    const dusk = 1 - Math.abs(t - .5) * 2;
    cloudMat.opacity = t * .8; cloudMat.color.setHex(0xffffff).lerp(C(0xffc08a), dusk * .6);
    if (waterMat) { waterMat.color.copy(waterNight).lerp(waterDay, t); waterMat.opacity = lerp(.82, .78, t); }
    api.on = clamp((.62 - t) / .3, 0, 1);
  }

  const api = {
    on: 1,
    isDay: () => target > .5,
    setTarget(day, instant = false) { target = day ? 1 : 0; if (instant) { dayT = target; apply(); } },
    update(dt, time) {
      if (dayT !== target) { dayT += clamp(target - dayT, -dt * .55, dt * .55); apply(); }
      if (!reduced) for (const c of clouds) { c.position.x += dt * c.userData.speed; if (c.position.x > 140) c.position.x = -140; }
    },
  };
  apply();
  return api;
}

import * as THREE from 'three';

let glowTex = null;
export function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)');
  gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

const lerp = THREE.MathUtils.lerp;
const sphereGeo = new THREE.SphereGeometry(1, 14, 10);
const planeGeo = new THREE.PlaneGeometry(1, 1);

/**
 * Every post, pylon and bollard registers here. All of them get an emissive head, a halo sprite and a
 * pool of light on the ground. A small pool of real PointLights follows the player and is handed to
 * the nearest lamps, so dozens of lamps look lit while the GPU only shades a handful of lights.
 */
function createLampSystem() {
  const shared = new Map();
  let lamps = [];
  let pool = [];

  function get(color) {
    let s = shared.get(color);
    if (!s) {
      const c = new THREE.Color(color);
      s = {
        head: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(.25), emissive: c, emissiveIntensity: .08, roughness: .35, metalness: .2 }),
        sprite: new THREE.SpriteMaterial({ map: getGlowTexture(), color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
        pool: new THREE.MeshBasicMaterial({ map: getGlowTexture(), color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      };
      shared.set(color, s);
    }
    return s;
  }

  return {
    headMat: (color) => get(color).head,
    reset() { lamps = []; pool = []; },
    /** Adds a lamp at local (x,y,z) of `parent`. Returns the lamp's world position. */
    add(parent, x, y, z, color, o = {}) {
      const { headSize = .13, glowSize = 2.6, poolSize = 3.4, ground = .67, head = true, light = true } = o;
      const s = get(color);
      if (head) { const m = new THREE.Mesh(sphereGeo, s.head); m.scale.setScalar(headSize); m.position.set(x, y, z); parent.add(m); }
      const sp = new THREE.Sprite(s.sprite); sp.scale.set(glowSize, glowSize, 1); sp.position.set(x, y, z); parent.add(sp);
      const p = new THREE.Mesh(planeGeo, s.pool); p.rotation.x = -Math.PI / 2; p.scale.set(poolSize, poolSize, 1); p.position.set(x, ground, z); p.renderOrder = 2; parent.add(p);
      parent.updateWorldMatrix(true, false);
      const pos = parent.localToWorld(new THREE.Vector3(x, y, z));
      lamps.push({ pos, color: new THREE.Color(color), light });
      return pos;
    },
    initLights(scene, count) {
      pool = Array.from({ length: count }, () => {
        const light = new THREE.PointLight(0xffd68a, 0, 11, 2); scene.add(light);
        return { light, lamp: null, fading: false };
      });
    },
    count: () => lamps.length,
    /** on: 0 (day) to 1 (night). */
    update(on, playerPos, time) {
      const flick = 1 + Math.sin(time * 7.3) * .015;
      for (const s of shared.values()) {
        s.head.emissiveIntensity = lerp(.08, 2.4, on);
        s.sprite.opacity = on * .62 * flick;
        s.pool.opacity = on * .42;
      }
      if (!pool.length) return;
      const near = lamps.filter(l => l.light)
        .map(l => ({ l, d: (l.pos.x - playerPos.x) ** 2 + (l.pos.z - playerPos.z) ** 2 }))
        .sort((a, b) => a.d - b.d).slice(0, pool.length).map(o => o.l);
      for (const p of pool) if (p.lamp && !near.includes(p.lamp)) p.fading = true;
      for (const l of near) {
        if (pool.some(p => p.lamp === l && !p.fading)) continue;
        const slot = pool.find(p => !p.lamp || (p.fading && p.light.intensity < .05));
        if (slot) { slot.lamp = l; slot.fading = false; slot.light.position.copy(l.pos); slot.light.color.copy(l.color); }
      }
      for (const p of pool) {
        const target = p.lamp && !p.fading ? 15 * on : 0;
        p.light.intensity = lerp(p.light.intensity, target, .12);
        if (p.fading && p.light.intensity < .05) { p.lamp = null; p.fading = false; }
      }
    },
  };
}

export const lamps = createLampSystem();

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
export const makeRand = (seed) => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

/** One grass tuft = 7 flat blades fanned out. Base sits at y = 0. */
export function tuftGeometry(rnd, height = .55) {
  const blades = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.ConeGeometry(.035, height * (.7 + rnd() * .5), 3, 1); g.scale(1, 1, .28); g.translate(0, g.parameters.height / 2, 0);
    g.rotateZ((rnd() - .5) * .8); g.rotateX((rnd() - .5) * .8); g.rotateY(rnd() * TAU);
    g.translate((rnd() - .5) * .16, 0, (rnd() - .5) * .16); blades.push(g);
  }
  return mergeGeometries(blades);
}

/** Wind sway shared by grass and reeds. Update with mat.userData.setTime(t). */
export function windMaterial(strength = .24) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 }; mat.userData.sh = sh;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>\nfloat ph=instanceMatrix[3].x*.7+instanceMatrix[3].z*.5;\ntransformed.x+=sin(uTime*1.7+ph)*position.y*${strength};\ntransformed.z+=cos(uTime*1.3+ph)*position.y*${strength * .5};`);
  };
  mat.userData.setTime = (t) => { if (mat.userData.sh) mat.userData.sh.uniforms.uTime.value = t; };
  return mat;
}

/** Broad-leaf fern / jungle plant: 8 arching leaves (like the leafy corners in the reference). */
export function fernGeometry(rnd) {
  const leaves = [];
  for (let i = 0; i < 8; i++) {
    const len = .9 + rnd() * .5, g = new THREE.PlaneGeometry(.42, len, 2, 7);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const t = (p.getY(k) + len / 2) / len, x = p.getX(k);
      p.setXYZ(k, x * (1 - t * .55), Math.sin(t * 1.4) * len * .55 + Math.abs(x) * .22 - t * t * .25, t * len * .85);
    }
    g.computeVertexNormals(); g.rotateY((i / 8) * TAU + rnd() * .5); g.translate(0, .02, 0); leaves.push(g);
  }
  return mergeGeometries(leaves);
}

/** White daisy: yellow centre and 7 petals, colors baked into vertices. */
export function flowerGeometry(petalColor = 0xffffff) {
  const parts = [], petal = new THREE.Color(petalColor), centre = new THREE.Color(0xffc83d);
  const paint = (g, c) => { const a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const c = new THREE.SphereGeometry(.035, 6, 4); c.translate(0, .16, 0); parts.push(paint(c, centre));
  for (let i = 0; i < 7; i++) { const g = new THREE.SphereGeometry(.05, 5, 3); g.scale(1.5, .25, .6); g.translate(.07, 0, 0); g.rotateY((i / 7) * TAU); g.translate(0, .16, 0); parts.push(paint(g, petal)); }
  const stem = new THREE.CylinderGeometry(.006, .008, .16, 4); stem.translate(0, .08, 0); parts.push(paint(stem, new THREE.Color(0x3f6e34)));
  return mergeGeometries(parts.map(g => g.toNonIndexed()));
}

export function mushroomGeometry() {
  const cap = new THREE.SphereGeometry(.11, 10, 6, 0, TAU, 0, Math.PI / 2); cap.translate(0, .12, 0);
  const stem = new THREE.CylinderGeometry(.03, .04, .13, 8); stem.translate(0, .065, 0);
  const paint = (g, c) => { const col = new THREE.Color(c), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = col.r; a[i + 1] = col.g; a[i + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  return mergeGeometries([paint(cap.toNonIndexed(), 0xc23b2b), paint(stem.toNonIndexed(), 0xefe6d2)]);
}

export function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

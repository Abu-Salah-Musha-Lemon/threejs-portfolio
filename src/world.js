/**
 * LEMONVERSE · PERSONAL EDITION
 * A hand-built, asset-free architectural 3D level. Every monument is real Three.js geometry.
 * Existing game controls and API are preserved for src/main.js.
 */
import * as THREE from 'three';
import { zones, settings } from './content.js';
import { lamps } from './lamps.js';
import { buildNature } from './nature.js';
import { createAtmosphere } from './atmosphere.js';
import { resolve, avoid } from './collision.js';
import { createHero, animateHero } from './hero.js';
import { buildTerrain, groundHeight, terrainBlocked, TOWER_SITES } from './terrain.js';
import { buildAnimals } from './animals.js';
const colliders = [];
const REDUCED_MOTION = typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const V3 = THREE.Vector3;
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const TAU = Math.PI * 2;
const rand = (() => { let seed = 20261023; return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296); })();
const MT = {
  basalt: new THREE.MeshStandardMaterial({color:0x131e2d, roughness:.88, metalness:.16}),
  slate: new THREE.MeshStandardMaterial({color:0x263647, roughness:.74, metalness:.25}),
  stone: new THREE.MeshStandardMaterial({color:0x506272, roughness:.79, metalness:.15}),
  porcelain: new THREE.MeshStandardMaterial({color:0xc3d4d8, roughness:.42, metalness:.32}),
  darkMetal: new THREE.MeshStandardMaterial({color:0x172b3a, roughness:.34, metalness:.82}),
  titanium: new THREE.MeshStandardMaterial({color:0x6f8e9c, roughness:.27, metalness:.8}),
  gold: new THREE.MeshStandardMaterial({color:0xe4c98c, roughness:.29, metalness:.8}),
  forest: new THREE.MeshStandardMaterial({color:0x365855, roughness:.89, flatShading:true}),
  foliage: new THREE.MeshStandardMaterial({color:0x658a77, roughness:.91, flatShading:true}),
  glass: new THREE.MeshPhysicalMaterial({color:0x88d1dc,metalness:.1,roughness:.12,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.12}),
  window: new THREE.MeshStandardMaterial({color:0x84deec,metalness:.53,roughness:.15,transparent:true,opacity:.72,emissive:0x276e87,emissiveIntensity:.36,side:THREE.DoubleSide}),
  light: new THREE.MeshBasicMaterial({color:0xa4eff0}),
  road: new THREE.MeshStandardMaterial({color:0x263d4a,metalness:.33,roughness:.8}),
};
const glowMat = (color, intensity=2) => new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,metalness:.22,roughness:.34});
const colorMat = (color) => new THREE.MeshPhysicalMaterial({color,metalness:.67,roughness:.25,clearcoat:.9,clearcoatRoughness:.19,emissive:color,emissiveIntensity:.22});
const cubeGeo = new THREE.BoxGeometry(1,1,1);
const roundedCache = new Map();
function roundedGeom(w,h,d,r=.12) {
  const key=[w,h,d,r].join(':'); if(roundedCache.has(key))return roundedCache.get(key);
  const radius=Math.min(r,w/4,h/4,d/4);
  const s=new THREE.Shape(); const hw=w/2-radius, hh=h/2-radius;
  s.moveTo(-hw,-hh);s.lineTo(hw,-hh);s.lineTo(hw,hh);s.lineTo(-hw,hh);s.closePath();
  const geometry=new THREE.ExtrudeGeometry(s,{depth:Math.max(.003,d-2*radius), bevelEnabled:true, bevelThickness:radius, bevelSize:radius, bevelSegments:3, curveSegments:5, steps:1});
  geometry.translate(0,0,-(d-2*radius)/2);geometry.computeVertexNormals();
  roundedCache.set(key,geometry);return geometry;
}
function mesh(parent,geometry,material,x=0,y=0,z=0,cast=true){ const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m; }
function box(parent,w,h,d,x,y,z,material,cast=true){const m=mesh(parent,cubeGeo,material,x,y,z,cast);m.scale.set(w,h,d);return m;}
function rounded(parent,w,h,d,x,y,z,material,r=.12){return mesh(parent,roundedGeom(w,h,d,r),material,x,y,z);}
function cyl(parent,top,bottom,h,x,y,z,material,segments=48){return mesh(parent,new THREE.CylinderGeometry(top,bottom,h,segments),material,x,y,z);}
function ring(parent,rad,tube,x,y,z,material,vertical=false,segments=90){const m=mesh(parent,new THREE.TorusGeometry(rad,tube,12,segments),material,x,y,z,false);if(!vertical)m.rotation.x=-Math.PI/2;return m;}
function tube(parent,points,radius,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(36,points.length*9),radius,8,false),material);}
function newGlowTexture(){ const c=document.createElement('canvas'); c.width=c.height=128;const g=c.getContext('2d');const rad=g.createRadialGradient(64,64,1,64,64,63);rad.addColorStop(0,'rgba(255,255,255,0.9)');rad.addColorStop(.14,'rgba(255,255,255,0.37)');rad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rad;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t; }
const glowTexture=newGlowTexture();
function glow(parent,color,x,y,z,size=5,opacity=.45){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;}
function createLabel(zone){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#0c1826ed';ctx.beginPath();ctx.roundRect(18,22,988,213,20);ctx.fill();ctx.strokeStyle=zone.color+'bb';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=zone.color;ctx.fillRect(52,54,7,148);ctx.fillStyle='#edf8f9';ctx.font='bold 62px Arial, sans-serif';ctx.fillText(zone.name,92,121);ctx.fillStyle='#a5bcc4';ctx.font='32px monospace';ctx.fillText(`${zone.chapter} / ${zone.subtitle.toUpperCase()}  ·  EXPLORE  ↗`,94,185);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;return new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false});}
function pillar(parent,x,z,height,mat=MT.titanium){rounded(parent,.49,height,.49,x,height/2+.36,z,mat,.09);cyl(parent,.39,.46,.24,x,.4,z,MT.darkMetal,8);cyl(parent,.4,.4,.16,x,height+.33,z,MT.gold,8);lamps.add(parent,x,height+.55,z,0xffd68a,{headSize:.12,glowSize:2.3,poolSize:2.8,ground:.67});}

function createIsland(world){
  const island=new THREE.Group();world.add(island);
  cyl(island,38,37.4,.43,0,-.35,0,MT.slate,128);
  cyl(island,38.5,37.7,.45,0,-.75,0,MT.titanium,128);
  cyl(island,37,39,2.5,0,-2.1,0,MT.basalt,128);
  cyl(island,35.3,37.5,.46,0,-3.5,0,MT.darkMetal,128);
  ring(island,38.04,.10,0,-.54,0,glowMat(0x398993,.55));
  ring(island,37.1,.045,0,-3.28,0,glowMat(0x3cc7db,.75));
  const water=mesh(world,new THREE.CircleGeometry(135,128),new THREE.MeshPhysicalMaterial({color:0x0a2231,roughness:.23,metalness:.67,transparent:true,opacity:.82,clearcoat:.9}),0,-4.11,0,false);water.rotation.x=-Math.PI/2;
  const lines=[];for(let r=7;r<=36;r+=7){const pts=[];for(let n=0;n<=110;n++){const a=n/110*TAU;pts.push(new V3(Math.cos(a)*r,-.09,Math.sin(a)*r));}lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x7faeb5,transparent:true,opacity:r>25?.16:.08})));}
  lines.forEach(l=>world.add(l));
  const seamMat=new THREE.LineBasicMaterial({color:0x8ab3c3,transparent:true,opacity:.105});
  const seamPts=[];for(let a=0;a<TAU;a+=Math.PI/14){seamPts.push(new V3(5*Math.cos(a),-.075,5*Math.sin(a)),new V3(36*Math.cos(a),-.075,36*Math.sin(a)));}
  world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seamPts),seamMat));
  for(let i=0;i<36;i++){const a=i/36*TAU;const x=Math.cos(a)*36.6,z=Math.sin(a)*36.6;const p=mesh(world,new THREE.DodecahedronGeometry(.65+(i%4)*.17,0),i%4?MT.stone:MT.slate,x,-.08,z,false);p.scale.set(1,.35,1);p.rotation.y=a;}
  island.userData.water=water.material;
  return island;
}
function buildWalk(world,zone){
  const dx=zone.x,dz=zone.z-1,d=Math.hypot(dx,dz),dirX=dx/d,dirZ=dz/d;
  const a=3.9,b=d-4.2;const pathLength=b-a;
  const g=new THREE.Group();world.add(g);g.position.set(dirX*(a+b)/2,0,1+dirZ*(a+b)/2);g.rotation.y=Math.atan2(dx,dz);
  rounded(g,3.8,.24,pathLength,0,.105,0,MT.darkMetal,.11);
  rounded(g,3.32,.17,pathLength-.15,0,.25,0,MT.road,.07);
  const neon=glowMat(zone.color,.78);
  box(g,.055,.028,pathLength-.16,1.72,.359,0,neon,false);
  box(g,.055,.028,pathLength-.16,-1.72,.359,0,neon,false);
  for(let i=1;i<pathLength/.98;i++){
    const z=-pathLength/2+i*.98;
    box(g,2.8,.015,.065,0,.341,z,MT.stone,false);
    if(i%4===0){box(g,.25,.025,.14,1.3,.36,z,neon,false);box(g,.25,.025,.14,-1.3,.36,z,neon,false);}
  }
  for(const end of [-1,1]){
    rounded(g,4.2,.34,.54,0,.17,end*(pathLength/2-.2),MT.titanium,.08);
  }
  for(let j=0;j<3;j++){
    const z=-pathLength/2+2+j*(pathLength-4)/2;
    for(const x of [-2.55,2.55]){
      cyl(g,.075,.10,1.3,x,.77,z,MT.titanium,12);
      cyl(g,.20,.16,.12,x,1.47,z,neon,16);
      {const wp=lamps.add(g,x,1.66,z,zone.color,{headSize:.14,glowSize:3,poolSize:3.8,ground:.37});colliders.push({t:'c',x:wp.x,z:wp.z,r:.22});}
    }
  }
}
function buildHub(world,animated){
  const g=new THREE.Group();g.position.set(0,0,1);world.add(g);
  cyl(g,7.15,7.5,.47,0,.25,0,MT.darkMetal,96);
  cyl(g,6.65,6.68,.10,0,.54,0,MT.slate,96);
  ring(g,7.04,.11,0,.55,0,glowMat(0x83eef0,1.5));
  ring(g,6.37,.026,0,.61,0,MT.gold);
  for(let i=0;i<16;i++){const a=i/16*TAU;const x=Math.cos(a)*6.85,z=Math.sin(a)*6.85;
    cyl(g,.11,.14,.11,x,.62,z,i%2?MT.gold:glowMat(0x8eeada,1.5),10);
  }
  cyl(g,2.37,2.65,.44,0,.86,0,MT.stone,12);
  cyl(g,2.03,2.12,.20,0,1.19,0,MT.gold,16);
  cyl(g,1.84,1.94,.28,0,1.42,0,MT.darkMetal,16);
  ring(g,1.77,.09,0,1.64,0,glowMat(0x7de7de,1.8));
  for(let i=0;i<8;i++){
    const a=i/8*TAU;
    const fin=rounded(g,.23,1.82,.55,Math.cos(a)*2.13,1.19,Math.sin(a)*2.13,MT.titanium,.08);fin.rotation.y=-a;
  }
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const xx=sx*4.65,zz=sz*4.65;
    pillar(g,xx,zz,1.65,MT.stone);
    cyl(g,.36,.33,.15,xx,2.2,zz,glowMat(0x8bf3ef,1.2),8);
  }
  const rig=new THREE.Group();rig.position.y=3.34;g.add(rig);
  const core=mesh(rig,new THREE.IcosahedronGeometry(1.20,2),new THREE.MeshPhysicalMaterial({color:0xa5f7e7,metalness:.35,roughness:.11,clearcoat:1,emissive:0x39bfc4,emissiveIntensity:.95}),0,0,0);
  const wire=mesh(rig,new THREE.IcosahedronGeometry(1.26,1),new THREE.MeshBasicMaterial({color:0xe9ffff,wireframe:true,transparent:true,opacity:.48}),0,0,0,false);
  const rings=[];
  rings.push(ring(rig,2.18,.095,0,0,0,MT.gold,true));
  rings.push(ring(rig,1.84,.072,0,0,0,glowMat(0x76f5ee,1.6),true));
  rings.push(ring(rig,2.41,.065,0,0,0,MT.titanium,true));
  rings[0].rotation.y=.4;rings[1].rotation.x=.73;rings[2].rotation.y=-1.04;
  glow(g,0x5ce3e2,0,3.3,0,6,.46);
  animated.push({tick(t,dt){rig.position.y=3.36+Math.sin(t*1.1)*.16;rig.rotation.y+=dt*.17;rings[0].rotation.x+=dt*.26;rings[1].rotation.z-=dt*.21;rings[2].rotation.y+=dt*.31;core.rotation.x+=dt*.18;wire.rotation.z-=dt*.13;}});
}
function platform(g,color){
  cyl(g,5.63,5.86,.53,0,.22,0,MT.darkMetal,80);
  cyl(g,5.30,5.30,.13,0,.54,0,MT.stone,80);
  cyl(g,4.93,5,.045,0,.631,0,MT.slate,80);
  ring(g,5.4,.11,0,.52,0,glowMat(color,1.2));
  ring(g,4.66,.035,0,.66,0,MT.gold);
  for(let i=0;i<12;i++){
    const a=i/12*TAU;const x=Math.cos(a)*5.09,z=Math.sin(a)*5.09;
    const h=.16;cyl(g,.105,.11,h,x,.72,z,i%3===0?MT.gold:lamps.headMat(color),8);
  }
  for(let a=0;a<8;a++){const angle=a/8*TAU;const x=Math.cos(angle)*4,z=Math.sin(angle)*4;
    const diamond=mesh(g,new THREE.OctahedronGeometry(.20),MT.gold,x,.74,z);diamond.scale.y=.35;diamond.rotation.y=angle;
  }
}
function createAbout(g,zone,animated){
  const metal=MT.titanium,green=glowMat(zone.color,1.3);
  cyl(g,2.6,3.05,.26,0,.78,0,MT.darkMetal,12);
  cyl(g,2.45,2.51,.12,0,.96,0,MT.gold,12);
  const arch=new THREE.Group();g.add(arch);
  for(const z of [-1.18,1.18]){
    const points=[];for(let i=0;i<=28;i++){const a=Math.PI-i/28*Math.PI;points.push(new V3(Math.cos(a)*2.55,1.09+Math.sin(a)*3.45,z));}
    tube(arch,points,.145,metal);
  }
  for(let i=0;i<=8;i++){
    const a=i/8*Math.PI;const x=Math.cos(a)*2.55,y=1.09+Math.sin(a)*3.45;
    tube(arch,[new V3(x,y,-1.18),new V3(x,y,1.18)],.048,i%2?MT.gold:metal);
  }
  for(const x of [-2.55,2.55])for(const z of [-1.18,1.18]){
    pillar(g,x,z,1.45,MT.stone);
  }
  const dome=mesh(g,new THREE.SphereGeometry(1.27,48,32),MT.glass,0,2.58,0,false);
  dome.scale.set(1,1.10,1);
  const display=new THREE.Group();display.position.set(0,2.58,0);g.add(display);
  const crystal=mesh(display,new THREE.IcosahedronGeometry(.82,1),colorMat(zone.color),0,0,0);
  const inlay=mesh(display,new THREE.IcosahedronGeometry(.87,0),new THREE.MeshBasicMaterial({color:0xecffff,wireframe:true,transparent:true,opacity:.63}),0,0,0,false);
  ring(display,1.10,.032,0,0,0,green,true).rotation.y=.6;
  glow(g,zone.color,0,2.58,0,4.8,.25);
  animated.push({tick(t,dt){display.rotation.y+=dt*.3;crystal.rotation.x+=dt*.21;crystal.position.y=Math.sin(t*1.5)*.1;inlay.rotation.z-=dt*.16;}});
}
function createSkills(g,zone,animated){
  const cool=glowMat(zone.color,1.35);
  cyl(g,2.25,2.62,.41,0,.84,0,MT.darkMetal,10);
  cyl(g,1.97,2.02,.13,0,1.10,0,MT.gold,10);
  const towers=[];
  for(let i=0;i<7;i++){
    const a=i/7*TAU,x=Math.cos(a)*3.02,z=Math.sin(a)*3.02,h=2.13+(i%3)*.56;
    const tower=new THREE.Group();tower.position.set(x,0,z);tower.rotation.y=-a;g.add(tower);
    rounded(tower,.93,h,.84,0,.71+h/2,0,MT.darkMetal,.18);
    rounded(tower,.78,h-.35,.09,0,.71+h/2,.43,MT.glass,.04);
    for(let j=0;j<5;j++){const hh=.95+j*(h-.5)/6;rounded(tower,.53,.07,.10,0,hh,.50,j%2?MT.gold:cool,.02);}
    rounded(tower,1.15,.21,1.04,0,.82+h,0,MT.titanium,.10);
    const gem=mesh(tower,new THREE.OctahedronGeometry(.35,0),cool,0,1.2+h,0);towers.push(gem);
  }
  const rig=new THREE.Group();rig.position.y=3.45;g.add(rig);
  const knot=mesh(rig,new THREE.TorusKnotGeometry(.78,.23,128,12,2,3),colorMat(zone.color));
  const orbit=ring(rig,1.62,.063,0,0,0,MT.gold,true);orbit.rotation.y=.65;
  const orbit2=ring(rig,1.98,.045,0,0,0,cool,true);orbit2.rotation.x=.82;
  glow(g,zone.color,0,3.4,0,4.7,.29);
  animated.push({tick(t,dt){rig.rotation.y+=dt*.32;knot.rotation.x-=dt*.16;orbit.rotation.z+=dt*.36;orbit2.rotation.y-=dt*.28;towers.forEach((o,i)=>o.position.y=3.2+(i%3)*.56+Math.sin(t*1.7+i)*.13);}});
}
function createProjects(g,zone,animated){
  const warm=glowMat(zone.color,1.2);
  for(let i=-1;i<=1;i++){
    const x=i*2.38;
    rounded(g,2.14,.31,1.38,x,.86,.14,MT.darkMetal,.13);
    rounded(g,2.05,3.32,.29,x,2.73,.05,MT.gold,.09);
    rounded(g,1.86,3.04,.18,x,2.73,.20,MT.darkMetal,.07);
    rounded(g,1.71,2.90,.045,x,2.73,.33,MT.window,.02);
    // Real 3D miniature exhibits, inside each gallery vitrine.
    const exhibit=new THREE.Group();exhibit.position.set(x,2.88,.53);g.add(exhibit);
    let object;
    if(i===-1){object=mesh(exhibit,new THREE.DodecahedronGeometry(.57,1),colorMat(zone.color));}
    else if(i===0){object=mesh(exhibit,new THREE.TorusKnotGeometry(.38,.13,72,9,2,3),MT.porcelain);}
    else {object=mesh(exhibit,new THREE.OctahedronGeometry(.66,1),colorMat(0x91c9e2));}
    const spinGlow=glow(g,zone.color,x,2.8,.44,2.2,.18);
    animated.push({tick(t,dt){object.rotation.y+=dt*(.22+i*.07);object.rotation.x+=dt*.13;object.position.y=Math.sin(t*1.4+i)*.12;spinGlow.material.opacity=.13+.045*Math.sin(t*2+i);}});
    rounded(g,1.30,.064,.053,x,1.77,.37,warm,.02);
    rounded(g,.95,.052,.054,x-.175,1.56,.375,MT.gold,.02);
    rounded(g,1.06,.052,.054,x-.12,1.40,.376,MT.porcelain,.02);
    const label=cyl(g,.26,.31,.10,x,.82,1.15,MT.gold,8);
    label.castShadow=false;
  }
  for(const x of [-3.8,3.8]){pillar(g,x,-1.42,3.1,MT.stone);glow(g,zone.color,x,4.12,-1.42,2.8,.19);}
  // Curved exhibition awning.
  for(const z of [-1.42,1.18]){
    const pts=[];for(let i=0;i<=15;i++){const x=-3.85+i/15*7.7;pts.push(new V3(x,4.5+.25*Math.cos(x/3.9*Math.PI),z));}
    tube(g,pts,.10,MT.titanium);
  }
}
function createContact(g,zone,animated){
  const violet=glowMat(zone.color,1.5);
  cyl(g,2.9,3.18,.25,0,.81,0,MT.darkMetal,12);
  cyl(g,2.74,2.75,.09,0,.98,0,MT.gold,12);
  const portal=new THREE.Group();portal.position.set(0,3.06,-.2);g.add(portal);
  // Framed, thick double arch with a luminous inner energy field.
  ring(portal,2.11,.30,0,0,0,MT.titanium,true);
  ring(portal,2.1,.13,0,0,.13,MT.gold,true);
  ring(portal,1.90,.10,0,0,.17,violet,true);
  const face=mesh(portal,new THREE.CircleGeometry(1.78,72),new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}),0,0,.09,false);
  for(let i=0;i<28;i++){const a=i/28*TAU;const x=Math.cos(a)*2.15,y=Math.sin(a)*2.15;
    const n=mesh(portal,new THREE.OctahedronGeometry(.09,0),i%3?MT.gold:violet,x,y,.19);n.scale.set(.65,1.6,.65);n.rotation.z=a;
  }
  for(const x of [-2.85,2.85]){
    pillar(g,x,.25,4.25,MT.stone);
    cyl(g,.44,.48,.18,x,4.72,.25,MT.gold,10);
    glow(g,zone.color,x,4.91,.25,3.2,.26);
  }
  const star=mesh(portal,new THREE.IcosahedronGeometry(.61,1),colorMat(zone.color),0,.02,.36);
  const swirl=ring(portal,1.45,.025,0,0,.31,MT.light,true);
  glow(g,zone.color,0,3.1,.3,6,.40);
  animated.push({tick(t,dt){portal.rotation.y=Math.sin(t*.67)*.12;star.rotation.y+=dt*.5;star.rotation.z+=dt*.16;star.scale.setScalar(1+Math.sin(t*1.9)*.08);face.material.opacity=.10+.06*(.5+.5*Math.sin(t*1.6));swirl.rotation.z+=dt*.22;}});
}
function scenery(world){
  const scatter=new THREE.Group();world.add(scatter);
  // Floating obelisks, museum pylons and light fixtures near the outer edge.
  for(let i=0;i<12;i++){
    const a=i/12*TAU+.12,x=Math.cos(a)*32,z=Math.sin(a)*32;
    const tower=new THREE.Group();tower.position.set(x,0,z);scatter.add(tower);
    cyl(tower,.66,.87,.29,0,.14,0,MT.darkMetal,8);
    rounded(tower,.68,2.18,.68,0,1.36,0,MT.stone,.07);
    rounded(tower,.28,1.72,.09,0,1.45,.39,lamps.headMat(i%3===0?0xf1d39e:0x79d6d4),.03);
    cyl(tower,.48,.41,.22,0,2.53,0,MT.gold,8);
    const m=mesh(tower,new THREE.OctahedronGeometry(.39,0),lamps.headMat(0xffd68a),0,3.15,0);
    m.rotation.y=a;
    const wp=lamps.add(tower,0,3.15,0,0xffd68a,{head:false,glowSize:4.2,poolSize:5.2,ground:-.04});
    colliders.push({t:'b',x:wp.x,z:wp.z,hw:.42,hd:.42,rot:0});
  }
  // Distant floating shards beyond the island create parallax and a sense of scale.
  for(let i=0;i<24;i++){
    const a=TAU*i/24+(rand()-.5)*.11,r=46+rand()*31;
    const x=Math.cos(a)*r,z=Math.sin(a)*r,y=1.1+rand()*5;
    const b=mesh(scatter,new THREE.OctahedronGeometry(.65+rand()*1.3,0),i%4===0?MT.titanium:MT.basalt,x,y,z,false);
    b.scale.set(.75,1.7,.75);b.rotation.set(rand(),rand()*TAU,rand());
  }
  // Repeated cove lights provide depth and a readable navigational rim.
  for(let i=0;i<44;i++){
    const a=i/44*TAU,x=Math.cos(a)*35.4,z=Math.sin(a)*35.4;
    cyl(scatter,.10,.12,.11,x,.14,z,i%4===0?MT.gold:lamps.headMat(0x65abb5),8).castShadow=false;
    if(i%4===2)lamps.add(scatter,x,.3,z,0x65abb5,{head:false,glowSize:1.6,poolSize:2.4,ground:-.04,light:false});
    if(i%4!==0)colliders.push({t:'c',x,z,r:.17});
  }
}
export function createWorld(container,{onStationClick=()=>{}}={}){
  colliders.length=0;lamps.reset();
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1220);scene.fog=new THREE.FogExp2(0x0b1220,.0084);
  const camera=new THREE.PerspectiveCamera(44,1,.1,700);
  camera.position.set(4,36,48);camera.lookAt(1,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
  renderer.domElement.style.cssText='display:block;width:100%;height:100%';renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(renderer.domElement);
  const ambient=new THREE.HemisphereLight(0xc2e2ef,0x152635,2.1);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffe8c1,3.3);sun.position.set(-26,39,18);sun.castShadow=true;
  sun.shadow.mapSize.set(window.innerWidth<800?1024:2048,window.innerWidth<800?1024:2048);
  Object.assign(sun.shadow.camera,{left:-41,right:41,top:42,bottom:-42,near:2,far:145});sun.shadow.bias=-.0003;sun.shadow.normalBias=.038;scene.add(sun);
  const rimLight=new THREE.DirectionalLight(0x6fc7e7,1.05);rimLight.position.set(25,18,-27);scene.add(rimLight);
  const world=new THREE.Group();scene.add(world);const island=createIsland(world);
  const animated=[];buildHub(world,animated);
  zones.forEach(z=>buildWalk(world,z));
  const hittables=[];const stationObjects=[];
  zones.forEach((zone,i)=>{
    const group=new THREE.Group();group.position.set(zone.x,0,zone.z);world.add(group);
    const color=new THREE.Color(zone.color).getHex();platform(group,color);
    if(zone.id==='about')createAbout(group,zone,animated);
    if(zone.id==='skills')createSkills(group,zone,animated);
    if(zone.id==='projects')createProjects(group,zone,animated);
    if(zone.id==='contact')createContact(group,zone,animated);
    const sign=new THREE.Sprite(createLabel(zone));sign.position.set(0,6.35,0);sign.scale.set(7.5,1.87,1);group.add(sign);
    const aura=glow(group,color,0,3.1,0,8,.12);
    const beacon=new THREE.PointLight(color,12,12,2);beacon.position.set(0,3.1,0);group.add(beacon);
    // Include all meshes / signage in the same clickable hit region.
    group.traverse(obj=>{if(obj.isMesh||obj.isSprite){obj.userData.zoneId=zone.id;hittables.push(obj);}});
    stationObjects.push({aura,sign,index:i,beacon});
  });
  scenery(world);
  const mobile=window.innerWidth<800;
  const isFree=(x,z,m=0)=>{
    if(Math.hypot(x,z-1)<10.2+m)return false;
    for(const zn of zones){
      if(Math.hypot(x-zn.x,z-zn.z)<8.2+m)return false;
      const abx=zn.x,abz=zn.z-1,t=clamp(((x)*abx+(z-1)*abz)/(abx*abx+abz*abz),0,1);
      if(Math.hypot(x-abx*t,z-(1+abz*t))<4.4+m)return false;
    }
    if(terrainBlocked(x,z,m))return false;
    for(const t of TOWER_SITES)if(Math.hypot(x-t.x,z-t.z)<2.8+m)return false;
    return Math.hypot(x,z)<=33;
  };
  const terrain=buildTerrain(world,{colliders,mobile,reduced:REDUCED_MOTION});
  const nature=buildNature(world,{isFree,colliders,mobile,reduced:REDUCED_MOTION});
  const animals=buildAnimals(world,{colliders,isFree,anchors:nature.anchors,mobile,reduced:REDUCED_MOTION});
  const atmosphere=createAtmosphere(scene,{hemi:ambient,key:sun,rim:rimLight,waterMat:island.userData.water,renderer,reduced:REDUCED_MOTION});
  lamps.initLights(scene,mobile?4:7);
  const player=createHero(scene);
  const headlamp=new THREE.PointLight(0xffe0a6,0,10,2);headlamp.position.set(0,2.7,.5);player.pivot.add(headlamp);
  const raycaster=new THREE.Raycaster();const mouse=new THREE.Vector2();const desiredCam=new V3();const cameraLook=new V3();
  let playing=false,zoom=1,stuck=0,autopilot=null,disposed=false,clickEnabled=true,pointerDown=null;
  let skipRender=false,mode='overview',y=0,vy=0,grounded=true,jumpBuf=0,baseFov=44;const look={yaw:0,pitch:0};const wdir=new THREE.Vector2();
  function pointerDownFn(e){pointerDown={x:e.clientX,y:e.clientY};}
  function pointerUpFn(e){
    if(!playing||!clickEnabled||document.pointerLockElement||!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>9)return;
    const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(hittables,false).find(i=>i.object.userData.zoneId);
    if(hit)onStationClick(hit.object.userData.zoneId);
  }
  renderer.domElement.addEventListener('pointerdown',pointerDownFn);renderer.domElement.addEventListener('pointerup',pointerUpFn);
  function resize(){const w=container.clientWidth||window.innerWidth,h=container.clientHeight||window.innerHeight;camera.aspect=w/h;baseFov=w<600?55:w<1000?48:44;if(mode==='overview')camera.fov=baseFov;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,w<700?1.15:1.6));renderer.setSize(w,h,false);}
  window.addEventListener('resize',resize);resize();
  function wheel(e){if(!playing||!clickEnabled||mode==='first')return;zoom=clamp(zoom+Math.sign(e.deltaY)*.07,.75,1.39);}
  renderer.domElement.addEventListener('wheel',wheel,{passive:true});
  const BOUND=37,GRAV=27,JUMP_V=9.4;
  const bound=(x,z)=>{const d=Math.hypot(x,z);return d>BOUND?[x*BOUND/d,z*BOUND/d]:[x,z];};
  function moveTo(x,z){let [bx,bz]=bound(x,z);const r=resolve(bx,bz,colliders,.46,y);[bx,bz]=bound(r.x,r.z);player.pivot.position.x=bx;player.pivot.position.z=bz;}
  function getPosition(){return player.pivot.position;}
  function distanceToZone(id){const z=zones.find(s=>s.id===id);return z?Math.hypot(player.pivot.position.x-z.x,player.pivot.position.z-z.z):Infinity;}
  function closestZone(){let zone=null,distance=Infinity;for(const z of zones){const d=distanceToZone(z.id);if(d<distance){zone=z;distance=d;}}return {zone,distance};}
  function warpTo(id){const z=zones.find(s=>s.id===id);if(!z)return;autopilot=null;y=0;vy=0;grounded=true;moveTo(z.x,z.z+3.6);player.body.rotation.y=Math.PI;if(mode!=='overview')look.yaw=0;}
  function goTo(id){autopilot=zones.find(s=>s.id===id)||null;}
  function setPlaying(v){playing=!!v;}
  function setClickEnabled(v){clickEnabled=!!v;}
  function setDaylight(v,instant=false){atmosphere.setTarget(!!v,instant);return !!v;}
  function isDaylight(){return atmosphere.isDay();}
  function toggleDaylight(){return setDaylight(!atmosphere.isDay());}
  function setCameraMode(m){
    if(!['overview','chase','first'].includes(m)||m===mode)return mode;
    mode=m;
    if(m!=='overview'){look.yaw=player.body.rotation.y+Math.PI;look.pitch=0;}
    else if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
    player.body.visible=m!=='first';player.shadow.visible=m!=='first';
    return mode;
  }
  function cycleCameraMode(){return setCameraMode({overview:'chase',chase:'first',first:'overview'}[mode]);}
  function addLook(dx,dy){if(mode==='overview')return;look.yaw-=dx;look.pitch=clamp(look.pitch-dy,-1.3,1.3);}
  function jump(){jumpBuf=.14;}
  function tick(dt,time,axes={x:0,y:0},sprint=false,paused=false){
    if(disposed)return {arrived:null};const d=clamp(dt,0,.05);
    atmosphere.update(d,time);const on=atmosphere.on;
    lamps.update(on,player.pivot.position,time);nature.update(time,on);terrain.update(time,on);
    animals.update(time,d,on,player.pivot.position);
    headlamp.intensity=lerp(headlamp.intensity,5*on,Math.min(1,d*4));
    if(!REDUCED_MOTION)animated.forEach(a=>a.tick(time,d));
    stationObjects.forEach(s=>{s.beacon.intensity=lerp(4,12,on);s.aura.material.opacity=(.05+.07*on)+Math.sin(time*1.1+s.index)*.03;s.sign.position.y=6.35+Math.sin(time*.8+s.index)*.09;});
    let arrived=null,moving=false;
    const input=new THREE.Vector2(axes.x,axes.y);if(input.lengthSq()>.003)autopilot=null;
    if(playing&&!paused){
      wdir.set(0,0);
      if(autopilot){
        const dest=new THREE.Vector2(autopilot.x,autopilot.z+3.1),here=new THREE.Vector2(player.pivot.position.x,player.pivot.position.z);
        wdir.copy(dest.sub(here));
        if(wdir.length()<.38){arrived=autopilot.id;autopilot=null;wdir.set(0,0);}
        else{wdir.normalize();const av=avoid(here.x,here.y,colliders,2.2);wdir.x+=av.x*1.8;wdir.y+=av.z*1.8;wdir.normalize();}
      }else{
        if(input.length()>1)input.normalize();
        if(mode==='overview')wdir.copy(input);
        else{const c=Math.cos(look.yaw),s=Math.sin(look.yaw);wdir.set(input.x*c+input.y*s,-input.x*s+input.y*c);}
      }
      moving=wdir.lengthSq()>.0001;
      jumpBuf=Math.max(0,jumpBuf-d);
      if(jumpBuf>0&&grounded){vy=JUMP_V;grounded=false;jumpBuf=0;}
      if(moving){
        const speed=sprint?11:7.1,bx=player.pivot.position.x,bz=player.pivot.position.z;
        moveTo(bx+wdir.x*speed*d,bz+wdir.y*speed*d);
        if(autopilot){stuck=Math.hypot(player.pivot.position.x-bx,player.pivot.position.z-bz)<speed*d*.25?stuck+d:0;if(stuck>.8){autopilot=null;stuck=0;}}
        if(mode!=='first'){let delta=Math.atan2(wdir.x,wdir.y)-player.body.rotation.y;while(delta>Math.PI)delta-=TAU;while(delta<-Math.PI)delta+=TAU;player.body.rotation.y+=delta*Math.min(1,d*14);}
      }
      if(mode==='first')player.body.rotation.y=look.yaw+Math.PI;
      const px=player.pivot.position.x,pz=player.pivot.position.z,gy=groundHeight(px,pz);
      if(grounded){y+=(gy-y)*Math.min(1,d*20);if(y-gy>.12){grounded=false;vy=0;}}
      else{vy-=GRAV*d;y+=vy*d;if(y<=gy&&vy<=0){y=gy;vy=0;grounded=true;}}
      player.pivot.position.y=y;
    }
    const gy2=groundHeight(player.pivot.position.x,player.pivot.position.z);
    player.shadow.position.y=(gy2-y)+.015;const sk=clamp(1-(y-gy2)*.22,.45,1);player.shadow.scale.set(sk,sk,1);
    animateHero(player,{moving,sprint,air:!grounded,vy,time,dt:d});
    const hp=player.pivot.position;
    const fovT=mode==='first'?(window.innerWidth<700?78:72):mode==='chase'?(window.innerWidth<700?62:54):baseFov;
    if(Math.abs(camera.fov-fovT)>.05){camera.fov=lerp(camera.fov,fovT,Math.min(1,d*6));camera.updateProjectionMatrix();}
    if(playing&&mode==='first'){
      camera.position.set(hp.x,hp.y+2.05+(moving&&grounded?Math.sin(time*11)*.035:0),hp.z);
      camera.rotation.order='YXZ';camera.rotation.set(look.pitch,look.yaw,0);cameraLook.copy(camera.position);
    }else if(playing&&mode==='chase'){
      const dist=(window.innerWidth<700?6.4:7.6)*clamp(zoom,.8,1.3),e=clamp(.3-look.pitch,.03,1.25);
      desiredCam.set(hp.x+Math.sin(look.yaw)*Math.cos(e)*dist,hp.y*.5+1.9+Math.sin(e)*dist,hp.z+Math.cos(look.yaw)*Math.cos(e)*dist);
      camera.position.lerp(desiredCam,Math.min(1,d*9));
      cameraLook.lerp(new V3(hp.x,hp.y*.5+1.9,hp.z),Math.min(1,d*12));camera.lookAt(cameraLook);
    }else{
      const offset=playing?(window.innerWidth<700?new V3(0,22.5,22.5):new V3(0,25,28)):new V3(0,38,47);
      offset.multiplyScalar(zoom);const focus=playing?new V3(hp.x,0,hp.z):new V3(3,0,0);
      desiredCam.copy(focus).add(offset);camera.position.lerp(desiredCam,Math.min(1,d*(playing?2.35:1.2)));
      cameraLook.lerp(focus.clone().add(new V3(0,1,0)),Math.min(1,d*3.4));camera.lookAt(cameraLook);
    }
    if(!skipRender)renderer.render(scene,camera);return {arrived};
  }
  function dispose(){disposed=true;window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDownFn);renderer.domElement.removeEventListener('pointerup',pointerUpFn);renderer.domElement.removeEventListener('wheel',wheel);const geos=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});roundedCache.forEach(g=>geos.add(g));materials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());geos.forEach(g=>g.dispose());glowTexture.dispose();renderer.dispose();renderer.domElement.remove();}
  return {tick,getPosition,distanceToZone,closestZone,warpTo,goTo,setPlaying,setClickEnabled,toggleDaylight,setDaylight,isDaylight,setCameraMode,cycleCameraMode,getCameraMode:()=>mode,addLook,jump,isAirborne:()=>!grounded,canvas:renderer.domElement,dispose,renderer,debug:{colliders,lampCount:()=>lamps.count(),trees:nature.treeCount,groves:nature.groveCount,animals:animals.counts,teleport:(x,z)=>{y=0;vy=0;grounded=true;player.pivot.position.set(x,0,z);},moveTo,getY:()=>y,groundHeight,setLook:(yw,pt)=>{look.yaw=yw;look.pitch=pt;},fastForward:(sec,t0=0)=>{skipRender=true;for(let i=0;i<sec*20;i++)tick(.05,t0+i*.05,{x:0,y:0},false,false);skipRender=false;}}};
}

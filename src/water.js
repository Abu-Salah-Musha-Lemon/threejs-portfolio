import * as THREE from 'three';

const VS = `varying vec2 vUv;varying vec3 vWorld;
void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;

const FS = `varying vec2 vUv;varying vec3 vWorld;
uniform float uTime;uniform float uDay;uniform float uCalm;uniform vec3 uSky;uniform vec3 uCam;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
  float edge=uCalm>.5?vUv.x:abs(vUv.x-.5)*2.;      // 0 centre, 1 bank
  float depth=1.-edge;
  vec2 w=vWorld.xz;
  vec2 flow=uCalm>.5?vec2(uTime*.03,uTime*.02):vec2(0.,0.);
  vec2 p=uCalm>.5?w*1.3+flow:vec2(vUv.x*6.,vUv.y*1.1-uTime*.7);
  float r1=noise(p*2.4+vec2(0.,uCalm>.5?uTime*.15:-uTime*.9));
  float r2=noise(p*5.5-vec2(uTime*.3,uTime*.6*(1.-uCalm)));
  float ripple=r1*.6+r2*.4;
  // pebble bed seen through shallow water
  float pb=noise(w*7.)*.6+noise(w*19.)*.4;
  vec3 bed=mix(vec3(.47,.41,.30),vec3(.58,.58,.55),noise(w*3.))*(.55+.5*pb);
  vec3 shallow=mix(vec3(.05,.20,.24),vec3(.22,.64,.66),uDay);
  vec3 deep=mix(vec3(.02,.10,.16),vec3(.04,.34,.46),uDay);
  vec3 body=mix(shallow,deep,smoothstep(.15,.95,depth));
  float vis=smoothstep(.0,.6,depth)*.88+ripple*.06;       // how opaque the water body is over the bed
  vec3 col=mix(bed*mix(.35,1.,uDay),body,clamp(.38+vis*.62,0.,1.));
  // sky reflection (fresnel)
  vec3 v=normalize(uCam-vWorld);
  float fres=pow(1.-clamp(v.y,0.,1.),3.)*.75+.08;
  col=mix(col,uSky*mix(.8,1.25,uDay),fres*.5);
  // sun and moon glints
  float g=pow(noise(p*16.+vec2(uTime*1.3,-uTime*.9)),10.);
  col+=g*mix(vec3(.35,.45,.7),vec3(1.,.95,.8),uDay)*mix(.9,1.5,uDay);
  // white water riffles (streams only), like the shallows in the reference
  float zone=smoothstep(.4,.72,noise(vec2(vUv.y*.28,4.3)));
  float rif=smoothstep(.66,.92,noise(vec2(vUv.x*9.,vUv.y*1.6-uTime*1.5))*1.2)*zone*(1.-uCalm);
  col=mix(col,vec3(.92,.98,1.),rif*.7);
  // shore foam
  float foam=smoothstep(.8,1.,edge)*(.45+.55*noise(p*6.+uTime*.7));
  col=mix(col,vec3(.9,.97,1.),foam*.55);
  float a=mix(.62,.95,smoothstep(.0,.5,depth))*(1.-smoothstep(.93,1.,edge));
  gl_FragColor=vec4(col,a);
}`;

const FALL_FS = `varying vec2 vUv;uniform float uTime;uniform float uDay;
float hash(float n){return fract(sin(n)*43758.5453);}
void main(){
  float c=floor(vUv.x*18.);float h=hash(c*7.3);
  float f=fract(vUv.y*3.6-uTime*(1.6+h*1.4)+h*5.);
  float streak=smoothstep(0.,.45,f)*smoothstep(1.,.45,f);
  float edge=smoothstep(0.,.1,vUv.x)*smoothstep(1.,.9,vUv.x);
  vec3 base=mix(vec3(.55,.82,.92),vec3(.95,.99,1.),streak)*mix(.5,1.,uDay);
  float a=(.5+.4*streak)*edge*(1.-smoothstep(.82,1.,vUv.y)*.75);
  gl_FragColor=vec4(base,a);
}`;

export function makeWaterMaterial(calm = false) {
  return new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uDay: { value: 0 }, uCalm: { value: calm ? 1 : 0 }, uSky: { value: new THREE.Color(0x9fc4d8) }, uCam: { value: new THREE.Vector3(0, 40, 40) } },
  });
}
export function makeFallMaterial() {
  return new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: FALL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uDay: { value: 0 } } });
}
/** Call once per frame for every water material. */
export function updateWater(mats, time, day, camPos, sky, reduced) {
  for (const m of mats) {
    const u = m.uniforms; u.uTime.value = reduced ? 0 : time; u.uDay.value = day;
    if (u.uCam) { u.uCam.value.copy(camPos); u.uSky.value.copy(sky); }
  }
}

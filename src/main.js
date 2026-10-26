import { createWorld } from './world.js';
import { profile, zones } from './content.js';

const $ = (selector) => document.querySelector(selector);
const el = (id) => document.getElementById(id);
const escapeHTML = (v) => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const safeUrl = (u) => typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u) ? u : '';
const isRealEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith('@example.com');
const externalLink = (label, href, extra='↗') => safeUrl(href) ? `<a class="project-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span>${escapeHTML(extra)}</span></a>` : '';
const progressKey = 'lemonverse:visited:v1';
const storage = {
  read() {try {const value=JSON.parse(localStorage.getItem(progressKey)||'[]');return Array.isArray(value)?value.filter(id=>zones.some(z=>z.id===id)):[];}catch{return []; }},
  save(ids){try{localStorage.setItem(progressKey,JSON.stringify([...ids]));}catch{}}
};
const state = { playing: false, visited: new Set(storage.read()), modal: null, lastFocus: null, queuedWin:false, winShown:false, sound:false, audio:null, near:null, toastTimer:null, destroyed:false };
const keys = new Set();
const stick = { x:0, y:0, pointerId:null };
let world = null;
let prevTime=performance.now();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function chime(success=false){
  if(!state.sound)return;
  try {
    const ctx=state.audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.state==='suspended')ctx.resume();
    const now=ctx.currentTime;
    (success?[523,659,784,1047]:[430,650]).forEach((hz,i)=>{
      const osc=ctx.createOscillator(), gain=ctx.createGain();
      osc.type='sine';osc.frequency.value=hz;
      gain.gain.setValueAtTime(.0001,now+i*.09);
      gain.gain.exponentialRampToValueAtTime(.08,now+i*.09+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.09+.26);
      osc.connect(gain).connect(ctx.destination);osc.start(now+i*.09);osc.stop(now+i*.09+.3);
    });
  }catch{}
}
function toast(message){
  const t=el('toast');t.textContent=message;t.classList.add('show');
  clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>t.classList.remove('show'),3100);
}
function renderQuest(){
  el('mission-list').innerHTML=zones.map(z=>`<button type="button" class="mission-item ${state.visited.has(z.id)?'done':''}" data-quest="${z.id}"><span class="quest-icon" style="--zone:${z.color}">${state.visited.has(z.id)?'✓':z.chapter}</span><span>${escapeHTML(z.subtitle)}</span><span class="quest-arrow">${state.visited.has(z.id)?'✓':'↗'}</span></button>`).join('');
  const num=state.visited.size;
  el('discovered').textContent=String(num).padStart(2,'0');
  el('mission-progress').style.width=`${num/4*100}%`;
  if(el('map-locations')) renderMap();
}
function renderMap(){
  el('map-locations').innerHTML=zones.map(z=>`<button class="map-location" type="button" data-warp="${z.id}" style="--zone:${z.color}"><span class="map-marker">${escapeHTML(z.symbol)}</span><span class="map-location-copy"><small>CHAPTER ${z.chapter} ${state.visited.has(z.id)?'• DISCOVERED':'• UNDISCOVERED'}</small><strong>${escapeHTML(z.name)}</strong><span>${escapeHTML(z.subtitle)}</span></span><span class="map-warp">WARP ↗</span></button>`).join('');
}
function aboutHTML(){
  const facts=profile.facts.map(f=>`<div class="fact"><strong>${escapeHTML(f.value)}</strong><span>${escapeHTML(f.label)}</span></div>`).join('');
  return `<div class="about-content"><span class="small-cap">PLAYER PROFILE / ${escapeHTML(profile.name)}</span><h3 class="profile-name">${escapeHTML(profile.name)}</h3><p class="role">${escapeHTML(profile.title)}</p><div class="divider"></div>${profile.about.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}<div class="facts">${facts}</div><div class="bio-timeline"><div><span class="small-cap">EXPERIENCE</span><strong>${escapeHTML(profile.experience.role)} · ${escapeHTML(profile.experience.company)}</strong><p>${escapeHTML(profile.experience.period)} · ${escapeHTML(profile.experience.work)}</p></div><div><span class="small-cap">EDUCATION</span><strong>${escapeHTML(profile.education)}</strong></div></div><div class="availability"><span class="live-pulse"></span>${escapeHTML(profile.availability)}<span>✳ ${escapeHTML(profile.location)}</span></div></div>`;
}
function skillsHTML(){
  return `<p class="section-lede">An interdisciplinary toolkit spanning full-stack development, business applications, brand design and visual storytelling.</p><div class="skills-grid">${profile.skills.map((s,i)=>`<article class="skill-card"><span class="skill-num">LOADOUT / 0${i+1}</span><div class="skill-title"><span>${escapeHTML(s.icon)}</span><h3>${escapeHTML(s.category)}</h3></div><div class="skill-chips">${s.items.map(tag=>`<span>${escapeHTML(tag)}</span>`).join('')}</div></article>`).join('')}</div><div class="certifications"><h3>ADDITIONAL TRAINING</h3>${profile.certifications.map(c=>`<div><span>↗</span>${escapeHTML(c)}</div>`).join('')}</div>`;
}
function projectCard(p,i){
  const art=safeUrl(p.image)||/^\.\/projects\/[\w\-./]+$/.test(p.image||'')?`<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)} screenshot" loading="lazy" decoding="async" />`:'';
  return `<article class="project-card" style="--project-accent:${escapeHTML(p.accent)}"><div class="project-header"><span>PROJECT ${escapeHTML(p.number)}</span><span>${escapeHTML(p.year)}</span></div><div class="project-body"><div class="project-art project-art-${i%6}">${art}<div class="art-orb"></div><span class="art-monogram">${escapeHTML(p.code)}</span></div><div class="project-copy"><span class="project-type">${escapeHTML(p.type)}</span><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p><div class="project-tags">${p.tags.map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div><div class="project-links">${externalLink('LIVE DEMO',p.live)}${externalLink('SOURCE CODE',p.github)}</div></div></div></article>`;
}
function projectRow(p){
  return `<article class="project-row" style="--project-accent:${escapeHTML(p.accent)}"><div><span class="project-type">${escapeHTML(p.type)}</span><h3>${escapeHTML(p.title)}</h3></div><p>${escapeHTML(p.description)}</p><div class="project-links">${externalLink('LIVE DEMO',p.live)}${externalLink('SOURCE CODE',p.github)}</div></article>`;
}
function projectsHTML(){
  const featured=profile.projects.filter(p=>p.featured), others=profile.projects.filter(p=>!p.featured);
  return `<p class="section-lede">Six public projects from Lemon's GitHub. Start with the featured three, then browse the rest.</p><div class="project-list">${featured.map(projectCard).join('')}</div>${others.length?`<h3 class="section-title">MORE PROJECTS</h3><div class="project-compact">${others.map(projectRow).join('')}</div>`:''}`;
}
function contactHTML(){
  const mail = isRealEmail(profile.email);
  return `<div class="contact-content"><p class="section-lede">Have a project, a design challenge, or a collaboration in mind? Connect with Lemon directly through his public professional channels.</p><div class="contact-address"><span>TRANSMISSION ADDRESS</span><strong>${escapeHTML(profile.email)}</strong></div>${profile.replyTime?`<p class="reply-note">${escapeHTML(profile.replyTime)}</p>`:''}${mail?`<a class="cta contact-cta" href="mailto:${escapeHTML(profile.email)}?subject=Hello%20from%20LEMONVERSE">SEND A MESSAGE <span>↗</span></a><button type="button" class="outline-btn copy-email" data-copy-email>COPY EMAIL</button>`:`<div class="placeholder-warning">✳ Set your real email in <code>src/content.js</code> to enable the contact button.</div>`}<div class="socials">${externalLink('GITHUB',profile.github)}${externalLink('LINKEDIN',profile.linkedin)}${externalLink('BEHANCE',profile.behance)}${externalLink('YOUTUBE',profile.youtube)}${safeUrl(profile.resume)?externalLink('RESUME',profile.resume):''}</div><div class="transmission-note"><span class="live-pulse"></span> ${escapeHTML(profile.availability)}</div></div>`;
}
const contentRenderers={about:aboutHTML,skills:skillsHTML,projects:projectsHTML,contact:contactHTML};
function openModal(id){
  if(state.modal) closeModal(true);
  const node=el(id); if(!node) return;
  state.lastFocus=document.activeElement;
  node.hidden=false;state.modal=id;
  world?.setClickEnabled(false);
  document.body.classList.add('modal-open');
  (node.querySelector('[role="dialog"]')||node).focus({preventScroll:true});
}
function closeModal(silent=false){
  if(!state.modal)return;
  const current=state.modal;
  el(current).hidden=true;state.modal=null;document.body.classList.remove('modal-open');
  world?.setClickEnabled(true);
  if(!silent && state.lastFocus?.isConnected)state.lastFocus.focus({preventScroll:true});
  if(!silent && current==='details' && state.queuedWin && !state.winShown){
    state.queuedWin=false;state.winShown=true;openModal('complete-overlay');chime(true);
  }
}
function openZone(id){
  const z=zones.find(z=>z.id===id);if(!z)return;
  const freshly=!state.visited.has(id);
  if(freshly){state.visited.add(id);storage.save(state.visited);renderQuest();chime();}
  el('detail-chapter').textContent=`CHAPTER ${z.chapter}`;
  el('detail-symbol').textContent=z.symbol;el('detail-symbol').style.color=z.color;
  el('detail-kicker').textContent=`${z.name} / ${z.subtitle.toUpperCase()}`;
  el('detail-title').textContent=z.heading;
  el('detail-content').innerHTML=contentRenderers[id]();
  el('next-zone').dataset.next=zones[(zones.indexOf(z)+1)%zones.length].id;
  openModal('details');
  if(freshly){toast(`✓ CHAPTER ${z.chapter} DISCOVERED`);if(state.visited.size===zones.length)state.queuedWin=true;}
}
function warp(id){
  if(!state.playing)enterWorld();
  closeModal(true);
  world?.warpTo(id);
  openZone(id);
}
function enterWorld(){
  if(state.playing)return;
  state.playing=true;
  el('intro').classList.add('intro-exit');
  el('hud').hidden=false;
  world?.setPlaying(true);
  toast('MISSION STARTED · DISCOVER ALL 4 STATIONS');
  // The intro remains in the DOM for accessibility, but is no longer interactive.
  el('intro').hidden=true;
}
function quickHTML(){
  const sec=(id,title,html)=>`<section class="quick-section" id="quick-${id}"><h2>${title}</h2>${html}</section>`;
  return sec('about','About',aboutHTML())+sec('skills','Skills and tools',skillsHTML())+sec('projects','Projects',projectsHTML())+sec('contact','Contact',contactHTML());
}
function openQuick(){
  el('quick-content').innerHTML=quickHTML();
  openModal('quick-overlay');
  el('quick-overlay').querySelector('.quick-panel').scrollTop=0;
}
function showInstructions(){openModal('how-overlay');}
function handleStationClick(id){
  if(state.modal)return;
  if(world.distanceToZone(id)<=5.8)openZone(id);
  else {world.goTo(id);toast(`AUTO-WALKING TO ${zones.find(z=>z.id===id).name}`);}
}
function interactNearby(){
  if(state.modal||!state.playing)return;
  const {zone,distance}=world.closestZone();
  if(zone&&distance<6)openZone(zone.id);else toast('GET CLOSER TO A GLOWING STATION');
}
function updateNear(){
  if(!state.playing||!world)return;
  const {zone,distance}=world.closestZone();
  state.near=zone && distance<6?zone:null;
  el('interact').hidden=!state.near||!!state.modal;
  if(state.near)el('interact-name').textContent=state.visited.has(zone.id)?`REVISIT ${zone.name}`:`DISCOVER ${zone.name}`;
  const p=world.getPosition();
  el('coords').textContent=`X ${p.x.toFixed(1)}   Z ${p.z.toFixed(1)}`;
  el('location-name').textContent=state.near?.name||'CENTRAL HUB';
  if(!state.modal) el('hint-text').textContent=state.near?'PRESS E TO EXPLORE': 'FOLLOW THE GLOWING SIGNALS';
  const mobileBtn=el('touch-interact'); mobileBtn.classList.toggle('is-near',!!state.near);
}
function gameLoop(t){
  if(state.destroyed||!world)return;
  const dt=Math.min((t-prevTime)/1000,.06)||.016;prevTime=t;
  const input={x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x,
    y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+stick.y};
  const paused=!!state.modal || document.hidden;
  const outcome=world.tick(dt,t/1000,input,keys.has('ShiftLeft')||keys.has('ShiftRight'),paused);
  if(outcome.arrived&&!paused)openZone(outcome.arrived);
  if(state.playing)updateNear();
  requestAnimationFrame(gameLoop);
}
async function copyEmail(button){
  try{await navigator.clipboard.writeText(profile.email);button.textContent='COPIED ✓';}
  catch{button.textContent=profile.email;}
  setTimeout(()=>{button.textContent='COPY EMAIL';},2200);
}
function installEvents(){
  el('start').addEventListener('click',enterWorld);
  el('intro-how').addEventListener('click',showInstructions);
  el('help').addEventListener('click',showInstructions);
  el('map-btn').addEventListener('click',()=>openModal('map-overlay'));
  el('quick-view').addEventListener('click',openQuick);
  el('quick-view-hud').addEventListener('click',openQuick);
  el('close-quick').addEventListener('click',()=>closeModal());
  el('quick-enter').addEventListener('click',()=>{closeModal(true);enterWorld();});
  el('quick-overlay').addEventListener('click',event=>{
    const jump=event.target.closest('[data-jump]');
    if(jump){document.getElementById('quick-'+jump.dataset.jump)?.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});}
    const copy=event.target.closest('[data-copy-email]');
    if(copy)copyEmail(copy);
  });
  el('detail-content').addEventListener('click',event=>{const copy=event.target.closest('[data-copy-email]');if(copy)copyEmail(copy);});
  const panel=el('mission-panel'),toggle=el('mission-toggle');
  const setCollapsed=v=>{panel.classList.toggle('collapsed',v);toggle.textContent=v?'▾':'▴';toggle.setAttribute('aria-expanded',String(!v));toggle.setAttribute('aria-label',v?'Expand mission panel':'Collapse mission panel');};
  setCollapsed(matchMedia('(max-width:800px)').matches);
  toggle.addEventListener('click',()=>setCollapsed(!panel.classList.contains('collapsed')));
  el('close-details').addEventListener('click',()=>closeModal());
  el('close-map').addEventListener('click',()=>closeModal());
  el('close-how').addEventListener('click',()=>closeModal());
  el('got-it').addEventListener('click',()=>closeModal());
  el('interact-btn').addEventListener('click',interactNearby);
  el('touch-interact').addEventListener('click',interactNearby);
  el('complete-continue').addEventListener('click',()=>closeModal());
  el('complete-contact').addEventListener('click',()=>{closeModal(true);warp('contact');});
  el('next-zone').addEventListener('click',e=>{const id=e.currentTarget.dataset.next;warp(id);});
  el('sound').addEventListener('click',()=>{
    state.sound=!state.sound;el('sound').classList.toggle('active',state.sound);
    el('sound').setAttribute('aria-label',state.sound?'Disable sound':'Enable sound');
    toast(state.sound?'SOUND ENABLED':'SOUND MUTED');if(state.sound)chime();
  });
  el('daynight').addEventListener('click',()=>{const day=world.toggleDaylight();el('daynight').textContent=day?'☀':'☾';toast(day?'DAYLIGHT MODE':'NIGHT MODE');});
  el('restart').addEventListener('click',()=>{
    state.visited.clear();state.queuedWin=false;state.winShown=false;storage.save(state.visited);renderQuest();toast('QUEST PROGRESS RESET');
  });
  el('mission-list').addEventListener('click',event=>{const b=event.target.closest('[data-quest]');if(b)warp(b.dataset.quest);});
  el('map-locations').addEventListener('click',event=>{const b=event.target.closest('[data-warp]');if(b)warp(b.dataset.warp);});
  document.addEventListener('click',event=>{if(event.target.matches('[data-close]'))closeModal();});
  document.addEventListener('keydown',event=>{
    const tag=event.target?.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    if(event.code==='Escape' && state.modal){event.preventDefault();closeModal();return;}
    if(event.code==='KeyM' && state.playing && !event.repeat){event.preventDefault();state.modal?closeModal():openModal('map-overlay');return;}
    if(event.code==='KeyE' && state.playing && !state.modal && !event.repeat){event.preventDefault();interactNearby();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight'].includes(event.code)){
      if(state.playing)event.preventDefault();keys.add(event.code);
    }
    // Basic focus trap within open dialog.
    if(event.key==='Tab' && state.modal){
      const root=el(state.modal);const focusable=[...root.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(e=>e.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>keys.clear());
  // Virtual joystick: pointer capture works for both touch and mouse.
  const stickEl=el('joystick'),knob=el('joystick-knob');
  function updateStick(event){
    const r=stickEl.getBoundingClientRect();
    const dx=event.clientX-(r.left+r.width/2),dy=event.clientY-(r.top+r.height/2);
    const len=Math.hypot(dx,dy)||1, max=r.width*.31;
    const scale=Math.min(1,max/len);
    const x=dx*scale,y=dy*scale;
    stick.x=x/max;stick.y=y/max;
    knob.style.transform=`translate(${x}px,${y}px)`;
  }
  stickEl.addEventListener('pointerdown',event=>{event.preventDefault();stick.pointerId=event.pointerId;stickEl.setPointerCapture(event.pointerId);updateStick(event);});
  stickEl.addEventListener('pointermove',event=>{if(stick.pointerId===event.pointerId){event.preventDefault();updateStick(event);}});
  function resetStick(event){if(event.pointerId!==stick.pointerId)return;stick.pointerId=null;stick.x=stick.y=0;knob.style.transform='translate(0,0)';}
  stickEl.addEventListener('pointerup',resetStick);stickEl.addEventListener('pointercancel',resetStick);stickEl.addEventListener('lostpointercapture',()=>{stick.pointerId=null;stick.x=stick.y=0;knob.style.transform='translate(0,0)';});
}

function handleFailure(error){
  console.error('LEMONVERSE could not initialize:',error);
  el('loading').hidden=true;
  el('intro').hidden=true;
  el('hud').hidden=true;
  const f=el('fallback');f.hidden=false;
  const links=el('fallback-links');
  links.innerHTML=zones.map(z=>`<button class="outline-btn" type="button" data-fallback="${z.id}">${escapeHTML(z.subtitle)} ↗</button>`).join('');
  links.addEventListener('click',event=>{const id=event.target.closest('[data-fallback]')?.dataset.fallback;if(id)openZone(id);});
}
function initialize(){
  installEvents();renderQuest();renderMap();
  if(!HTMLCanvasElement.prototype.getContext)throw new Error('Canvas unavailable');
  // createWorld gives the actual WebGL renderer a chance to throw on unsupported devices.
  world=createWorld(el('game'),{onStationClick:handleStationClick});
  window.__devverseReady=true;
  el('loading').classList.add('loaded');
  setTimeout(()=>el('loading').hidden=true,reducedMotion?10:580);
  requestAnimationFrame(gameLoop);
}
try { initialize(); } catch(error){handleFailure(error);}

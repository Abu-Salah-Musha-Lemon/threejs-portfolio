"""Interface/mission tests with a Three.js adapter stub; NOT a real WebGL render test."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
p=Path(__file__).parent
html=(p/'index.html').read_text()
html=re.sub(r'<link[^>]+href="https?://[^>]+>', '', html)
html=re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
html=re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
html=html.replace('</head>', '<style>'+ (p/'src/style.css').read_text() +'</style></head>')
content=(p/'src/content.js').read_text().replace('export const','const')
main=(p/'src/main.js').read_text().replace("import { createWorld } from './world.js';",'').replace("import { profile, zones } from './content.js';",'')
stub='''function createWorld(container,{onStationClick}={}){let position={x:0,z:3},day=false;return {
 tick(dt,t,axes){position.x+=axes.x*dt*5;position.z+=axes.y*dt*5;return {arrived:null}},getPosition(){return position},
 distanceToZone(id){return 4},closestZone(){return {zone:zones[0],distance:4}},
 warpTo(id){let z=zones.find(z=>z.id===id);position={x:z.x,z:z.z+3.6}},goTo(id){let z=zones.find(z=>z.id===id);position={x:z.x,z:z.z+3.6}},
 setPlaying(){},setClickEnabled(){},toggleDaylight(){day=!day;return day},dispose(){} } }'''
results=[]
with sync_playwright() as pl:
 browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,720),(390,844),(768,1024),(1440,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_script_tag(content=content+'\n'+stub+'\n'+main)
  page.wait_for_timeout(100)
  assert page.locator('#start').is_visible(), 'start missing'
  if width==1440:
   page.screenshot(path=str(p/'preview-intro.png'))
  page.click('#start',force=True)
  assert page.locator('#hud').is_visible(), f'hud missing, errors={errors}'
  page.locator('#map-btn').click(force=True)
  assert page.locator('#map-overlay').is_visible(), 'map missing'
  page.locator('[data-warp="about"]').click(force=True)
  assert 'Abu Salah Musha Lemon' in page.locator('#detail-content').inner_text()
  assert 'TELCo' in page.locator('#detail-content').inner_text()
  page.locator('#next-zone').click(force=True)
  assert 'Laravel 11' in page.locator('#detail-content').inner_text()
  page.locator('#next-zone').click(force=True)
  for name in ['StockGenie','ERP Pro Admin Panel','E-Commerce Platform','mediCash','ASML NU-CSE','Personal Portfolio']:
   assert name in page.locator('#detail-content').inner_text(), name
  assert page.locator('.project-card').count()==6
  assert page.locator('.project-link').count()>=9
  if width==1440: page.screenshot(path=str(p/'preview-projects.png'))
  page.locator('#next-zone').click(force=True)
  assert page.locator('a[href="mailto:lemonahmed512@gmail.com?subject=Hello%20from%20LEMONVERSE"]').count()==1
  assert page.locator('a[href="https://www.behance.net/abu-salah-musha"]').count()==1
  assert page.locator('#discovered').inner_text()=='04'
  page.locator('#close-details').click(force=True)
  assert page.locator('#complete-overlay').is_visible()
  page.locator('#complete-continue').click(force=True)
  page.locator('#daynight').click(force=True)
  assert page.locator('#daynight').inner_text()=='☀'
  metrics=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth,ready:window.__devverseReady})''')
  assert not errors, errors
  assert metrics['scrollWidth']<=width, metrics
  results.append({'size':f'{width}x{height}','status':'PASS','projects':6,'overflow':False,'errors':errors})
  page.close()
 browser.close()
print(json.dumps(results,indent=2))

const {chromium}=require(process.env.CODEX_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/prp/','/dr/']){
  await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'domcontentloaded'});await page.waitForSelector('.motion-control');
  const dom=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),missingSymbols:[...document.querySelectorAll('use')].map(e=>e.getAttribute('href')).filter(h=>h&&h.startsWith('#')&&!document.getElementById(h.slice(1)))};});
  assert.deepEqual(dom.duplicates,[],route+' duplicate IDs');assert.deepEqual(dom.missingSymbols,[],route+' missing symbols');
  if(route==='/'){
   await page.locator('[data-layer="nerves"]').tap();assert.equal(await page.locator('[data-layer="nerves"]').getAttribute('aria-pressed'),'true');
   await page.locator('.hs[data-i="3"]').tap();assert.equal(await page.locator('.hand-info b').innerText(),'Articulações dos dedos');
   await page.locator('.lab-hand').screenshot({path:'tmp/qa/mobile-hand.png'});
   await page.locator('#prpExplorer').scrollIntoViewIfNeeded();await page.waitForTimeout(850);await page.locator('#prpExplorer').screenshot({path:'tmp/qa/mobile-tube.png'});
   await page.locator('#tstTrack').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
   const box=await page.locator('#tstTrack').boundingBox();
   await page.locator('#tstTrack').dispatchEvent('pointerdown',{clientX:300,clientY:box.y+100,pointerType:'touch',pointerId:1});
   await page.dispatchEvent('body','pointerup',{clientX:120,clientY:box.y+100,pointerType:'touch',pointerId:1});
   assert.equal(await page.locator('#tPrev').isEnabled(),true);
  }
  if(route==='/prp/'){
   for(let i=0;i<4;i++){
    await page.locator('.process-step').nth(i).tap();await page.waitForTimeout(800);assert.equal(await page.locator('#processStatus').innerText(),`0${i+1} / 04`);
    assert.equal(await page.locator('#processNext').isVisible(),true);
    await page.locator('.process-illus-inner').screenshot({path:`tmp/qa/mobile-scene-${i}.png`});
   }
   await page.locator('[data-fraction="2"]').tap();assert.equal(await page.locator('#microView').isVisible(),true);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);await page.locator('.motion-control').tap();assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('motion-paused')),true);
  }
  console.log(route+': touch targets, SVG references and IDs OK');
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Mobile interaction checks passed.');
})().catch(e=>{console.error(e);process.exit(1);});

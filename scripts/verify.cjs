const {chromium}=require(process.env.CODEX_NODE_MODULES+'/playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:4173';
(async()=>{
  fs.mkdirSync('tmp/qa',{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[],results=[];
  const context=await browser.newContext();
  context.on('page',page=>{page.on('pageerror',e=>errors.push(page.url()+': '+e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::'))errors.push(m.text());});});
  for(const width of (process.argv.includes('--interactions')?[]:[320,390,768,1024,1440])) for(const route of ['/','/prp/','/dr/']) {
    const page=await context.newPage();await page.setViewportSize({width,height:900});
    console.log('Checking '+route+' @ '+width);
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.motion-control');
    await page.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');});
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete),{},{timeout:15000});
    const broken=await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).map(i=>i.alt));
    assert.deepEqual(broken,[],`${route}@${width} broken images`);
    // Scroll the entire document to exercise lazy content, reveals and sticky layout.
    const documentHeight=await page.evaluate(()=>document.body.scrollHeight);
    for(let y=0;y<documentHeight;y+=750){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(30);}
    console.log('  scrolled '+documentHeight+'px');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route}@${width} overflow`);
    const links=await page.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)));
    for(const href of new Set(links)){
      const url=new URL(href),response=await context.request.get(url.href.split('#')[0],{timeout:10000});
      assert.equal(response.status(),200,'Broken local link: '+href);
      if(url.hash){const content=await response.text();const anchor=decodeURIComponent(url.hash.slice(1));assert.ok(content.includes('id="'+anchor+'"'),'Missing anchor: '+href);}
    }
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(500);
    if(width<1001){
      await page.locator('#burger').click();await page.waitForTimeout(200);
      assert.equal(await page.locator('#burger').getAttribute('aria-expanded'),'true');
      assert.equal(await page.locator('#drawer').evaluate(e=>e.inert),false);
      await page.keyboard.press('Escape');await page.waitForTimeout(100);
      assert.equal(await page.locator('#drawer').evaluate(e=>e.inert),true);
    }
    if(width===390||width===1440){
      await page.screenshot({path:`tmp/qa/final-${route.replaceAll('/','')||'home'}-${width}.png`});
      await page.screenshot({path:`tmp/qa/full-${route.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
    }
    results.push(`${route} @ ${width}px: layout, images, links, menu OK`);
    console.log(results.at(-1));
    await page.close();
  }
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.hand-info');
  for(const layer of ['bones','nerves','scan']){await page.locator(`[data-layer="${layer}"]`).click();assert.equal(await page.locator(`[data-layer="${layer}"]`).getAttribute('aria-pressed'),'true');}
  for(let i=0;i<4;i++){await page.locator(`#handLegend button[data-i="${i}"]`).click();assert.equal(await page.locator(`.hs[data-i="${i}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('.xr-item').first().click();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.xr-item').nth(1).getAttribute('aria-selected'),'true');
  await page.locator('#xray').screenshot({path:'tmp/qa/xray.png'});
  for(let i=0;i<await page.locator('.tab-btn').count();i++){await page.locator('.tab-btn').nth(i).click();assert.equal(await page.locator('.pane.on').count(),1);}
  await page.locator('#quizBody').scrollIntoViewIfNeeded();
  for(let i=0;i<5;i++){
    await page.locator('.qopt').first().evaluate(b=>{b.click();b.click();b.click();});
    await page.waitForTimeout(350);
    if(i<4)assert.equal(await page.locator('#qNum').innerText(),String(i+2),'Quiz skipped question');
  }
  assert.equal(await page.locator('.qres').count(),1);await page.locator('#qAgain').click();assert.equal(await page.locator('#qNum').innerText(),'1');
  await page.locator('.qopt').nth(2).click();await page.waitForTimeout(350);await page.locator('#qBack').click();assert.equal(await page.locator('#qNum').innerText(),'1');
  await page.locator('#tNext').scrollIntoViewIfNeeded();let guard=0;while(await page.locator('#tNext').isEnabled()&&guard++<10)await page.locator('#tNext').click();assert.equal(await page.locator('#tNext').isDisabled(),true);
  await page.goto(base+'/prp/',{waitUntil:'domcontentloaded'});await page.waitForSelector('#separation');
  for(const val of ['0','50','100']){await page.locator('#separation').fill(val);assert.equal(await page.locator('#separationValue').innerText(),val+'%');assert.equal(await page.locator('.separated-fluid').first().getAttribute('opacity'),String(+val/100));}
  await page.locator('[data-fraction="2"]').click();await page.waitForFunction(()=>document.querySelector('#microView img').naturalWidth>0);assert.equal(await page.locator('#microView').isVisible(),true);await page.locator('#prpExplorer').screenshot({path:'tmp/qa/microscopy.png'});
  await page.locator('[data-fraction="0"]').click();
  for(let i=0;i<4;i++){await page.locator(`[data-scene="${i}"]`).click();assert.equal(await page.locator('.process-step.active').getAttribute('data-step'),String(i));await page.waitForTimeout(200);await page.locator('.process-illus-inner').screenshot({path:`tmp/qa/scene-${i}.png`});}
  await page.locator('.process-step').nth(1).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#processStatus').innerText(),'02 / 04');
  await page.locator('#processScene').scrollIntoViewIfNeeded();await page.locator('#processPlay').click();await page.waitForTimeout(6800);assert.equal(await page.locator('#processStatus').innerText(),'03 / 04','Autoplay did not advance');await page.locator('#processPlay').click();
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);await page.locator('.motion-control').click();assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('motion-paused')),true);
  for(let i=0;i<await page.locator('.faq-q').count();i++){const q=page.locator('.faq-q').nth(i);if(await q.getAttribute('aria-expanded')==='true')await q.click();await q.click();assert.equal(await q.getAttribute('aria-expanded'),'true');}
  await page.locator('.ind-card-new').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.ind-card-new').first().getAttribute('aria-expanded'),'true');
  const rm=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});const rp=await rm.newPage();await rp.goto(base+'/prp/',{waitUntil:'domcontentloaded'});await rp.waitForSelector('.motion-control');
  assert.equal(await rp.locator('html').evaluate(e=>e.classList.contains('motion-paused')),true);
  assert.equal(await rp.locator('.float-slow').evaluate(e=>getComputedStyle(e).animationName),'none');
  await rp.close();await rm.close();await page.close();await context.close();await browser.close();
  assert.deepEqual(errors,[],'Browser errors');
  results.push('Interactions: hand layers, hotspots, tabs, quiz rapid clicks/back/reset, carousel, blood separation, microscopy, process 4 stages/autoplay/keyboard, FAQ, cards, reduced motion OK');
  console.log(results.join('\n'));
})().catch(e=>{console.error(e);process.exit(1);});

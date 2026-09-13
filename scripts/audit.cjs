const {chromium}=require(process.env.CODEX_NODE_MODULES+'/playwright');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('tmp/qa',{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const report=[];
  for(const width of [1440,390]) for(const route of ['','prp/','dr/']) {
    const page=await browser.newPage({viewport:{width,height:960},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/'+route);
    await page.waitForTimeout(4200);
    const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.alt),links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.startsWith('#')&&h.length>1&&!document.getElementById(h.slice(1)))}));
    await page.screenshot({path:`tmp/qa/${route.replace('/','')||'home'}-${width}.png`});
    report.push({width,route,errors,...info});
    if(route==='prp/') {await page.locator('#processo').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);await page.screenshot({path:`tmp/qa/process-${width}.png`});}
    await page.close();
  }
  console.log(JSON.stringify(report,null,2));
  await browser.close();
})();

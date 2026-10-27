import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { createServer } from '../server/server.mjs';

const remotePaths = [];
const server = createServer({fetchResource:async url => {
  remotePaths.push(url);
  assert.ok(url.startsWith('https://fixture.example/'));
  if (url.endsWith('/style.css')) return {status:200,headers:{'content-type':'text/css'},body:Buffer.from('body{margin:0}.remote{width:500px}')};
  if (url.endsWith('/app.js')) return {status:200,headers:{'content-type':'text/javascript'},body:Buffer.from('document.querySelector(".remote").style.width="600px";')};
  return {status:200,headers:{'content-type':'text/html','x-frame-options':'DENY','content-security-policy':"frame-ancestors 'none'"},body:Buffer.from('<!doctype html><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/style.css"><div class="remote">URL fixture</div><script src="/app.js"></script>')};
}}); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const cookie=(await fetch(base)).headers.get('set-cookie').split(';')[0];
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors = []; page.on('pageerror', error => errors.push(error.message));
async function run(input) {
  const response = await fetch(base+'/api/emulate', {method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(input)});
  const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result;
}
async function waitBusy(value) {
  const deadline=Date.now()+10000;
  while(Date.now()<deadline) {
    const status=await (await fetch(base+'/api/status',{headers:{Cookie:cookie}})).json();
    if(status.busy===value) return;
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert.fail(`Server busy=${value} was not reached`);
}
const html = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}#fixture{width:100vw;height:100vh}.wide{width:428px}.tiny{font-size:10px}.dpr{display:none}@media(min-resolution:3dppx){.dpr{display:block}}@media(prefers-color-scheme:dark){body{background:rgb(20,20,20);color:white}}</style><div id="fixture"><div class="wide">Overflow</div><span class="tiny">Tiny</span><span class="dpr">DPR 3</span><div id="result">JS OFF</div></div><script>document.getElementById('result').textContent='JS ON';fetch('http://127.0.0.1:1/private');window.open('https://example.com');</script>`;
try {
  const status = await (await fetch(base+'/api/status',{headers:{Cookie:cookie}})).json(); assert.equal(status.available, true);
  const normal = await run({html,profile:'iphone',dpr:3,minFont:12});
  assert.equal(normal.engine, 'Chromium'); assert.equal(normal.runtime.layoutWidth, 390); assert.equal(normal.runtime.dpr, 3); assert.ok(normal.runtime.touchPoints > 0);
  assert.equal(normal.report.horizontalOverflow, true); assert.equal(normal.report.viewport.width,390); assert.ok(normal.report.issues.some(i=>i.type==='text'));
  assert.equal(normal.settings.scripts, false); assert.ok(normal.report.metaViewport.includes('device-width'));
  assert.equal(normal.report.mediaQueries.find(q=>q.query.includes('min-resolution')).matches,true);
  const png = Buffer.from(normal.image.split(',')[1], 'base64'); assert.equal(png.readUInt32BE(16),390); assert.equal(png.readUInt32BE(20),844);
  await mkdir('artifacts',{recursive:true}); await writeFile('artifacts/emulated-iphone.png',png);
  const noMeta = await run({html:'<!doctype html><div>No viewport meta</div>',profile:'iphone'});
  assert.equal(noMeta.report.metaViewport,null); assert.equal(noMeta.runtime.layoutWidth,980);
  const customMeta = await run({html:'<!doctype html><meta name="viewport" content="width=500"><div>Unchanged meta</div>',profile:'iphone'});
  assert.equal(customMeta.runtime.layoutWidth,500); assert.equal(customMeta.report.metaViewport,'width=500');
  const lowDpr = await run({html,profile:'custom',custom:{width:412,height:915},landscape:true,dpr:1,colorScheme:'dark',scripts:true});
  assert.equal(lowDpr.profile.width,915); assert.equal(lowDpr.profile.height,412); assert.equal(lowDpr.runtime.dpr,1); assert.equal(lowDpr.runtime.colorScheme,'dark'); assert.equal(lowDpr.settings.scripts,true);
  assert.equal(lowDpr.report.mediaQueries.find(q=>q.query.includes('min-resolution')).matches,false);
  const script = await run({html:'<!doctype html><meta name="viewport" content="width=device-width"><div id="result">Before</div><script>document.getElementById("result").style.width="500px";document.getElementById("result").textContent="Executed";</script>',profile:'iphone',scripts:true});
  assert.ok(script.report.issues.some(i=>i.selector==='#result' && i.type==='overflow'));
  const fresh = await run({html:'<!doctype html><meta name="viewport" content="width=device-width"><div id="result">Before</div>',profile:'iphone'});
  assert.equal(fresh.report.horizontalOverflow,false);
  const remote = await run({url:'https://fixture.example/',profile:'iphone'});
  assert.equal(remote.source.type,'url'); assert.equal(remote.report.viewport.width,390);
  assert.ok(remote.report.issues.some(i=>i.selector==='div.remote' && i.rect.width===500));
  assert.ok(remotePaths.includes('https://fixture.example/style.css')); assert.equal(remotePaths.includes('https://fixture.example/app.js'),false);
  const remoteJs = await run({url:'https://fixture.example/',profile:'iphone',scripts:true});
  assert.ok(remoteJs.report.issues.some(i=>i.selector==='div.remote' && i.rect.width===600));
  const privateResponse = await fetch(base+'/api/emulate',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({url:'https://127.0.0.1'})}); assert.equal(privateResponse.status,400);
  // Run load tests before UI cancellation, which may still have requests in transit.
  const stuckStarted = Date.now();
  const stuck = fetch(base+'/api/emulate',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({html:'<!doctype html><script>while(true){}</script>',scripts:true})}).then(async response=>({status:response.status,body:await response.json()}));
  await waitBusy(true);
  const duplicate = await fetch(base+'/api/emulate',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({html:'<p>Concurrent</p>'})});
  const stuckResponse = await stuck; assert.equal(duplicate.status,429,JSON.stringify({elapsed:Date.now()-stuckStarted,first:stuckResponse.status,error:stuckResponse.body.error}));
  assert.equal(stuckResponse.status,504,JSON.stringify(stuckResponse.body)); assert.ok(Date.now()-stuckStarted<22000);
  await run({html:'<!doctype html><p>Recovered</p>'});
  await page.goto(base); await page.click('#emulate'); await page.click('#run-emulation');
  await page.waitForFunction(()=>!document.getElementById('emulation-result').hidden,{},{timeout:25000});
  assert.ok((await page.locator('#emulation-metrics').textContent()).includes('390 × 844'));
  const downloadImage = page.waitForEvent('download'); await page.click('#download-image'); assert.equal((await downloadImage).suggestedFilename(),'qa-iphone.png');
  const downloadReport = page.waitForEvent('download'); await page.click('#download-report'); assert.equal((await downloadReport).suggestedFilename(),'qa-iphone.json');
  const downloadWebp = page.waitForEvent('download'); await page.click('#download-webp'); assert.equal((await downloadWebp).suggestedFilename(),'qa-iphone.webp');
  assert.ok((await page.locator('#emulation-progress').textContent()).includes('WebP 압축'));
  await page.screenshot({path:'artifacts/phase-3.png',fullPage:true});
  await page.getByRole('button',{name:'브라우저 검사 닫기'}).click();
  await page.click('#open-url'); await page.fill('#url-input','https://fixture.example/'); await page.click('#apply-url');
  await page.waitForFunction(()=>document.querySelector('.preview-shot')?.getAttribute('src')?.startsWith('data:image/png'),null,{timeout:25000});
  assert.equal(await page.locator('iframe').count(),0);
  assert.ok((await page.locator('#issues').textContent()).includes('500'));
  assert.ok((await page.locator('#render-mode').textContent()).includes('Chromium'));
  await page.click('#emulate'); await page.click('#run-emulation');
  await page.waitForFunction(()=>!document.getElementById('emulation-result').hidden,{},{timeout:25000});
  assert.ok((await page.locator('#emulation-metrics').textContent()).includes('https://fixture.example/'));
  await page.screenshot({path:'artifacts/phase-3-url.png',fullPage:true}); await page.getByRole('button',{name:'브라우저 검사 닫기'}).click();
  await page.click('#emulate'); await page.click('#run-emulation'); await page.getByRole('button',{name:'브라우저 검사 닫기'}).click();
  await page.waitForTimeout(500); assert.equal(await page.locator('#emulation-dialog').isVisible(),false);
  await page.waitForFunction(async () => !(await (await fetch('/api/status')).json()).busy, null, {timeout:15000,polling:50});
  assert.deepEqual(errors,[]);
  console.log('PASS Phase 3: mobile meta semantics (390 / 980 / 500), DPR media/touch, overflow, orientation, theme, script opt-in, fresh contexts, screenshots, UI/downloads/cancel/concurrency/timeout recovery; URL CSS/script resources, frame-denied site top-level QA, private URL rejection.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }

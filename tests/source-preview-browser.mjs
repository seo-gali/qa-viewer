import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from '../server/server.mjs';

let fail = false;
const requests = [];
const server = createServer({ fetchResource: async url => {
  requests.push(url);
  if (fail) throw new Error('Fixture unavailable');
  assert.ok(url.startsWith('https://fixture.example/'));
  if (url.endsWith('/data.json')) { await new Promise(resolve => setTimeout(resolve, 650)); return { status: 200, headers: { 'content-type': 'application/json' }, body: Buffer.from('{"width":600}') }; }
  if (url.endsWith('/app.js')) return { status: 200, headers: { 'content-type': 'text/javascript' }, body: Buffer.from('fetch("/data.json").then(r=>r.json()).then(data=>document.querySelector(".remote").style.width=data.width+"px");fetch("/submit",{method:"POST"}).catch(()=>{})') };
  return { status: 200, headers: { 'content-type': 'text/html', 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" }, body: Buffer.from('<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0}.remote{width:500px}</style><div class="remote" id="boardSec">Remote</div><script src="/app.js"></script>') };
} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
async function ready(count = 1) {
  await page.waitForFunction(count => document.querySelectorAll('.preview-shot[src]').length === count && [...document.querySelectorAll('.preview-shot')].every(image => image.complete) && !document.getElementById('emulate').disabled, count, { timeout: 60000 });
  assert.ok(await page.locator('.preview-shot').evaluateAll(images => images.every(image => image.complete && image.naturalWidth === image.width && image.naturalHeight === image.height)));
}
try {
  await page.goto(base); await page.click('#open-url');
  assert.equal(await page.locator('#url-scripts').isChecked(), false);
  await page.fill('#url-input', 'https://fixture.example/#boardSec'); await page.click('#apply-url'); await ready();
  assert.equal(await page.locator('iframe').count(), 0);
  assert.ok((await page.locator('#issues').textContent()).includes('500'), await page.locator('#checks').textContent());
  assert.equal(requests.some(url => url.endsWith('/app.js')), false);
  await page.click('#open-url'); assert.equal(await page.locator('#url-input').inputValue(), 'https://fixture.example/#boardSec');
  await page.check('#url-scripts'); await page.click('#apply-url'); await ready();
  assert.ok((await page.locator('#issues').textContent()).includes('600'));
  assert.ok((await page.locator('#checks').textContent()).includes('POST'));
  assert.equal(requests.some(url => url.endsWith('/submit')), false);
  assert.ok(requests.some(url => url.endsWith('/app.js')));
  await page.selectOption('#device', 'galaxy'); await page.selectOption('#device', 'iphone-large'); await ready();
  assert.equal(await page.locator('.preview-shot').getAttribute('width'), '430');
  await page.click('#compare'); await ready(3);
  assert.deepEqual(await page.locator('.preview-shot').evaluateAll(images => images.map(image => image.width)), [430, 412, 928]);
  await page.getByRole('button', { name: '기기 3 검사 결과', exact: true }).click();
  assert.ok((await page.locator('#review-profile').textContent()).includes('FOLD 6'));
  await page.click('#compare'); await ready();
  fail = true; await page.click('#reload');
  await page.waitForFunction(() => document.getElementById('issues').querySelector('button') && !document.getElementById('emulate').disabled, null, { timeout: 25000 });
  assert.equal(await page.locator('.snapshot-state').isVisible(), true);
  fail = false; await page.locator('#issues button').click(); await ready();
  await page.click('#paste');
  const html = '<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body><main id="app"></main><script>const box=document.createElement("div");box.style.width="700px";box.textContent="Script HTML";document.querySelector("#app").append(box);fetch("https://fixture.example/private")</script></body></html>';
  await page.fill('#code', html); await page.check('#code-scripts');
  const before = requests.length;
  await page.click('#apply-code'); await ready();
  assert.ok((await page.locator('#issues').textContent()).includes('700'));
  assert.equal(requests.length, before, 'Pasted HTML must never fetch external resources');
  assert.equal(await page.locator('iframe').count(), 0);
  await page.click('#paste'); assert.equal(await page.locator('#code').inputValue(), html);
  await page.uncheck('#code-scripts'); await page.click('#apply-code');
  await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.getElementById('app'));
  assert.equal(await page.frameLocator('iframe').locator('#app').textContent(), '');
  assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-same-origin');
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.deepEqual(errors, []);
  console.log('PASS source preview: frame-denied URL, hash, JS opt-in, named models, rapid profile changes, sequential compare, retry, doctype HTML scripts, external network blocked, static sandbox retained.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }

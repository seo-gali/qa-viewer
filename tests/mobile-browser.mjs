import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from '../server.mjs';
const server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch(); const page=await browser.newPage();
const errors=[]; page.on('pageerror',error=>errors.push(error.message));
async function noOverflow(label) {
  const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(sizes.scroll<=sizes.width+1,`${label}: ${JSON.stringify(sizes)}`);
}
try {
  for(const width of [320,375,390,768,1440]) {
    await page.setViewportSize({width,height:900}); await page.goto(base); await page.waitForFunction(()=>document.getElementById('checks').children.length>0);
    await noOverflow(`home ${width}`);
    assert.ok((await page.title()).includes('HTML·URL'));
    assert.ok(await page.locator('meta[name=description]').getAttribute('content'));
    assert.equal(await page.locator('input[placeholder],textarea[placeholder]').count(),0);
    assert.equal(await page.locator('#copyright-year').textContent(),String(new Date().getFullYear()));
    const links=await page.locator('a[href]').evaluateAll(els=>els.map(el=>el.getAttribute('href')).filter(href=>!href.startsWith('https:')));
    for(const href of links) assert.equal((await page.request.get(new URL(href,base).href)).status(),200,href);
    assert.equal((await page.request.get(base+'/favicon.svg')).status(),200);
    if(width<760) { assert.equal(await page.locator('#open').isVisible(),false); await page.click('#mobile-menu'); assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'true'); assert.equal(await page.locator('#open').isVisible(),true); await noOverflow(`expanded menu ${width}`); }
    await page.click('#compare'); await page.waitForTimeout(200); await noOverflow(`compare ${width}`);
    await page.click('#paste'); await noOverflow(`paste dialog ${width}`); await page.getByRole('button',{name:'닫기',exact:true}).click();
    await page.click('#open-url'); await noOverflow(`URL dialog ${width}`);
    await page.fill('#url-input','http://example.com'); await page.click('#apply-url'); assert.equal(await page.locator('#url-dialog .dialog-error').isVisible(),true); assert.ok((await page.locator('#url-dialog .dialog-error').textContent()).includes('HTTPS')); await noOverflow(`URL error ${width}`);
    await page.getByRole('button',{name:'URL 입력 닫기',exact:true}).click();
    await page.click('#emulate'); await noOverflow(`emulation dialog ${width}`); await page.getByRole('button',{name:'브라우저 검사 닫기',exact:true}).click();
    await page.goto(base+'/not-a-page'); assert.ok((await page.title()).includes('찾을 수 없습니다')); await noOverflow(`404 ${width}`); await page.getByRole('link',{name:'작업 공간으로 돌아가기 →'}).click(); assert.equal(new URL(page.url()).pathname,'/');
  }
  await page.setViewportSize({width:390,height:844}); await page.goto(base); await page.waitForTimeout(200); await mkdir('artifacts',{recursive:true}); await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
  await page.goto(base+'/not-a-page'); await page.screenshot({path:'artifacts/404-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]); console.log('PASS UI polish: 320/375/390/768/1440px home/compare/dialogs/404, no outer overflow, mobile menu, internal links, favicon, metadata, year.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }

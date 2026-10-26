import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server/server.mjs';

const example = new URL('../examples/responsive-form.html', import.meta.url);
const html = await readFile(example, 'utf8');
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch();
  const base = `http://127.0.0.1:${server.address().port}`;
  const artifactUrl = base + '/artifact-test';
  const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
  const blocked = [], errors = [];
  await context.route('**/*', route => {
    if (route.request().url() === artifactUrl && route.request().method() === 'GET') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    blocked.push(route.request().url());
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  context.on('page', popup => { if (popup !== page) popup.close().catch(() => {}); });
  page.on('download', download => download.cancel().catch(() => {}));
  page.on('pageerror', error => errors.push(error.message));
  const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Unexpected page overflow');
  await mkdir('artifacts', { recursive: true });
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    for (const [width, height] of [[375, 812], [390, 844], [768, 1024], [1440, 900], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.goto(artifactUrl);
      assert.equal(await page.locator('#name').isEnabled(), true);
      await noOverflow();
      if (width === 390 || width === 1440) await page.screenshot({ path: `artifacts/form-${width}-${colorScheme}.png`, fullPage: true });

      await page.locator('#email').fill('invalid');
      assert.equal(await page.locator('#email-error').textContent(), '');
      await page.locator('#email').press('Tab');
      assert.ok((await page.locator('#email-error').textContent()).includes('이메일'));
      await page.locator('#email').fill('');

      await page.locator('button[type=submit]').focus();
      await page.keyboard.press('Space');
      assert.equal(await page.locator('#name').getAttribute('aria-invalid'), 'true');
      assert.equal(await page.locator('#email').getAttribute('aria-invalid'), 'true');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
      assert.ok((await page.locator('#name-error').textContent()).includes('이름'));
      assert.equal(await page.getByRole('textbox', { name: '이름 · 필수', exact: true }).isVisible(), true);
      await noOverflow();
      await page.locator('#name').fill('   ');
      await page.locator('#email').fill('invalid');
      await page.locator('#email').press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
      const name = '아주긴한국어이름으로화면넘침을확인하는디자이너'.repeat(4);
      await page.locator('#name').fill(name);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'email');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'email');
      assert.equal(await page.locator('#name-error').textContent(), '');
      assert.ok((await page.locator('#email-error').textContent()).includes('이메일'));
      await page.locator('#email').fill('designer@example.com');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'topic');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Tab');
      const memo = '<img src=x onerror=alert(1)> ' + '긴 한국어 문구를 수정한 뒤에도 입력한 내용이 유지되는지 확인합니다. '.repeat(10);
      await page.locator('#memo').fill(memo);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#confirmation').isVisible(), true);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'confirmed-title');
      assert.equal(await page.locator('#confirmed-name').textContent(), name);
      assert.equal(await page.locator('#confirmed-memo').textContent(), memo);
      assert.equal(await page.locator('#confirmation img').count(), 0);
      await noOverflow();
      if (width === 390) await page.screenshot({ path: `artifacts/form-success-${colorScheme}.png`, fullPage: true });
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
      assert.equal(await page.locator('#memo').inputValue(), memo);
      await noOverflow();
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  await context.close();

  const viewer = await browser.newPage({ serviceWorkers: 'block', acceptDownloads: false });
  await viewer.goto(base);
  await viewer.locator('#file').setInputFiles(fileURLToPath(example));
  await viewer.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.getElementById('request'));
  assert.equal(await viewer.locator('#filename').textContent(), 'responsive-form.html');
  assert.equal(await viewer.locator('iframe').getAttribute('sandbox'), 'allow-same-origin');
  assert.equal(await viewer.frameLocator('iframe').locator('#name').isDisabled(), true);
  assert.ok((await viewer.frameLocator('iframe').locator('#mode').textContent()).includes('정적'));
  const cookie = (await fetch(base)).headers.get('set-cookie').split(';')[0];
  for (const scripts of [false, true]) {
    const response = await fetch(base + '/api/emulate', {
      method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, profile: 'iphone', scripts, colorScheme: 'dark' })
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.report.horizontalOverflow, false);
    assert.equal(result.runtime.layoutWidth, 390);
    assert.equal(result.settings.scripts, scripts);
    assert.equal(result.blockedRequests, 0);
    assert.equal(result.remoteRequests, 0);
    assert.deepEqual(result.errors, []);
    await writeFile(`artifacts/form-qa-js-${scripts ? 'on' : 'off'}.png`, Buffer.from(result.image.split(',')[1], 'base64'));
  }
  console.log('PASS HTML artifact: 375/390/768/1440px and landscape, light/dark, empty/error/success/edit, keyboard/focus, long Korean text, no external requests; viewer upload with scripts blocked and Chromium JS OFF/ON snapshots.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

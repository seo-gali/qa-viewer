import { chromium, devices } from 'playwright';
import { access } from 'node:fs/promises';
import { inspectDocument } from '../public/inspector.js';
import { previewPolicy } from '../public/security.js';
import { fetchPublicResource } from './public-resource.mjs';

export async function browserAvailable() {
  try { await access(chromium.executablePath()); return true; } catch { return false; }
}

export async function emulate(config, signal, fetchResource = fetchPublicResource) {
  if (signal?.aborted) throw new Error('검사가 취소되었습니다.');
  let browser, timer;
  const jobController = new AbortController();
  const jobSignal = signal ? AbortSignal.any([signal, jobController.signal]) : jobController.signal;
  const started = Date.now();
  const close = () => { jobController.abort(); if (browser) browser.close().catch(() => {}); };
  signal?.addEventListener('abort', close, { once: true });
  const work = async () => {
    browser = await chromium.launch({ timeout: 10000 });
    if (signal?.aborted) throw new Error('검사가 취소되었습니다.');
    const p = config.profile;
    const referenceName = p.referenceDevice ?? (p.brand === 'Apple' ? 'iPhone 17 Pro Max' : 'Galaxy S24');
    const reference = devices[referenceName];
    const context = await browser.newContext({
      viewport: { width: p.width, height: p.height }, screen: { width: p.width, height: p.height },
      deviceScaleFactor: config.dpr, isMobile: true, hasTouch: true,
      userAgent: reference.userAgent, javaScriptEnabled: config.scripts,
      colorScheme: config.colorScheme, locale: 'ko-KR', serviceWorkers: 'block', acceptDownloads: false, permissions: []
    });
    let served = false, blockedRequests = 0, remoteRequests = 0, remoteBytes = 0;
    let activeFetches = 0;
    const queue = [];
    const acquire = async () => {
      while (activeFetches >= 4) { await new Promise(resolve => queue.push(resolve)); if (jobSignal.aborted) throw new Error('요청 취소'); }
      if (jobSignal.aborted) throw new Error('요청 취소');
      activeFetches++;
    };
    const release = () => { activeFetches--; queue.shift()?.(); };
    const url = config.url ?? 'https://qa-content.invalid/preview';
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    context.on('page', popup => popup.close().catch(() => {}));
    page.on('download', download => download.cancel().catch(() => {}));
    const errors = [];
    page.on('pageerror', error => { if (errors.length < 20) errors.push(error.message.slice(0, 500)); });
    await context.route('**/*', async route => {
      const request = route.request();
      if (config.url) {
        let acquired = false;
        try {
          if (request.method() !== 'GET') throw new Error(`${request.method()} 요청 차단: 공개 HTTPS GET만 지원합니다.`);
          if (++remoteRequests > 60) throw new Error('최대 60개 리소스 제한입니다.');
          await acquire(); acquired = true;
          const resource = await fetchResource(request.url(), { signal: jobSignal, userAgent: reference.userAgent });
          remoteBytes += resource.body.length;
          if (remoteBytes > 32 * 1024 * 1024) throw new Error('전체 리소스 32MB 제한 초과');
          // Header sandbox cannot be removed by the page, even with same-origin scripts.
          const sandbox = `sandbox allow-same-origin${config.scripts ? ' allow-scripts' : ''}; form-action 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; connect-src https:${config.scripts ? '' : "; script-src 'none'"}`;
          resource.headers['content-security-policy'] = [resource.headers['content-security-policy'], sandbox].filter(Boolean).join(', ');
          await route.fulfill(resource);
        } catch (error) {
          if (jobSignal.aborted) { await route.abort('blockedbyclient').catch(() => {}); return; }
          blockedRequests++;
          if (errors.length < 20) errors.push(`리소스 차단: ${error.message}`);
          await route.abort('blockedbyclient').catch(() => {});
        } finally { if (acquired) release(); }
      } else if (!served && request.url() === url && request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        served = true;
        const policy = config.scripts ? previewPolicy.replace("script-src 'none'", "script-src 'unsafe-inline'") : previewPolicy;
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: config.html, headers: { 'Content-Security-Policy': `sandbox allow-same-origin${config.scripts ? ' allow-scripts' : ''}; ${policy}`, 'Referrer-Policy': 'no-referrer' } });
      } else { blockedRequests++; await route.abort('blockedbyclient'); }
    });
    await context.routeWebSocket('**/*', socket => { blockedRequests++; socket.close(); });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });
    for (const selector of config.clicks) {
      const target = page.locator(`css=${selector}`).first();
      await target.evaluate(element => { if (element.tagName === 'A') element.setAttribute('target', '_self'); }, undefined, { timeout: 3000 });
      await target.click({ timeout: 3000 });
    }
    // Wait for active GETs, without an extra quiet period for polling sites.
    const settleUntil = Date.now() + 3000;
    while (config.url && config.scripts && activeFetches && Date.now() < settleUntil) await new Promise(resolve => setTimeout(resolve, 25));
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 500))]));
    await page.waitForTimeout(200);
    const runtime = await page.evaluate(() => ({
      innerWidth, innerHeight, scrollX, scrollY, layoutWidth: document.documentElement.clientWidth, layoutHeight: document.documentElement.clientHeight,
      visualWidth: visualViewport?.width, visualHeight: visualViewport?.height, visualScale: visualViewport?.scale,
      dpr: devicePixelRatio, touchPoints: navigator.maxTouchPoints, userAgent: navigator.userAgent,
      screen: { width: screen.width, height: screen.height }, colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }));
    const safeRatio = runtime.layoutWidth / p.width;
    const safe = config.safeArea ? p.safe.map(value => value * safeRatio) : [0, 0, 0, 0];
    const report = await page.evaluate(inspectDocument, { minFont: config.minFont, safe, layoutViewport: true });
    const screenshot = await page.screenshot({ type: 'png', scale: 'css', fullPage: true, animations: 'disabled', timeout: 5000 });
    const interactive = await page.evaluate(() => {
      const scale = visualViewport?.scale ?? 1;
      const targets = [];
      for (const element of document.querySelectorAll('a[href],button,[role="button"],summary,input[type="button"],input[type="submit"],input[type="reset"]')) {
        const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
        if (!rect.width || !rect.height || style.visibility === 'hidden' || element.disabled || element.getAttribute('aria-disabled') === 'true') continue;
        const path = [];
        for (let node = element; node; node = node.parentElement) {
          if (node.id && document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1) { path.push(`#${CSS.escape(node.id)}`); break; }
          let ordinal = 1;
          for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) if (sibling.localName === node.localName) ordinal++;
          path.push(`${node.localName}:nth-of-type(${ordinal})`);
        }
        const selector = path.reverse().join(' > ');
        if (selector.length > 2048) continue;
        const buttonValue = element.matches('input[type="button"],input[type="submit"],input[type="reset"]') ? element.value : '';
        targets.push({ selector, href: element instanceof HTMLAnchorElement ? element.href : null, label: (element.getAttribute('aria-label') || element.textContent || buttonValue || element.getAttribute('title') || element.getAttribute('href') || '버튼').trim().slice(0, 120), x: (rect.left + scrollX) * scale, y: (rect.top + scrollY) * scale, width: rect.width * scale, height: rect.height * scale });
        if (targets.length === 500) break;
      }
      return targets;
    });
    return {
      engine: 'Chromium', browserVersion: browser.version(), referenceDevice: referenceName,
      profile: p, settings: { dpr: config.dpr, scripts: config.scripts, colorScheme: config.colorScheme, minFont: config.minFont, safeArea: config.safeArea },
      runtime, report, errors, blockedRequests, remoteRequests, remoteBytes, source: config.url ? { type: 'url', url: config.url, finalUrl: page.url() } : { type: 'html' }, durationMs: Date.now() - started,
      image: `data:image/png;base64,${screenshot.toString('base64')}`,
      imageSize: { width: screenshot.readUInt32BE(16), height: screenshot.readUInt32BE(20) },
      scroll: { left: runtime.scrollX * (runtime.visualScale ?? 1), top: runtime.scrollY * (runtime.visualScale ?? 1) },
      interactive,
      capturedAt: new Date().toISOString(), note: 'Chromium mobile context snapshot. Safe Area / Fold env variables are not emulated.'
    };
  };
  try {
    return await Promise.race([
      work(),
      new Promise((_, reject) => { timer = setTimeout(() => { close(); reject(new Error('검사 시간 제한(20초)을 초과했습니다.')); }, 20000); })
    ]);
  } finally { clearTimeout(timer); jobController.abort(); signal?.removeEventListener('abort', close); if (browser) await browser.close().catch(() => {}); }
}

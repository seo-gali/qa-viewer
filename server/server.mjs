import './runtime.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateEmulation } from './emulation-config.mjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ...['app.js', 'profiles.js', 'security.js', 'sample.js', 'inspector.js', 'emulation-ui.js', 'public-url.js'].map(name => [`/${name}`, [name, 'text/javascript']]),
  ['/styles.css', ['styles.css', 'text/css']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
]);
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [], finished = false;
    req.on('data', chunk => {
      if (finished) return;
      size += chunk.length;
      if (size > 3 * 1024 * 1024) { finished = true; chunks = []; reject(Object.assign(new Error('요청은 최대 3MB입니다.'), { status: 413 })); return; }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!finished) { finished = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', error => { if (!finished) { finished = true; reject(error); } });
    req.on('aborted', () => { if (!finished) { finished = true; reject(new Error('요청이 취소되었습니다.')); } });
  });
}
export function createServer({ fetchResource } = {}) {
  let busy = false;
  const session = randomBytes(32).toString('hex');
  let rateWindow = Date.now(), rateCount = 0;
  const authenticated = req => {
    const value = req.headers.cookie?.split(';').map(p => p.trim()).find(p => p.startsWith('qa_session='))?.slice('qa_session='.length);
    return !!value && /^[a-f0-9]{64}$/.test(value) && timingSafeEqual(Buffer.from(value), Buffer.from(session));
  };
  const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
  return http.createServer(async (req, res) => {
    for (const [key, value] of Object.entries({
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' data:; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self'; frame-src 'self' blob: https:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    })) res.setHeader(key, value);
    const port = req.socket.localPort;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) { res.writeHead(403).end('Invalid host'); return; }
    let path;
    try { path = new URL(req.url, `http://${req.headers.host}`).pathname; }
    catch { res.writeHead(400).end('Invalid URL'); return; }
    if (path.startsWith('/api/') && !authenticated(req)) { json(res, 401, { error: '작업 공간을 다시 열어 로컬 세션을 시작하세요.', code: 'SESSION_REQUIRED' }); req.resume(); return; }
    if (path === '/api/status' && req.method === 'GET') {
      try { const { browserAvailable } = await import('./emulator.mjs'); json(res, 200, { available: await browserAvailable(), engine: 'Chromium', busy }); }
      catch { json(res, 200, { available: false, engine: 'Chromium' }); }
      return;
    }
    if (path === '/api/emulate' && req.method === 'POST') {
      if (req.headers.origin !== `http://${req.headers.host}` || req.headers['content-type']?.split(';')[0] !== 'application/json') { json(res, 403, { error: '동일 origin의 JSON 요청만 허용합니다.' }); req.resume(); return; }
      if (Date.now() - rateWindow >= 60000) { rateWindow = Date.now(); rateCount = 0; }
      if (++rateCount > 20) { res.setHeader('Retry-After', String(Math.max(1, Math.ceil((60000 - Date.now() + rateWindow) / 1000)))); json(res, 429, { error: '분당 20회 검사 제한입니다. 잠시 후 다시 시도하세요.', code: 'RATE_LIMIT' }); req.resume(); return; }
      if (busy) { json(res, 429, { error: '다른 브라우저 검사가 진행 중입니다.' }); req.resume(); return; }
      let input;
      req.setTimeout(10000, () => req.destroy());
      try {
        const body = await readBody(req);
        req.setTimeout(0);
        input = validateEmulation(JSON.parse(body));
      } catch (error) { if (!res.destroyed) json(res, error.status ?? 400, { error: error instanceof SyntaxError ? '올바른 JSON이 필요합니다.' : error.message }); return; }
      // Claim after reading too: two uploads can complete in the same interval.
      if (busy) { json(res, 429, { error: '다른 브라우저 검사가 진행 중입니다.' }); return; }
      busy = true;
      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });
      try {
        const { emulate, browserAvailable } = await import('./emulator.mjs');
        if (!await browserAvailable()) { json(res, 503, { error: 'Chromium이 없습니다. npx playwright install chromium을 실행하세요.' }); return; }
        const result = await emulate(input, controller.signal, fetchResource);
        if (!res.destroyed) json(res, 200, result);
      } catch (error) {
        if (!res.destroyed) {
          const timeout = /timeout|시간 제한/i.test(error.message);
          json(res, timeout ? 504 : 503, { code: timeout ? 'QA_TIMEOUT' : 'QA_FAILED', error: timeout ? '검사 시간 제한을 초과했습니다. JavaScript를 끄거나 콘텐츠를 줄이고 다시 시도하세요.' : '검사를 완료하지 못했습니다. 공개 URL 접근 여부와 JavaScript 실행 옵션을 확인하세요.' });
        }
      }
      finally { busy = false; }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end('Method not allowed'); return; }
    const file = files.get(path);
    if (!file) {
      try {
        const year = String(new Date().getFullYear());
        const page = (await readFile(new URL('../public/404.html', import.meta.url), 'utf8')).replace('<time id="copyright-year" datetime="2026">2026</time>', `<time id="copyright-year" datetime="${year}">${year}</time>`);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(req.method === 'HEAD' ? undefined : page);
      } catch { res.writeHead(404).end('Page not found'); }
      return;
    }
    try {
      const body = await readFile(new URL('../public/' + file[0], import.meta.url));
      if (path === '/') res.setHeader('Set-Cookie', `qa_session=${session}; Path=/; HttpOnly; SameSite=Strict`);
      res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(500).end('Could not load application'); }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.QA_PORT ?? 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('QA_PORT must be 1–65535');
  const server = createServer();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set QA_PORT to another port.` : error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Mobile QA Viewer: http://127.0.0.1:${port}`));
}

import './runtime.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = [
  ['/', ['index.html', 'text/html']],
  ...['app.js', 'profiles.js', 'security.js', 'sample.js', 'inspector.js'].map(name => [`/${name}`, [name, 'text/javascript']]),
  ['/styles.css', ['styles.css', 'text/css']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
];
export function createServer() {
  return http.createServer(async (req, res) => {
    for (const [key, value] of Object.entries({
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' data:; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'none'; frame-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    })) res.setHeader(key, value);
    const port = req.socket.localPort;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) { res.writeHead(403).end('Invalid host'); return; }
    let path;
    try { path = new URL(req.url, `http://${req.headers.host}`).pathname; }
    catch { res.writeHead(400).end('Invalid URL'); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end('Method not allowed'); return; }
    const file = files.find(([pathname]) => pathname === path)?.[1];
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

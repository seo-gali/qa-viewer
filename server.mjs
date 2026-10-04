import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ...['app.js', 'profiles.js', 'security.js', 'sample.js', 'inspector.js'].map(name => [`/${name}`, [name, 'text/javascript']]),
  ['/styles.css', ['styles.css', 'text/css']]
]);
export function createServer() {
  return http.createServer(async (req, res) => {
    const port = req.socket.localPort;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) { res.writeHead(403).end('Invalid host'); return; }
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end('Method not allowed'); return; }
    const file = files.get(path);
    if (!file) { res.writeHead(404).end('Not found'); return; }
    try {
      const body = await readFile(new URL(file[0], import.meta.url));
      res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "frame-ancestors 'none'" });
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

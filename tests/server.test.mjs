import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server/server.mjs';

test('static server keeps the file allowlist, CSP and Host checks', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.equal(home.headers.get('set-cookie'), null);
  assert.equal(home.headers.get('x-frame-options'), 'DENY');
  assert.ok(home.headers.get('content-security-policy').includes("connect-src 'none'"));
  assert.ok(home.headers.get('content-security-policy').includes("frame-src 'self' blob:;"));
  for (const path of ['/app.js', '/profiles.js', '/security.js', '/sample.js', '/inspector.js', '/styles.css', '/favicon.svg']) assert.equal((await fetch(base + path)).status, 200, path);
  for (const path of ['/.git/config', '/package.json', '/server/server.mjs', '/docs/Design.md', '/emulation-ui.js', '/public-url.js', '/api/status', '/api/emulate']) assert.equal((await fetch(base + path)).status, 404, path);
  const rejectedHost = await new Promise(resolve => http.get(base, { headers: { Host: 'attacker.example' } }, res => { res.resume(); resolve(res.statusCode); }));
  assert.equal(rejectedHost, 403);
  assert.equal((await fetch(base + '/api/emulate', { method: 'POST', body: '{}' })).status, 405);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.ok((await (await fetch(base + '/missing')).text()).includes('작업 공간으로 돌아가기'));
});

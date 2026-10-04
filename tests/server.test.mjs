import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.mjs';
test('loopback server serves only application files and validates Host', async t => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + '/.git/config')).status, 404);
  assert.equal((await fetch(base + '/package.json')).status, 404);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  const status = await new Promise(resolve => { http.get(base, { headers: { Host: 'attacker.example' } }, res => { res.resume(); resolve(res.statusCode); }); });
  assert.equal(status, 403);
});

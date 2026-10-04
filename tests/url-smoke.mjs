// Explicit network check, kept separate from deterministic regression tests.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from '../server.mjs';
const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const cookie=(await fetch(base)).headers.get('set-cookie').split(';')[0];
try {
  const response = await fetch(base+'/api/emulate', { method:'POST', headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'}, body:JSON.stringify({url:'https://example.com/',profile:'iphone'}) });
  const result = await response.json(); assert.equal(response.status,200,JSON.stringify(result));
  assert.equal(result.source.type,'url'); assert.equal(result.source.finalUrl,'https://example.com/'); assert.equal(result.runtime.dpr,3); assert.ok(result.remoteRequests>=1);
  assert.ok(result.image.startsWith('data:image/png;base64,'));
  await mkdir('artifacts',{recursive:true}); await writeFile('artifacts/phase-3-live-url.png',Buffer.from(result.image.split(',')[1],'base64'));
  console.log(`PASS public URL smoke: example.com · ${result.runtime.layoutWidth}px layout viewport · DPR ${result.runtime.dpr} · ${result.remoteRequests} resource(s).`);
} finally { await new Promise(resolve => server.close(resolve)); }

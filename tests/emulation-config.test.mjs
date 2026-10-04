import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmulation } from '../emulation-config.mjs';
test('emulation preserves source and applies bounded mobile settings', () => {
  const html = '<meta name="viewport" content="width=500"><div>한글</div>';
  const config = validateEmulation({html, profile:'fold', landscape:true, dpr:2.5, scripts:true, safeArea:true, colorScheme:'dark'});
  assert.equal(config.html, html); assert.equal(config.profile.width, 884); assert.equal(config.profile.hinge, 'horizontal'); assert.equal(config.dpr, 2.5);
});
test('emulation rejects oversized input and mistyped or unbounded settings', () => {
  for (const input of [null, [], {}, {html:' '}, {html:'a'.repeat(2*1024*1024+1)}, {html:'x',profile:'bad'}, {html:'x',dpr:0}, {html:'x',dpr:'3'}, {html:'x',dpr:Infinity}, {html:'x',scripts:'true'}, {html:'x',minFont:33}, {html:'x',colorScheme:'unknown'}, {html:'x',profile:'custom',custom:{width:100,height:800}}]) assert.throws(() => validateEmulation(input));
  const defaults = validateEmulation({html:'<p>Hi</p>'}); assert.equal(defaults.scripts, false); assert.equal(defaults.dpr, 3);
  assert.equal(validateEmulation({url:'https://example.com'}).url,'https://example.com/');
  assert.throws(()=>validateEmulation({url:'https://example.com',html:'x'}));
  assert.throws(()=>validateEmulation({url:'http://127.0.0.1'}));
  assert.throws(()=>validateEmulation({html:'x',admin:true}));
  assert.throws(()=>validateEmulation({html:'x',custom:null}));
  assert.throws(()=>validateEmulation({html:'x',custom:{width:390,height:844,role:'admin'}}));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicIPv4, validatePublicUrl } from '../public/public-url.js';
import { fetchPublicResource } from '../server/public-resource.mjs';
test('URL validation rejects credentials, private/reserved ranges, alternate IP syntax and ports', () => {
  for (const url of ['file:///etc/passwd','ftp://example.com','http://localhost','http://local.internal','http://app.local','http://127.0.0.1','http://0x7f000001','http://2130706433','http://0177.0.0.1','http://10.0.0.1','http://169.254.169.254','http://100.64.0.1','http://172.16.0.1','http://192.168.1.1','http://192.0.2.1','http://198.18.1.1','http://198.51.100.1','http://203.0.113.1','http://224.0.0.1','http://255.255.255.255','http://[::1]','http://[::ffff:127.0.0.1]','https://user:pass@example.com','http://example.com:8080']) assert.throws(()=>validatePublicUrl(url),url);
  assert.equal(validatePublicUrl('https://example.com/path#section'),'https://example.com/path');
  assert.equal(validatePublicUrl('https://example.com:443/'),'https://example.com/');
});
test('IPv4 egress ranges are conservative and malformed addresses fail closed', () => {
  for (const address of ['8.8.8.8','1.1.1.1','93.184.215.14']) assert.equal(isPublicIPv4(address),true);
  for (const address of ['0.0.0.0','192.0.0.9','192.88.99.1','240.1.1.1','256.1.1.1','::1','1.2.3','1.2.3.4.5']) assert.equal(isPublicIPv4(address),false);
});
test('public resource fetch refuses loopback before opening a connection', async () => {
  await assert.rejects(fetchPublicResource('https://127.0.0.1/'),/사설망/);
});

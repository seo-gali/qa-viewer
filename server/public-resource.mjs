import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import { isPublicIPv4, validatePublicUrl } from '../public/public-url.js';

export async function fetchPublicResource(value, { signal, userAgent, maxBytes = 4 * 1024 * 1024 } = {}) {
  const url = new URL(validatePublicUrl(value));
  let timer;
  const addresses = await Promise.race([
    lookup(url.hostname, { family: 4, all: true }),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS 조회 시간 초과')), 4000); })
  ]).finally(() => clearTimeout(timer));
  if (signal?.aborted) throw new Error('요청 취소');
  if (!addresses.length || addresses.some(entry => !isPublicIPv4(entry.address))) throw new Error('공개 IPv4로만 연결할 수 있습니다.');
  // Pin the validated address to the actual socket, including TLS SNI hostname.
  const address = addresses[0].address;
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET', agent: false, signal,
      lookup: (_hostname, options, callback) => callback(null, options.all ? [{ address, family: 4 }] : address, 4),
      headers: { 'User-Agent': userAgent ?? 'MobileContentQA/0.1', Accept: '*/*', 'Accept-Encoding': 'identity' }
    }, res => {
      const headers = {};
      for (const name of ['content-type', 'location', 'content-security-policy', 'x-frame-options', 'access-control-allow-origin', 'access-control-allow-credentials', 'cross-origin-resource-policy', 'cross-origin-opener-policy', 'cross-origin-embedder-policy']) if (typeof res.headers[name] === 'string') headers[name] = res.headers[name];
      let stream = res;
      const encoding = res.headers['content-encoding'];
      const decoder = encoding === 'gzip' ? createGunzip() : encoding === 'deflate' ? createInflate() : encoding === 'br' ? createBrotliDecompress() : null;
      if (decoder) { res.pipe(decoder); stream = decoder; }
      let size = 0; const chunks = [];
      stream.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) { req.destroy(new Error('리소스 크기 제한 초과')); stream.destroy(); return; }
        chunks.push(chunk);
      });
      stream.on('error', error => { req.destroy(); reject(error); });
      res.on('error', reject);
      stream.on('end', () => resolve({ status: res.statusCode, headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(6000, () => req.destroy(new Error('원격 응답 시간 초과')));
    req.on('error', reject); req.end();
  });
}

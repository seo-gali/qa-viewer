const reserved = [
  [0x00000000, 8], [0x0a000000, 8], [0x64400000, 10], [0x7f000000, 8],
  [0xa9fe0000, 16], [0xac100000, 12], [0xc0000000, 24], [0xc0000200, 24],
  [0xc0586300, 24], [0xc0a80000, 16], [0xc6120000, 15], [0xc6336400, 24],
  [0xcb007100, 24], [0xe0000000, 4], [0xf0000000, 4]
];
export function isPublicIPv4(address) {
  const parts = address.split('.');
  if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return false;
  const n = parts.reduce((value, p) => ((value << 8) | Number(p)) >>> 0, 0);
  return !reserved.some(([base, bits]) => (n >>> (32 - bits)) === (base >>> (32 - bits)));
}
export function validatePublicUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('URL은 최대 2048자 문자열이어야 합니다.');
  let url;
  try { url = new URL(value); } catch { throw new Error('올바른 HTTPS URL을 입력하세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('인증 정보 없는 공개 HTTPS 기본 포트만 지원합니다.');
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || /\.(localhost|local|internal)\.?$/.test(host) || host.startsWith('[') || (/^[\d.]+$/.test(host) && !isPublicIPv4(host))) throw new Error('localhost·사설망·예약 주소·IPv6 주소는 지원하지 않습니다.');
  url.hash = '';
  return url.href;
}

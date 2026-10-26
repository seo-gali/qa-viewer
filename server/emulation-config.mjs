import { resolveProfile } from '../public/profiles.js';
import { validatePublicUrl } from '../public/public-url.js';

export function validateEmulation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('JSON 객체가 필요합니다.');
  const fields = new Set(['html', 'url', 'profile', 'custom', 'landscape', 'dpr', 'minFont', 'scripts', 'safeArea', 'colorScheme']);
  if (Object.keys(input).some(key => !fields.has(key))) throw new Error('허용되지 않은 입력 필드입니다.');
  if (input.custom !== undefined && (!input.custom || typeof input.custom !== 'object' || Array.isArray(input.custom) || Object.keys(input.custom).some(key => !['width', 'height'].includes(key)))) throw new Error('Custom 크기는 width와 height 객체여야 합니다.');
  let url;
  if (input.url !== undefined) {
    if (input.html !== undefined) throw new Error('HTML과 URL 중 하나만 전달하세요.');
    url = validatePublicUrl(input.url);
  } else if (typeof input.html !== 'string' || !input.html.trim() || Buffer.byteLength(input.html) > 2 * 1024 * 1024) throw new Error('HTML은 비어 있지 않은 최대 2MB 문자열이어야 합니다.');
  for (const key of ['landscape', 'scripts', 'safeArea']) if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new Error(`${key}는 boolean이어야 합니다.`);
  const p = resolveProfile(input.profile ?? 'iphone', input.custom, input.landscape ?? false);
  const dpr = input.dpr ?? p.dpr;
  const minFont = input.minFont ?? 12;
  if (typeof dpr !== 'number' || !Number.isFinite(dpr) || dpr < 1 || dpr > 4) throw new Error('DPR은 1–4 사이의 숫자여야 합니다.');
  if (typeof minFont !== 'number' || !Number.isFinite(minFont) || minFont < 6 || minFont > 32) throw new Error('최소 글자 기준은 6–32px입니다.');
  if (input.colorScheme !== undefined && !['light', 'dark'].includes(input.colorScheme)) throw new Error('colorScheme은 light 또는 dark입니다.');
  return { html: input.html, url, profile: p, dpr, minFont, scripts: input.scripts ?? false, safeArea: input.safeArea ?? false, colorScheme: input.colorScheme ?? 'light' };
}

// Serializable: used by both the static iframe and isolated Chromium.
export function inspectDocument(doc, options = {}) {
  if (!doc?.defaultView) { options = doc ?? {}; doc = document; }
  const win = doc.defaultView;
  const width = options.layoutViewport ? doc.documentElement.clientWidth : win.innerWidth;
  const height = options.layoutViewport ? doc.documentElement.clientHeight : win.innerHeight;
  const threshold = options.minFont ?? 12;
  const safe = options.safe ?? [0, 0, 0, 0];
  const maxIssues = 250, maxElements = 10000;
  const all = doc.body.querySelectorAll('*'), count = Math.min(all.length, maxElements);
  const lefts = new Float64Array(count), tops = new Float64Array(count), widths = new Float64Array(count), heights = new Float64Array(count);
  // 14 bits hold parent index + 1; the top two hold clipping flags (at most 10,000 elements).
  const links = new Uint16Array(count), parentMask = 0x3fff, clipX = 0x4000, clipY = 0x8000;
  const clipped = new Uint32Array(Math.ceil(count / 32)), issues = [];
  const scrollWidth = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
  const horizontalOverflow = scrollWidth > width + 1;
  let truncated = all.length > maxElements, parent = -1;
  const label = el => (el.id ? `#${el.id}` : el.localName + [...el.classList].slice(0, 2).map(c => `.${c}`).join('')).slice(0, 160);
  const push = (type, index, message) => {
    if (type === 'clipped') {
      const word = index >>> 5, bit = 1 << (index & 31);
      if (clipped[word] & bit) return;
      clipped[word] |= bit;
    }
    if (issues.length >= maxIssues) { truncated = true; return; }
    issues.push({ type, selector: label(all[index]), index, message: message.slice(0, 500), rect: { x: lefts[index], y: tops[index], width: widths[index], height: heights[index] } });
  };
  for (let index = 0; index < count; index++) {
    const el = all[index];
    while (parent >= 0 && all[parent] !== el.parentElement) parent = (links[parent] & parentMask) - 1;
    const r = el.getBoundingClientRect(), css = win.getComputedStyle(el);
    lefts[index] = r.left; tops[index] = r.top; widths[index] = r.width; heights[index] = r.height;
    links[index] = (parent + 1) | (css.overflowX === 'hidden' || css.overflowX === 'clip' ? clipX : 0) | (css.overflowY === 'hidden' || css.overflowY === 'clip' ? clipY : 0);
    parent = index;
    if (!r.width || !r.height || css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0) continue;
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href?.startsWith('#') && href.length > 1) {
        let target;
        try { target = decodeURIComponent(href.slice(1)); } catch { target = null; }
        if (!target || (!doc.getElementById(target) && ![...doc.getElementsByName(target)].some(node => node.tagName === 'A'))) push('link', index, `링크 대상 ${href}를 찾을 수 없습니다.`);
      }
    }
    if (el.tagName === 'IMG' && el.complete && el.getAttribute('src') && !el.naturalWidth) push('image', index, '이미지를 불러오지 못했습니다. 주소 또는 외부 리소스 차단 여부를 확인하세요.');
    if (horizontalOverflow && (r.right > width + 1 || r.left < -1)) push('overflow', index, `가로 범위 ${Math.round(r.left)}–${Math.round(r.right)}px · viewport ${width}px`);
    if (css.position === 'fixed' && (r.top < -1 || r.bottom > height + 1)) push('fixed', index, 'fixed 요소가 세로 viewport 밖으로 나갑니다.');
    let directText = false;
    for (const child of el.childNodes) if (child.nodeType === 3 && child.textContent.trim()) { directText = true; break; }
    if (directText && parseFloat(css.fontSize) < threshold) push('text', index, `${css.fontSize} · 검수 기준 ${threshold}px 미만`);
    const onScreen = r.bottom > 0 && r.top < height && r.right > 0 && r.left < width;
    if (onScreen && (directText || /^(IMG|BUTTON|INPUT|A|SELECT|TEXTAREA)$/.test(el.tagName))) {
      if ((safe[0] && r.top < safe[0]) || (safe[1] && r.right > width - safe[1]) || (safe[2] && r.bottom > height - safe[2]) || (safe[3] && r.left < safe[3])) push('safe', index, '참고 Safe Area와 겹칩니다. 실제 env() 값은 변경하지 않습니다.');
    }
    if (!onScreen) continue;
    for (let ancestor = (links[index] & parentMask) - 1; ancestor >= 0; ancestor = (links[ancestor] & parentMask) - 1) {
      const flags = links[ancestor];
      const x = (flags & clipX) && (r.left < lefts[ancestor] - 1 || r.right > lefts[ancestor] + widths[ancestor] + 1);
      const y = (flags & clipY) && (r.top < tops[ancestor] - 1 || r.bottom > tops[ancestor] + heights[ancestor] + 1);
      if (x || y) { push('clipped', ancestor, `${label(all[ancestor])} 안의 콘텐츠 잘림 가능성 · 의도한 자르기인지 확인하세요.`); break; }
    }
  }
  const breakpoints = new Set();
  let unreadableSheets = 0;
  const visit = rules => {
    for (const rule of rules) {
      if (rule.type === 4) breakpoints.add(rule.conditionText);
      if (rule.cssRules) visit(rule.cssRules);
    }
  };
  for (const sheet of doc.styleSheets) { try { visit(sheet.cssRules); } catch { unreadableSheets++; } }
  const meta = name => doc.querySelector(`meta[name="${name}" i]`)?.content?.trim() ?? '';
  const h1 = doc.querySelectorAll('h1').length;
  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const headingSkips = headings.filter((el, i) => i && Number(el.tagName[1]) > Number(headings[i - 1].tagName[1]) + 1).length;
  const images = [...doc.querySelectorAll('img')], missingAlt = images.filter(img => !img.hasAttribute('alt')).length;
  const jsonld = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  let invalidJson = 0;
  for (const script of jsonld) { try { JSON.parse(script.textContent); } catch { invalidJson++; } }
  const social = ['og:title', 'og:description', 'og:image'].filter(property => doc.querySelector(`meta[property="${property}"]`)?.content?.trim()).length;
  const robots = [meta('robots'), meta('googlebot')].filter(Boolean).join(' / ');
  const seo = [
    { label: '페이지 제목', value: doc.title?.trim() || '없음', ok: !!doc.title?.trim() },
    { label: '검색 설명', value: meta('description') || '없음 · 페이지 내용을 요약한 설명 확인', ok: !!meta('description') },
    { label: '대표 주소', value: doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '없음 · 대표 주소 지정 여부 확인', ok: !!doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() },
    { label: '검색 차단 설정', value: robots || 'robots meta 없음 · 응답 헤더와 robots.txt는 별도 확인 필요', ok: !/\b(noindex|none)\b/i.test(robots) },
    { label: '제목 구조', value: `H1 ${h1}개 · 제목 단계 건너뜀 ${headingSkips}개`, ok: h1 > 0 && headingSkips === 0 },
    { label: '이미지 대체문구', value: `전체 ${images.length}개 · alt 속성 누락 ${missingAlt}개 · 빈 alt는 장식 이미지로 구분`, ok: missingAlt === 0 },
    { label: '공유 정보', value: `제목·설명·이미지 ${social}/3개`, ok: social === 3 },
    { label: '구조화 데이터', value: `JSON-LD ${jsonld.length}개 · 문법 오류 ${invalidJson}개 · 검색엔진의 적격성 판정과 구분`, ok: jsonld.length > 0 && invalidJson === 0 },
    { label: '문서 언어', value: doc.documentElement.lang || '없음', ok: !!doc.documentElement.lang }
  ];
  const result = {
    viewport: { width, height },
    metaViewport: doc.querySelector('meta[name="viewport" i]')?.content ?? null,
    scrollWidth, horizontalOverflow, seo,
    issues, breakpoints: [...breakpoints], mediaQueries: [...breakpoints].map(query => ({ query, matches: win.matchMedia(query).matches })), unreadableSheets, truncated,
    scanned: count
  };
  return options.includeElements ? { ...result, elements: Array.from({ length: count }, (_, index) => all[index]) } : result;
}

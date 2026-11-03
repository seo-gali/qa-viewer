// Serializable: the same function is evaluated in a Playwright page in Phase 3.
export function inspectDocument(doc, options = {}) {
  // Playwright serializes this function; passing options runs it in the current page.
  if (!doc?.defaultView) { options = doc ?? {}; doc = document; }
  const win = doc.defaultView;
  const width = options.layoutViewport ? doc.documentElement.clientWidth : win.innerWidth;
  const height = options.layoutViewport ? doc.documentElement.clientHeight : win.innerHeight;
  const threshold = options.minFont ?? 12;
  const safe = options.safe ?? [0, 0, 0, 0];
  const issues = [], elements = [];
  const seen = new Set();
  const scrollWidth = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
  const horizontalOverflow = scrollWidth > width + 1;
  const maxIssues = 250, maxElements = 10000;
  let truncated = false;
  const label = el => (el.id ? `#${el.id}` : el.localName + [...el.classList].slice(0, 2).map(c => `.${c}`).join('')).slice(0, 160);
  const push = (type, el, message, rect) => {
    const index = elements.indexOf(el), key = `${type}:${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (issues.length >= maxIssues) { truncated = true; return; }
    const r = rect ?? el.getBoundingClientRect();
    issues.push({ type, selector: label(el), index, message: message.slice(0, 500), rect: { x: r.x, y: r.y, width: r.width, height: r.height } });
  };
  const all = [...doc.body.querySelectorAll('*')];
  if (all.length > maxElements) truncated = true;
  for (const el of all.slice(0, maxElements)) {
    const r = el.getBoundingClientRect(), css = win.getComputedStyle(el);
    if (!r.width || !r.height || css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0) continue;
    elements.push(el);
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href?.startsWith('#') && href.length > 1) {
        let target;
        try { target = decodeURIComponent(href.slice(1)); } catch { target = null; }
        if (!target || (!doc.getElementById(target) && ![...doc.getElementsByName(target)].some(node => node.tagName === 'A'))) push('link', el, `링크 대상 ${href}를 찾을 수 없습니다.`, r);
      }
    }
    if (el.tagName === 'IMG' && el.complete && el.getAttribute('src') && !el.naturalWidth) push('image', el, '이미지를 불러오지 못했습니다. 주소 또는 외부 리소스 차단 여부를 확인하세요.', r);
    if (horizontalOverflow && (r.right > width + 1 || r.left < -1)) push('overflow', el, `가로 범위 ${Math.round(r.left)}–${Math.round(r.right)}px · viewport ${width}px`, r);
    if (css.position === 'fixed' && (r.top < -1 || r.bottom > height + 1)) push('fixed', el, 'fixed 요소가 세로 viewport 밖으로 나갑니다.', r);
    const directText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (directText && parseFloat(css.fontSize) < threshold) push('text', el, `${css.fontSize} · 검수 기준 ${threshold}px 미만`, r);
    const onScreen = r.bottom > 0 && r.top < height && r.right > 0 && r.left < width;
    if (onScreen && (directText || /^(IMG|BUTTON|INPUT|A|SELECT|TEXTAREA)$/.test(el.tagName))) {
      if ((safe[0] && r.top < safe[0]) || (safe[1] && r.right > width - safe[1]) || (safe[2] && r.bottom > height - safe[2]) || (safe[3] && r.left < safe[3])) push('safe', el, '참고 Safe Area와 겹칩니다. 실제 env() 값은 변경하지 않습니다.', r);
    }
    let ancestor = el.parentElement;
    while (ancestor && ancestor !== doc.body) {
      const ac = win.getComputedStyle(ancestor), ar = ancestor.getBoundingClientRect();
      const x = ['hidden', 'clip'].includes(ac.overflowX) && (r.left < ar.left - 1 || r.right > ar.right + 1);
      const y = ['hidden', 'clip'].includes(ac.overflowY) && (r.top < ar.top - 1 || r.bottom > ar.bottom + 1);
      if ((x || y) && onScreen) { push('clipped', ancestor, `${label(ancestor)} 안의 콘텐츠 잘림 가능성 · 의도한 자르기인지 확인하세요.`, ar); break; }
      ancestor = ancestor.parentElement;
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
    scanned: Math.min(all.length, maxElements)
  };
  return options.includeElements ? { ...result, elements } : result;
}

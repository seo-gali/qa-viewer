// Serializable: the same function is evaluated in a Playwright page in Phase 3.
export function inspectDocument(doc, options = {}) {
  const win = doc.defaultView;
  const width = win.innerWidth, height = win.innerHeight;
  const threshold = options.minFont ?? 12;
  const safe = options.safe ?? [0, 0, 0, 0];
  const issues = [], elements = [];
  const maxIssues = 250, maxElements = 10000;
  let truncated = false;
  const label = el => el.id ? `#${el.id}` : el.localName + [...el.classList].slice(0, 2).map(c => `.${c}`).join('');
  const push = (type, el, message, rect) => {
    if (issues.length >= maxIssues) { truncated = true; return; }
    const r = rect ?? el.getBoundingClientRect();
    const index = elements.indexOf(el);
    issues.push({ type, selector: label(el), index, message, rect: { x: r.x, y: r.y, width: r.width, height: r.height } });
  };
  const all = [...doc.body.querySelectorAll('*')];
  if (all.length > maxElements) truncated = true;
  for (const el of all.slice(0, maxElements)) {
    const r = el.getBoundingClientRect(), css = win.getComputedStyle(el);
    if (!r.width || !r.height || css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0) continue;
    elements.push(el);
    if (r.right > width + 1 || r.left < -1) push('overflow', el, `가로 범위 ${Math.round(r.left)}–${Math.round(r.right)}px · viewport ${width}px`, r);
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
      if (x || y) { push('clipped', el, `${label(ancestor)}의 overflow에 의해 잘릴 수 있습니다.`, r); break; }
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
  const result = {
    viewport: { width, height },
    metaViewport: doc.querySelector('meta[name="viewport" i]')?.content ?? null,
    scrollWidth: Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth),
    horizontalOverflow: Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth) > width + 1,
    issues, breakpoints: [...breakpoints], unreadableSheets, truncated,
    scanned: Math.min(all.length, maxElements)
  };
  return options.includeElements ? { ...result, elements } : result;
}

import { profiles, resolveProfile, fitScale, validDimension } from './profiles.js';
import { previewDocument } from './security.js';
import { inspectDocument } from './inspector.js';
import { sample } from './sample.js';
import { setupEmulation } from './emulation-ui.js';
import { validatePublicUrl } from './public-url.js';

const $ = id => document.getElementById(id);
const state = { html: sample, url: null, filename: 'field-notes.html', landscape: false, custom: [{ width: 390, height: 844 }], selections: ['iphone', 'galaxy-ultra', 'fold'], compare: false, active: 0, cards: [], generation: 0 };
let toastTimer, scanTimer;
export function toast(message, kind = 'error') {
  const dialog = document.querySelector('dialog[open]');
  if (dialog && kind === 'error') {
    let feedback = dialog.querySelector('.dialog-error');
    if (!feedback) { feedback = document.createElement('p'); feedback.className = 'dialog-error'; feedback.setAttribute('role', 'alert'); dialog.append(feedback); }
    feedback.textContent = message; return;
  }
  $('toast').textContent = message; $('toast').className = `toast ${kind}`; $('toast').setAttribute('role', kind === 'error' ? 'alert' : 'status'); $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500);
}
function populate(select, selected = 'iphone') {
  for (const group of [...new Set(profiles.map(p => p.group))]) {
    const optgroup = document.createElement('optgroup'); optgroup.label = group;
    for (const p of profiles.filter(p => p.group === group)) { const option = new Option(p.name, p.id); optgroup.append(option); }
    select.append(optgroup);
  }
  select.value = selected;
}
populate($('device'));
function currentProfile() { return resolveProfile(state.selections[state.active], state.custom[state.active], state.landscape); }
function syncToolbar() {
  const p = currentProfile(); $('device').value = state.selections[state.active];
  $('width').value = p.width; $('height').value = p.height;
  $('add-device').hidden = !state.compare; $('add-device').disabled = state.selections.length >= 4;
  $('compare').setAttribute('aria-pressed', String(state.compare));
}
function activate(index) {
  state.active = index; syncToolbar();
  state.cards.forEach((card, i) => { card.article.classList.toggle('active', i === index); card.review?.setAttribute('aria-pressed', String(i === index)); });
  displayReport(state.cards[index]);
}
function render() {
  state.generation++;
  syncToolbar();
  $('rotate').setAttribute('aria-pressed', String(state.landscape));
  $('render-mode').textContent = state.url ? 'URL iframe · JavaScript OFF · Inspect는 Chromium 검사에서 지원' : 'Desktop iframe · JavaScript OFF · 외부 리소스 차단';
  state.cards.forEach(card => { if (card.blobURL) URL.revokeObjectURL(card.blobURL); });
  $('devices').replaceChildren(); state.cards = [];
  const selected = state.compare ? state.selections : state.selections.slice(0, 1);
  selected.forEach((id, index) => createCard(resolveProfile(id, state.custom[index], state.landscape), index));
  activate(state.active);
  if (state.url) displayURLReport();
  scaleCards();
}
function createCard(p, index) {
  const article = document.createElement('article'); article.className = 'device-card';
  const title = document.createElement('div'); title.className = 'device-title';
  const name = document.createElement('span'); name.textContent = p.name;
  const size = document.createElement('small'); size.textContent = `${p.width} × ${p.height}`; title.append(name, size);
  let review = null;
  if (state.compare) {
    const select = document.createElement('select'); select.className = 'card-profile'; select.setAttribute('aria-label', `기기 ${index + 1} 프로필`); populate(select, p.id);
    select.addEventListener('change', () => { state.selections[index] = select.value; state.active = index; render(); });
    title.replaceChildren(select);
    if (state.selections.length > 2) {
      const remove = document.createElement('button'); remove.className = 'remove-card'; remove.textContent = '✕'; remove.setAttribute('aria-label', `기기 ${index + 1} 제거`);
      remove.addEventListener('click', () => { state.selections.splice(index, 1); state.custom.splice(index, 1); state.active = Math.min(state.active, state.selections.length - 1); render(); }); title.append(remove);
    }
    review = document.createElement('button'); review.className = 'card-review'; review.textContent = `${p.width} × ${p.height} · ${state.url ? 'URL preview' : '검사 중'}`; review.setAttribute('aria-label', `기기 ${index + 1} 검사 결과`); review.addEventListener('click', () => activate(index));
  }
  const slot = document.createElement('div'); slot.className = 'device-slot';
  const device = document.createElement('div'); device.className = `device ${p.group === 'Generic' || p.id === 'custom' ? 'generic' : ''} ${p.hinge ? 'fold' : ''} ${state.landscape ? 'landscape' : ''}`;
  device.style.width = `${p.width}px`; device.style.height = `${p.height}px`;
  const iframe = document.createElement('iframe'); iframe.title = `${p.name} HTML 미리보기`; iframe.setAttribute('sandbox', 'allow-same-origin'); iframe.referrerPolicy = 'no-referrer';
  iframe.width = p.width; iframe.height = p.height; iframe.style.width = `${p.width}px`; iframe.style.height = `${p.height}px`;
  const overlay = document.createElement('div'); overlay.className = 'device-overlay';
  device.append(iframe, overlay); slot.append(device); article.append(title, slot); if (review) article.append(review); $('devices').append(article);
  const card = { article, p, slot, device, iframe, overlay, review, report: null, selected: null, generation: state.generation }; state.cards.push(card);
  iframe.addEventListener('load', () => {
    if (card.generation !== state.generation) return;
    if (state.url) return;
    try {
      const win = iframe.contentWindow;
      win.addEventListener('scroll', () => scheduleScan(), { passive: true });
      iframe.contentDocument.addEventListener('pointerdown', () => activate(index));
      const preventNavigation = event => {
        const link = event.target.closest?.('a[href]');
        if (link && !link.getAttribute('href').startsWith('#')) { event.preventDefault(); toast('HTML 정적 모드에서는 외부 링크 이동이 차단됩니다. URL 열기를 사용하세요.'); }
      };
      iframe.contentDocument.addEventListener('click', preventNavigation);
      iframe.contentDocument.addEventListener('auxclick', preventNavigation);
      const observer = new win.ResizeObserver(() => scheduleScan()); observer.observe(iframe.contentDocument.body);
      iframe.contentDocument.fonts.ready.then(() => scheduleScan());
      scanCard(card); if (state.active === index) displayReport(card);
    } catch { toast('문서 접근이 차단되었습니다. 원본 HTML을 다시 열어 주세요.'); }
  });
  if (state.url) iframe.src = state.url;
  else { card.blobURL = URL.createObjectURL(new Blob([previewDocument(state.html)], {type:'text/html'})); iframe.src = card.blobURL; }
  updateOverlay(card);
}
function scaleCards() {
  const canvas = $('canvas');
  const availableHeight = Math.max(200, canvas.clientHeight - (state.compare ? 192 : 154));
  const scale = $('scale').value === 'fit' ? fitScale(state.cards.map(c => c.p.width + 10), state.cards.map(c => c.p.height + 10), Math.max(240, canvas.clientWidth - 72), availableHeight) : Number($('scale').value);
  for (const card of state.cards) {
    card.device.style.transform = `scale(${scale})`;
    card.article.style.width = `${(card.p.width + 10) * scale}px`;
    card.slot.style.width = `${(card.p.width + 10) * scale}px`; card.slot.style.height = `${(card.p.height + 10) * scale}px`;
  }
  $('scale-label').textContent = `${$('scale').value === 'fit' ? 'FIT · ' : ''}${Math.round(scale * 100)}%`;
}
function updateOverlay(card) {
  card.overlay.replaceChildren();
  const p = card.p;
  if (p.cutout) { const cutout = document.createElement('div'); cutout.className = `cutout ${p.cutout}`; card.overlay.append(cutout); }
  if (p.hinge) { const hinge = document.createElement('div'); hinge.className = `hinge ${p.hinge}`; hinge.title = 'Fold / Flip visualization'; card.overlay.append(hinge); }
  if ($('safe').checked) {
    ['top', 'right', 'bottom', 'left'].forEach((side, i) => {
      if (!p.safe[i]) return;
      const edge = document.createElement('div'); edge.className = `safe-edge safe-${side}`; edge.style[i % 2 ? 'width' : 'height'] = `${p.safe[i]}px`; card.overlay.append(edge);
    });
  }
  if (card.selected !== null && card.report) {
    const issue = card.report.issues[card.selected];
    const el = issue && card.report.elements[issue.index];
    if (!el?.isConnected) return;
    const r = el.getBoundingClientRect();
    const box = document.createElement('div'); box.className = 'bounding-box';
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const label = document.createElement('span'); label.className = 'bounding-label'; label.textContent = `${issue.selector} · ${Math.round(r.width)} × ${Math.round(r.height)}`;
    box.append(label); card.overlay.append(box);
  }
}
function scanCard(card) {
  if (state.url) { card.report = null; updateOverlay(card); return; }
  try {
    const selectedIssue = card.report?.issues[card.selected];
    const selectedElement = selectedIssue && card.report.elements[selectedIssue.index];
    card.report = inspectDocument(card.iframe.contentDocument, { minFont: Number($('min-font').value), safe: $('safe').checked ? card.p.safe : [0, 0, 0, 0], includeElements: true });
    if (selectedElement) { const i = card.report.issues.findIndex(issue => issue.type === selectedIssue.type && card.report.elements[issue.index] === selectedElement); card.selected = i >= 0 ? i : null; }
    if (card.review) card.review.textContent = `${card.p.width} × ${card.p.height} · ${card.report.issues.length} 경고${card.report.horizontalOverflow ? ' · Overflow' : ''}`;
    updateOverlay(card);
  } catch { card.report = null; }
}
function scheduleScan() { clearTimeout(scanTimer); scanTimer = setTimeout(() => { for (const card of state.cards) scanCard(card); displayReport(state.cards[state.active]); }, 100); }
function check(message, ok) {
  const row = document.createElement('div'); row.className = `check ${ok ? '' : 'warning'}`;
  const symbol = document.createElement('b'); symbol.textContent = ok ? '✓' : '⚠'; row.append(symbol, document.createTextNode(message)); return row;
}
const issueTypes = { overflow: 'Horizontal overflow', text: '작은 텍스트', safe: 'Safe Area 침범 가능', fixed: '화면 밖 fixed 요소', clipped: '콘텐츠 잘림 가능', link: '깨진 내부 링크', image: '이미지 로드 실패' };
function displayReport(card) {
  if (state.url) { displayURLReport(); return; }
  if (!card?.report) { $('issue-count').textContent = '…'; $('checks').replaceChildren(); $('issues').replaceChildren(); $('breakpoints').textContent = '문서 로딩 중'; $('status').textContent = '문서 렌더링 / 검사 중'; return; }
  const r = card.report;
  $('review-profile').textContent = card.p.name.toUpperCase();
  $('issue-count').textContent = r.issues.length + (r.truncated ? '+' : '');
  $('checks').replaceChildren(check(r.metaViewport ? 'viewport meta 존재' : 'viewport meta 없음', !!r.metaViewport), check(r.horizontalOverflow ? `가로 scroll ${r.scrollWidth}px / ${r.viewport.width}px` : '가로 스크롤 없음', !r.horizontalOverflow), check('JavaScript 격리 · 외부 리소스 차단', true));
  if (r.truncated) $('checks').append(check('스캔 / 경고 제한에 도달했습니다.', false));
  $('issues').replaceChildren();
  r.issues.forEach((issue, i) => {
    const button = document.createElement('button'); button.className = `issue ${card.selected === i ? 'selected' : ''}`;
    const type = document.createElement('span'); type.className = 'issue-type'; type.textContent = `⚠ ${issueTypes[issue.type]}`;
    const selector = document.createElement('strong'); selector.textContent = issue.selector;
    const message = document.createElement('p'); message.textContent = issue.message;
    button.append(type, selector, message);
    button.addEventListener('click', () => { card.selected = i; const el = r.elements[issue.index]; el?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); updateOverlay(card); displayReport(card); });
    $('issues').append(button);
  });
  if (!r.issues.length) { const empty = document.createElement('p'); empty.className = 'empty-issues'; empty.textContent = '✓ 현재 기준에서 발견된 경고가 없습니다.'; $('issues').append(empty); }
  $('breakpoints').replaceChildren();
  for (const condition of r.breakpoints) { const code = document.createElement('code'); code.textContent = `${card.iframe.contentWindow.matchMedia(condition).matches ? '●' : '○'} ${condition}`; $('breakpoints').append(code); }
  if (!r.breakpoints.length) $('breakpoints').textContent = '검출된 media query 없음';
  $('status').textContent = `${card.p.width} × ${card.p.height} CSS px · ${state.landscape ? 'Landscape' : 'Portrait'} · Safe Area ${$('safe').checked ? 'ON' : 'OFF'} · ${r.horizontalOverflow ? 'Overflow 발견' : 'No horizontal overflow'}`;
}
function displayURLReport() {
  const p = currentProfile();
  $('review-profile').textContent = 'URL PREVIEW'; $('issue-count').textContent = '—';
  $('checks').replaceChildren(check('다른 도메인 iframe: DOM 검사 불가', false), check('사이트가 iframe 삽입을 차단할 수 있습니다.', false));
  $('issues').replaceChildren();
  const message = document.createElement('p'); message.className = 'empty-issues'; message.textContent = 'Chromium 검사에서 모바일 viewport 스크린샷과 QA 리포트를 확인하세요.'; $('issues').append(message);
  $('breakpoints').textContent = 'URL의 media query는 Chromium 검사에서 확인';
  $('status').textContent = `${p.width} × ${p.height} CSS px · URL preview · DOM 검사 미실행`;
}
function loadHTML(html, filename, source) {
  if (new Blob([html]).size > 2 * 1024 * 1024) { toast('HTML은 최대 2MB까지 열 수 있습니다.'); return false; }
  state.html = html; state.url = null; state.filename = filename; $('filename').textContent = filename; $('source-state').textContent = source; render();
  toast(`${filename} 미리보기를 적용했습니다.`, 'success'); return true;
}
async function openFile(file) {
  if (!file || !/\.html?$/i.test(file.name)) return toast('.html 또는 .htm 파일을 선택해 주세요.');
  if (file.size > 2 * 1024 * 1024) return toast('HTML은 최대 2MB까지 열 수 있습니다.');
  try { loadHTML(await file.text(), file.name, '로컬 파일'); } catch { toast('파일을 읽지 못했습니다.'); }
}
$('open').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => { openFile($('file').files[0]); $('file').value = ''; });
$('paste').addEventListener('click', () => { $('code').value = state.html; $('paste-dialog').showModal(); });
$('open-url').addEventListener('click', () => { $('url-input').value = state.url ?? ''; $('url-dialog').showModal(); });
$('apply-url').addEventListener('click', () => {
  try { state.url = validatePublicUrl($('url-input').value.trim()); }
  catch (error) { toast(error.message); return; }
  $('filename').textContent = new URL(state.url).hostname; $('source-state').textContent = 'URL preview'; $('url-dialog').close(); render(); toast('URL을 적용했습니다. 사이트의 iframe 허용 여부에 따라 표시됩니다.', 'success');
});
$('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('apply-url').click(); } });
$('apply-code').addEventListener('click', () => { if (!$('code').value.trim()) return toast('HTML 코드를 입력해 주세요.'); if (loadHTML($('code').value, 'pasted-content.html', '붙여넣은 코드')) $('paste-dialog').close(); });
document.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); $('canvas').classList.add('dragover'); } });
document.addEventListener('dragleave', e => { if (!e.relatedTarget) $('canvas').classList.remove('dragover'); });
document.addEventListener('drop', e => { e.preventDefault(); $('canvas').classList.remove('dragover'); openFile(e.dataTransfer.files[0]); });
$('device').addEventListener('change', () => { state.selections[state.active] = $('device').value; render(); });
for (const id of ['width', 'height']) $(id).addEventListener('change', () => {
  const width = $('width').value, height = $('height').value;
  if (!validDimension(width) || !validDimension(height)) { toast('크기는 240–2048 사이의 정수여야 합니다.'); $('width').value = currentProfile().width; $('height').value = currentProfile().height; return; }
  state.custom[state.active] = state.landscape ? { width: Number(height), height: Number(width) } : { width: Number(width), height: Number(height) };
  state.selections[state.active] = 'custom'; render();
});
$('rotate').addEventListener('click', () => { state.landscape = !state.landscape; render(); });
$('scale').addEventListener('change', scaleCards);
$('reload').addEventListener('click', render);
$('safe').addEventListener('change', scheduleScan);
$('inspect').addEventListener('change', () => { $('panel').hidden = !$('inspect').checked; if (!$('inspect').checked) { state.cards.forEach(c => { c.selected = null; updateOverlay(c); }); } scaleCards(); });
$('min-font').addEventListener('change', () => { const n = Number($('min-font').value); if (!Number.isFinite(n) || n < 6 || n > 32) { $('min-font').value = 12; toast('최소 글자 기준은 6–32px입니다.'); } scheduleScan(); });
$('rescan').addEventListener('click', scheduleScan);
$('clear-box').addEventListener('click', () => { state.cards.forEach(c => { c.selected = null; updateOverlay(c); }); displayReport(state.cards[state.active]); });
$('compare').addEventListener('click', () => { state.compare = !state.compare; state.active = 0; render(); });
$('add-device').addEventListener('click', () => { if (state.selections.length >= 4) return; state.selections.push('generic-320'); state.active = state.selections.length - 1; render(); });
new ResizeObserver(scaleCards).observe($('canvas'));
$('mobile-menu').addEventListener('click', () => { const opened = $('toolbar').classList.toggle('mobile-open'); $('mobile-menu').setAttribute('aria-expanded', String(opened)); });
const copyrightYear = String(new Date().getFullYear()); $('copyright-year').textContent = copyrightYear; $('copyright-year').dateTime = copyrightYear;
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => dialog.querySelector('.dialog-error')?.remove()));
setupEmulation(() => ({ ...(state.url ? {url:state.url} : {html:state.html}), profile: state.selections[state.active], custom: state.custom[state.active], landscape: state.landscape, dpr: currentProfile().dpr, minFont: Number($('min-font').value), safeArea: $('safe').checked }), toast);
render();

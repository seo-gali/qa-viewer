import { profiles, resolveProfile, fitScale, validDimension } from './profiles.js';
import { previewDocument } from './security.js';
import { inspectDocument } from './inspector.js';
import { sample } from './sample.js';

const $ = id => document.getElementById(id);
const state = { html: sample, filename: 'field-notes.html', landscape: false, custom: { width: 390, height: 844 }, cards: [], generation: 0 };
let toastTimer, scanTimer;
export function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500); }
function populate(select, selected = 'iphone') {
  for (const group of [...new Set(profiles.map(p => p.group))]) {
    const optgroup = document.createElement('optgroup'); optgroup.label = group;
    for (const p of profiles.filter(p => p.group === group)) { const option = new Option(p.name, p.id); optgroup.append(option); }
    select.append(optgroup);
  }
  select.value = selected;
}
populate($('device'));
function currentProfile() { return resolveProfile($('device').value, state.custom, state.landscape); }
function render() {
  state.generation++;
  const p = currentProfile();
  $('width').value = p.width; $('height').value = p.height;
  $('rotate').setAttribute('aria-pressed', String(state.landscape));
  $('devices').replaceChildren(); state.cards = [];
  createCard(p);
  scaleCards();
}
function createCard(p) {
  const article = document.createElement('article'); article.className = 'device-card';
  const title = document.createElement('div'); title.className = 'device-title';
  const name = document.createElement('span'); name.textContent = p.name;
  const size = document.createElement('small'); size.textContent = `${p.width} × ${p.height}`; title.append(name, size);
  const slot = document.createElement('div'); slot.className = 'device-slot';
  const device = document.createElement('div'); device.className = `device ${p.group === 'Generic' || p.id === 'custom' ? 'generic' : ''} ${p.hinge ? 'fold' : ''} ${state.landscape ? 'landscape' : ''}`;
  device.style.width = `${p.width}px`; device.style.height = `${p.height}px`;
  const iframe = document.createElement('iframe'); iframe.title = `${p.name} HTML 미리보기`; iframe.setAttribute('sandbox', 'allow-same-origin'); iframe.referrerPolicy = 'no-referrer';
  iframe.width = p.width; iframe.height = p.height; iframe.style.width = `${p.width}px`; iframe.style.height = `${p.height}px`;
  const overlay = document.createElement('div'); overlay.className = 'device-overlay';
  device.append(iframe, overlay); slot.append(device); article.append(title, slot); $('devices').append(article);
  const card = { article, p, slot, device, iframe, overlay, report: null, selected: null, generation: state.generation }; state.cards.push(card);
  iframe.addEventListener('load', () => {
    if (card.generation !== state.generation) return;
    try {
      const win = iframe.contentWindow;
      win.addEventListener('scroll', () => scheduleScan(), { passive: true });
      const observer = new win.ResizeObserver(() => scheduleScan()); observer.observe(iframe.contentDocument.body);
      iframe.contentDocument.fonts.ready.then(() => scheduleScan());
      scanCard(card); displayReport(card);
    } catch { toast('문서 접근이 차단되었습니다. 원본 HTML을 다시 열어 주세요.'); }
  });
  iframe.srcdoc = previewDocument(state.html);
  updateOverlay(card);
}
function scaleCards() {
  const canvas = $('canvas');
  const availableHeight = Math.max(200, canvas.clientHeight - 154);
  const scale = $('scale').value === 'fit' ? fitScale(state.cards.map(c => c.p.width + 10), state.cards.map(c => c.p.height + 10), Math.max(240, canvas.clientWidth - 72), availableHeight) : Number($('scale').value);
  for (const card of state.cards) {
    card.device.style.transform = `scale(${scale})`;
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
  try {
    card.report = inspectDocument(card.iframe.contentDocument, { minFont: Number($('min-font').value), safe: $('safe').checked ? card.p.safe : [0, 0, 0, 0], includeElements: true });
    updateOverlay(card);
  } catch { card.report = null; }
}
function scheduleScan() { clearTimeout(scanTimer); scanTimer = setTimeout(() => { for (const card of state.cards) scanCard(card); displayReport(state.cards[0]); }, 100); }
function check(message, ok) {
  const row = document.createElement('div'); row.className = `check ${ok ? '' : 'warning'}`;
  const symbol = document.createElement('b'); symbol.textContent = ok ? '✓' : '⚠'; row.append(symbol, document.createTextNode(message)); return row;
}
const issueTypes = { overflow: 'Horizontal overflow', text: '작은 텍스트', safe: 'Safe Area 침범 가능', fixed: '화면 밖 fixed 요소', clipped: '콘텐츠 잘림 가능' };
function displayReport(card) {
  if (!card?.report) return;
  const r = card.report;
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
function loadHTML(html, filename, source) {
  if (new Blob([html]).size > 2 * 1024 * 1024) return toast('HTML은 최대 2MB까지 열 수 있습니다.');
  state.html = html; state.filename = filename; $('filename').textContent = filename; $('source-state').textContent = source; render();
}
async function openFile(file) {
  if (!file || !/\.html?$/i.test(file.name)) return toast('.html 또는 .htm 파일을 선택해 주세요.');
  if (file.size > 2 * 1024 * 1024) return toast('HTML은 최대 2MB까지 열 수 있습니다.');
  try { loadHTML(await file.text(), file.name, '로컬 파일'); } catch { toast('파일을 읽지 못했습니다.'); }
}
$('open').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => { openFile($('file').files[0]); $('file').value = ''; });
$('paste').addEventListener('click', () => { $('code').value = state.html; $('paste-dialog').showModal(); });
$('apply-code').addEventListener('click', () => { if (!$('code').value.trim()) return toast('HTML 코드를 입력해 주세요.'); loadHTML($('code').value, 'pasted-content.html', '붙여넣은 코드'); $('paste-dialog').close(); });
document.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); $('canvas').classList.add('dragover'); } });
document.addEventListener('dragleave', e => { if (!e.relatedTarget) $('canvas').classList.remove('dragover'); });
document.addEventListener('drop', e => { e.preventDefault(); $('canvas').classList.remove('dragover'); openFile(e.dataTransfer.files[0]); });
$('device').addEventListener('change', render);
for (const id of ['width', 'height']) $(id).addEventListener('change', () => {
  const width = $('width').value, height = $('height').value;
  if (!validDimension(width) || !validDimension(height)) { toast('크기는 240–2048 사이의 정수여야 합니다.'); $('width').value = currentProfile().width; $('height').value = currentProfile().height; return; }
  state.custom = state.landscape ? { width: Number(height), height: Number(width) } : { width: Number(width), height: Number(height) };
  $('device').value = 'custom'; render();
});
$('rotate').addEventListener('click', () => { state.landscape = !state.landscape; render(); });
$('scale').addEventListener('change', scaleCards);
$('reload').addEventListener('click', render);
$('safe').addEventListener('change', scheduleScan);
$('inspect').addEventListener('change', () => { $('panel').hidden = !$('inspect').checked; if (!$('inspect').checked) { state.cards.forEach(c => { c.selected = null; updateOverlay(c); }); } scaleCards(); });
$('min-font').addEventListener('change', () => { const n = Number($('min-font').value); if (!Number.isFinite(n) || n < 6 || n > 32) { $('min-font').value = 12; toast('최소 글자 기준은 6–32px입니다.'); } scheduleScan(); });
$('rescan').addEventListener('click', scheduleScan);
$('clear-box').addEventListener('click', () => { state.cards.forEach(c => { c.selected = null; updateOverlay(c); }); displayReport(state.cards[0]); });
new ResizeObserver(scaleCards).observe($('canvas'));
render();
